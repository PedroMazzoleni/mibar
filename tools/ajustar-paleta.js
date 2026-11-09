// Ajusta un PNG a arte/paleta.json: cada píxel visible pasa al color de paleta más cercano.
// La transparencia se respeta (el canal alfa no cambia). Sin dependencias: PNG con zlib de Node.
// Uso: npm run paleta -- <entrada.png> [salida.png]
//      sin salida escribe <entrada>.paleta.png al lado (lo que muestra "Aprobados" en sprites.html)
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync, deflateSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

const FIRMA = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// ---------- paleta
export function leerPaleta(ruta = 'arte/paleta.json') {
  return JSON.parse(readFileSync(ruta, 'utf8'))
    .filter((p) => p.hex)
    .map(({ char, hex, nombre }) => ({ char, hex: hex.toLowerCase(), nombre, rgb: hexARgb(hex) }));
}

export function hexARgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const rgbAHex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

// Color de paleta más cercano (distancia euclídea en RGB)
export function colorMasCercano(rgb, paleta) {
  let mejor = null;
  let dMin = Infinity;
  for (const p of paleta) {
    const d = (rgb[0] - p.rgb[0]) ** 2 + (rgb[1] - p.rgb[1]) ** 2 + (rgb[2] - p.rgb[2]) ** 2;
    if (d < dMin) {
      dMin = d;
      mejor = p;
    }
  }
  return mejor;
}

// Ajusta píxeles RGBA (Uint8Array) en el sitio. Devuelve los colores cambiados:
// [{ de, a, char, pixeles }] ordenados por número de píxeles
export function ajustarPixeles(rgba, paleta) {
  const cambios = new Map();
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] === 0) continue;
    const origen = [rgba[i], rgba[i + 1], rgba[i + 2]];
    const destino = colorMasCercano(origen, paleta);
    const de = rgbAHex(origen);
    if (de === destino.hex) continue;
    [rgba[i], rgba[i + 1], rgba[i + 2]] = destino.rgb;
    const c = cambios.get(de) ?? { de, a: destino.hex, char: destino.char, pixeles: 0 };
    c.pixeles++;
    cambios.set(de, c);
  }
  return [...cambios.values()].sort((x, y) => y.pixeles - x.pixeles);
}

// ---------- PNG: lectura (8 bits; RGBA, RGB, gris, gris+alfa e indexado) y escritura RGBA
function bloques(buf) {
  if (!buf.subarray(0, 8).equals(FIRMA)) throw new Error('no es un PNG');
  const lista = [];
  for (let p = 8; p < buf.length;) {
    const largo = buf.readUInt32BE(p);
    lista.push({
      tipo: buf.toString('ascii', p + 4, p + 8),
      datos: buf.subarray(p + 8, p + 8 + largo),
    });
    p += 12 + largo;
  }
  return lista;
}

const CANALES = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

export function leerPng(buf) {
  const lista = bloques(buf);
  const ihdr = lista.find((b) => b.tipo === 'IHDR').datos;
  const ancho = ihdr.readUInt32BE(0);
  const alto = ihdr.readUInt32BE(4);
  const [bits, tipoColor, , , entrelazado] = ihdr.subarray(8, 13);
  if (bits !== 8) throw new Error(`solo PNG de 8 bits por canal (este tiene ${bits})`);
  if (entrelazado) throw new Error('PNG entrelazado no soportado');
  const canales = CANALES[tipoColor];
  if (!canales) throw new Error(`tipo de color ${tipoColor} no soportado`);
  const plte = lista.find((b) => b.tipo === 'PLTE')?.datos;
  const trns = lista.find((b) => b.tipo === 'tRNS')?.datos;
  const crudo = inflateSync(
    Buffer.concat(lista.filter((b) => b.tipo === 'IDAT').map((b) => b.datos)),
  );

  // Deshacer los filtros de cada fila
  const bpp = canales;
  const paso = ancho * bpp;
  const pix = Buffer.alloc(paso * alto);
  for (let y = 0; y < alto; y++) {
    const filtro = crudo[y * (paso + 1)];
    const fila = crudo.subarray(y * (paso + 1) + 1, (y + 1) * (paso + 1));
    for (let x = 0; x < paso; x++) {
      const a = x >= bpp ? pix[y * paso + x - bpp] : 0;
      const b = y > 0 ? pix[(y - 1) * paso + x] : 0;
      const c = x >= bpp && y > 0 ? pix[(y - 1) * paso + x - bpp] : 0;
      let pred = 0;
      if (filtro === 1) pred = a;
      else if (filtro === 2) pred = b;
      else if (filtro === 3) pred = (a + b) >> 1;
      else if (filtro === 4) {
        const p = a + b - c;
        const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)];
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      pix[y * paso + x] = (fila[x] + pred) & 255;
    }
  }

  // Pasar a RGBA
  const rgba = new Uint8Array(ancho * alto * 4);
  for (let i = 0; i < ancho * alto; i++) {
    const s = pix.subarray(i * bpp, i * bpp + bpp);
    let r, g, b, a;
    if (tipoColor === 6) [r, g, b, a] = s;
    else if (tipoColor === 2) [r, g, b, a] = [s[0], s[1], s[2], 255];
    else if (tipoColor === 0) [r, g, b, a] = [s[0], s[0], s[0], 255];
    else if (tipoColor === 4) [r, g, b, a] = [s[0], s[0], s[0], s[1]];
    else {
      [r, g, b] = plte.subarray(s[0] * 3, s[0] * 3 + 3);
      a = trns && s[0] < trns.length ? trns[s[0]] : 255;
    }
    rgba.set([r, g, b, a], i * 4);
  }
  return { ancho, alto, rgba };
}

// Tabla para el CRC32 que exige cada bloque del PNG
const tablaCrc = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  tablaCrc[n] = c >>> 0;
}
function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = tablaCrc[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function bloque(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const tipoYDatos = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(tipoYDatos));
  return Buffer.concat([largo, tipoYDatos, crc]);
}

export function escribirPng({ ancho, alto, rgba }) {
  const cabecera = Buffer.alloc(13);
  cabecera.writeUInt32BE(ancho, 0);
  cabecera.writeUInt32BE(alto, 4);
  cabecera[8] = 8;
  cabecera[9] = 6;
  const filas = Buffer.alloc((ancho * 4 + 1) * alto);
  for (let y = 0; y < alto; y++)
    filas.set(rgba.subarray(y * ancho * 4, (y + 1) * ancho * 4), y * (ancho * 4 + 1) + 1);
  return Buffer.concat([
    FIRMA,
    bloque('IHDR', cabecera),
    bloque('IDAT', deflateSync(filas)),
    bloque('IEND', Buffer.alloc(0)),
  ]);
}

// Lee un PNG, lo ajusta a la paleta, escribe la copia y devuelve los colores cambiados
export function ajustarArchivo(
  entrada,
  salida = entrada.replace(/\.png$/i, '.paleta.png'),
  paleta = leerPaleta(),
) {
  const img = leerPng(readFileSync(entrada));
  const cambios = ajustarPixeles(img.rgba, paleta);
  writeFileSync(salida, escribirPng(img));
  return { salida, cambios };
}

// ---------- uso desde la terminal
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [entrada, salida] = process.argv.slice(2);
  if (!entrada) {
    console.error('Uso: npm run paleta -- <entrada.png> [salida.png]');
    process.exit(1);
  }
  const res = ajustarArchivo(entrada, salida);
  console.log(`✔ ${res.salida}`);
  if (res.cambios.length === 0) console.log('  ya estaba dentro de la paleta');
  for (const c of res.cambios) console.log(`  ${c.de} → ${c.a} (${c.char}) · ${c.pixeles} px`);
}
