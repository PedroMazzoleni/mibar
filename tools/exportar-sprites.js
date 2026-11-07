// Convierte arte/sprites/*.json en PNG dentro de public/assets/sprites/.
// Sin dependencias: escribe el PNG a mano con zlib de Node.
// Uso: npm run sprites            → exporta todos
//      npm run sprites -- nombre  → exporta solo ese
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';
import process from 'node:process';

const ORIGEN = 'arte/sprites';
const DESTINO = 'public/assets/sprites';
// La paleta es una lista [{ char, hex, nombre }]; se indexa por carácter
const paleta = Object.fromEntries(
  JSON.parse(readFileSync('arte/paleta.json', 'utf8')).map(({ char, hex, nombre }) => [
    char,
    { hex, nombre },
  ]),
);

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
  const longitud = Buffer.alloc(4);
  longitud.writeUInt32BE(datos.length);
  const tipoYDatos = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(tipoYDatos));
  return Buffer.concat([longitud, tipoYDatos, crc]);
}

function colorRgba(caracter, nombre, fila, columna) {
  const color = paleta[caracter];
  if (!color) {
    throw new Error(
      `${nombre}: carácter "${caracter}" fuera de la paleta (fila ${fila}, columna ${columna})`,
    );
  }
  if (color.hex === null) return [0, 0, 0, 0];
  const n = parseInt(color.hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

function exportar(sprite) {
  const { nombre, ancho, alto, frames } = sprite;
  frames.forEach((frame, f) => {
    if (frame.length !== alto) {
      throw new Error(
        `${nombre}: el frame ${f} tiene ${frame.length} filas y deberían ser ${alto}`,
      );
    }
    frame.forEach((fila, y) => {
      if (fila.length !== ancho) {
        throw new Error(
          `${nombre}: frame ${f}, fila ${y} mide ${fila.length} y debería medir ${ancho}`,
        );
      }
    });
  });

  // Spritesheet horizontal: frame 0 | frame 1 | ...
  const anchoTotal = ancho * frames.length;
  const filas = [];
  for (let y = 0; y < alto; y++) {
    const fila = [0]; // byte de filtro "ninguno"
    frames.forEach((frame) => {
      for (let x = 0; x < ancho; x++) fila.push(...colorRgba(frame[y][x], nombre, y, x));
    });
    filas.push(Buffer.from(fila));
  }

  const cabecera = Buffer.alloc(13);
  cabecera.writeUInt32BE(anchoTotal, 0);
  cabecera.writeUInt32BE(alto, 4);
  cabecera[8] = 8; // bits por canal
  cabecera[9] = 6; // RGBA

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloque('IHDR', cabecera),
    bloque('IDAT', deflateSync(Buffer.concat(filas))),
    bloque('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(join(DESTINO, `${nombre}.png`), png);
  const plural = frames.length > 1 ? 's' : '';
  console.log(`✔ ${nombre}.png (${anchoTotal}×${alto}, ${frames.length} frame${plural})`);
}

mkdirSync(DESTINO, { recursive: true });
const pedido = process.argv[2];
const archivos = readdirSync(ORIGEN).filter(
  (a) => a.endsWith('.json') && (!pedido || a === `${pedido}.json`),
);
if (archivos.length === 0) {
  console.error(pedido ? `No existe ${ORIGEN}/${pedido}.json` : `No hay sprites en ${ORIGEN}`);
  process.exit(1);
}
for (const archivo of archivos) {
  exportar(JSON.parse(readFileSync(join(ORIGEN, archivo), 'utf8')));
}
