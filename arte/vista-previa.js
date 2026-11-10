// Vista previa del taller de sprites (solo en desarrollo, no entra en el build).
// Vite sirve sprites.html con este script: lee los archivos de arte/ y public/ en directo,
// así que la página se actualiza sola al cambiar un sprite, un PNG o un mapa.
//   Secciones: sprites de texto · pendientes de revisión · hojas · mapas
import paletaJson from './paleta.json';
import { gridToScreen, mapOrigin, mapPixelSize, depthOf } from '../src/logic/iso.js';
import { readFurniture } from '../src/logic/tiledMap.js';

// La paleta es una lista [{ char, hex, nombre }]; se indexa por carácter
const paleta = Object.fromEntries(
  paletaJson.map(({ char, hex, nombre }) => [char, { hex, nombre }]),
);
const hexPaleta = new Set(paletaJson.filter((p) => p.hex).map((p) => p.hex.toLowerCase()));
const sprites = Object.values(
  import.meta.glob('./sprites/*.json', { eager: true, import: 'default' }),
);
// import.meta.glob solo admite literales: una llamada por carpeta
const pendientesPng = import.meta.glob('./pixellab/pendientes/*/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});
const pendientesMeta = import.meta.glob('./pixellab/pendientes/*/meta.json', {
  eager: true,
  import: 'default',
});
const hojasPng = import.meta.glob('./hojas/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});
const hojasJson = import.meta.glob('./hojas/*.json', { eager: true, import: 'default' });

const zoom = document.querySelector('#zoom');
const fondo = document.querySelector('#fondo');
const rejilla = document.querySelector('#rejilla');
const apoyo = document.querySelector('#apoyo');

// Recordar los controles entre recargas
try {
  const guardado = JSON.parse(localStorage.getItem('taller-sprites') ?? '{}');
  if (guardado.zoom) zoom.value = guardado.zoom;
  if (guardado.fondo) fondo.value = guardado.fondo;
  if (guardado.rejilla !== undefined) rejilla.checked = guardado.rejilla;
  if (guardado.apoyo) apoyo.value = guardado.apoyo;
} catch {
  /* sin preferencias guardadas */
}

function guardar() {
  try {
    localStorage.setItem(
      'taller-sprites',
      JSON.stringify({
        zoom: zoom.value,
        fondo: fondo.value,
        rejilla: rejilla.checked,
        apoyo: apoyo.value,
      }),
    );
  } catch {
    /* no pasa nada */
  }
}

// ---------- utilidades de dibujo (siempre sin suavizado)
function nuevoLienzo(ancho, alto) {
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { lienzo, ctx };
}

function cuadros(ctx, w, h, t) {
  for (let y = 0; y < h; y += t) {
    for (let x = 0; x < w; x += t) {
      ctx.fillStyle = (x / t + y / t) % 2 ? '#7f909c' : '#b3c0c6';
      ctx.fillRect(x, y, t, t);
    }
  }
}

function pintarFondo(ctx, w, h, escala) {
  if (fondo.value === 'tablero') cuadros(ctx, w, h, Math.max(4, escala));
  else {
    ctx.fillStyle = fondo.value === 'suelo' ? '#7a5236' : '#f4ead2';
    ctx.fillRect(0, 0, w, h);
  }
}

// Pinta un frame de texto (un carácter por píxel) en (x, y) a la escala dada
function pintarFrame(ctx, frame, x0, y0, escala) {
  frame.forEach((fila, y) => {
    [...fila].forEach((c, x) => {
      const color = paleta[c];
      if (!color) throw new Error(`carácter "${c}" fuera de la paleta (fila ${y}, columna ${x})`);
      if (color.hex === null) return;
      ctx.fillStyle = color.hex;
      ctx.fillRect((x0 + x) * escala, (y0 + y) * escala, escala, escala);
    });
  });
}

function dibujar(sprite, frame, escala, conRejilla) {
  const { lienzo, ctx } = nuevoLienzo(sprite.ancho * escala, sprite.alto * escala);
  pintarFondo(ctx, lienzo.width, lienzo.height, escala);
  pintarFrame(ctx, frame, 0, 0, escala);
  if (conRejilla && escala >= 6) {
    ctx.strokeStyle = 'rgba(30, 26, 29, 0.25)';
    for (let x = 0; x <= sprite.ancho; x++) {
      ctx.beginPath();
      ctx.moveTo(x * escala + 0.5, 0);
      ctx.lineTo(x * escala + 0.5, lienzo.height);
      ctx.stroke();
    }
    for (let y = 0; y <= sprite.alto; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * escala + 0.5);
      ctx.lineTo(lienzo.width, y * escala + 0.5);
      ctx.stroke();
    }
  }
  return lienzo;
}

function figura(lienzo, texto) {
  const f = document.createElement('figure');
  const pie = document.createElement('figcaption');
  pie.textContent = texto;
  f.append(lienzo, pie);
  return f;
}

function vacio(cont, texto = 'vacío') {
  const p = document.createElement('p');
  p.className = 'vacio';
  p.textContent = texto;
  cont.append(p);
}

// ---------- suelo isométrico de prueba: 3×3 rombos de 32×16 con t/u
// (si la paleta aún no tiene t/u, dos cremas de la paleta hasta que se añadan)
const SUELO = { n: 3, w: 32, h: 16, arriba: 40 };
const colorSuelo = (char, reserva) => paleta[char]?.hex ?? paleta[reserva].hex;
const SUELO_A = colorSuelo('t', '8');
const SUELO_B = colorSuelo('u', '7');

// Lienzo con el suelo de prueba; `pintar(ctx, punto)` coloca lo que haga falta encima
function sueloDePrueba(pintar, escala = 3) {
  const { n, w, h, arriba } = SUELO;
  const ancho = n * w;
  const alto = n * h + arriba;
  const { lienzo, ctx } = nuevoLienzo(ancho * escala, alto * escala);
  ctx.scale(escala, escala);
  ctx.fillStyle = '#1e1a1d';
  ctx.fillRect(0, 0, ancho, alto);
  const origen = { x: ancho / 2, y: arriba };
  const punto = (gc, gr) => gridToScreen(gc, gr, origen);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const esq = [punto(c, r), punto(c + 1, r), punto(c + 1, r + 1), punto(c, r + 1)];
      ctx.beginPath();
      esq.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = (c + r) % 2 ? SUELO_B : SUELO_A;
      ctx.fill();
    }
  }
  pintar(ctx, punto);
  return lienzo;
}

// Un sprite de texto en la casilla central: los frames de casilla (32 de ancho y alto múltiplo de 16)
// se apoyan en la esquina inferior del rombo; los objetos pequeños, en su centro
function spriteSobreSuelo(sprite, frame) {
  return sueloDePrueba((ctx, punto) => {
    const deCasilla = sprite.ancho === 32 && sprite.alto >= 32 && sprite.alto % 16 === 0;
    const apoyo = deCasilla ? punto(2, 2) : punto(1.5, 1.5);
    pintarFrame(
      ctx,
      frame,
      Math.round(apoyo.x - sprite.ancho / 2),
      Math.round(apoyo.y - sprite.alto),
      1,
    );
  });
}

// PNG sobre el suelo de prueba, anclado por la esquina superior de su tapa (meta.json).
// Los suelos se repiten en las 9 casillas; el resto va solo en la central.
function pngSobreSuelo(img, anclaje, repetir) {
  return sueloDePrueba((ctx, punto) => {
    const casillas = [];
    for (let r = 0; r < SUELO.n; r++) for (let c = 0; c < SUELO.n; c++) casillas.push([c, r]);
    const usadas = repetir ? casillas : [[1, 1]];
    usadas.sort((a, b) => depthOf(...a) - depthOf(...b));
    for (const [c, r] of usadas) {
      const p = punto(c, r);
      ctx.drawImage(img, Math.round(p.x - anclaje.x), Math.round(p.y - anclaje.y));
    }
  });
}

// Objeto pequeño (comida, bebida…) apoyado en el centro de la tapa de un mueble del tileset.
// El centro de la tapa está 8 px por debajo de su esquina de atrás (el primer píxel opaco de la
// columna central del frame)
const MUEBLES_APOYO = {
  barra: 'barra',
  encimera: 'encimera',
  mesa: 'mesa (centro)',
};
function sobreMueble(sprite, frame, mueble, escala = 3) {
  const tiles = sprites.find((s) => s.etiquetas?.includes(MUEBLES_APOYO[mueble]));
  if (!tiles) throw new Error(`no hay "${MUEBLES_APOYO[mueble]}" en ningún tileset`);
  const base = tiles.frames[tiles.etiquetas.indexOf(MUEBLES_APOYO[mueble])];
  const arriba = Math.max(0, sprite.alto - (base.findIndex((f) => f[16] !== '.') + 8) + 4);
  const { lienzo, ctx } = nuevoLienzo(tiles.ancho * escala, (tiles.alto + arriba) * escala);
  ctx.fillStyle = '#1e1a1d';
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  pintarFrame(ctx, base, 0, arriba, escala);
  const centroTapa = arriba + base.findIndex((f) => f[16] !== '.') + 8;
  // la base del plato o del vaso asoma un poco por delante del centro de la tapa
  pintarFrame(ctx, frame, tiles.ancho / 2 - sprite.ancho / 2, centroTapa + 3 - sprite.alto, escala);
  return lienzo;
}

// Muestra: un tramo de barra con bebidas y una mesa con tapas, montados con piezas del tileset.
// Las casillas avanzan por el eje x de la rejilla (+16, +8 px). Cada objeto se apoya en el centro
// de la tapa de su casilla, con un pequeño desplazamiento (dx, dy) para que no se pisen.
const MUESTRAS = [
  {
    titulo: 'Barra',
    piezas: ['barra', 'barra', 'barra', 'barra'],
    objetos: [
      ['cerveza', 0, 0, 0],
      ['copa de vino', 1, 0, 0],
      ['café', 2, 0, 0],
      ['bravas con salsa y alioli', 3, 0, 0],
    ],
  },
  {
    titulo: 'Mesa',
    piezas: ['mesa (izquierda)', 'mesa (centro)', 'mesa (derecha)'],
    objetos: [
      ['olivas', 0, -4, -1],
      ['patatas chips', 1, -6, -1],
      ['ensaladilla rusa', 1, 6, 2],
      ['bravas con salsa y alioli', 2, 2, 0],
    ],
  },
];
function pintarMuestras() {
  const cont = document.querySelector('#muestras');
  cont.innerHTML = '';
  const comida = sprites.find((s) => s.nombre === 'comida');
  const tiles = sprites.find((s) => s.etiquetas?.includes('barra'));
  const escala = 4;
  for (const { titulo, piezas, objetos } of MUESTRAS) {
    try {
      if (!comida || !tiles) throw new Error('faltan los sprites "comida" o "bar-tiles"');
      const frameDe = (s, nombre) => {
        const i = s.etiquetas.indexOf(nombre);
        if (i < 0) throw new Error(`no hay "${nombre}" en ${s.nombre}`);
        return s.frames[i];
      };
      const margen = 16;
      const ancho = tiles.ancho + 16 * (piezas.length - 1) + margen * 2;
      const alto = tiles.alto + 8 * (piezas.length - 1) + margen * 2;
      const { lienzo, ctx } = nuevoLienzo(ancho * escala, alto * escala);
      ctx.fillStyle = '#1e1a1d';
      ctx.fillRect(0, 0, lienzo.width, lienzo.height);
      const origen = (i) => [margen + 16 * i, margen + 8 * i];
      piezas.forEach((p, i) => pintarFrame(ctx, frameDe(tiles, p), ...origen(i), escala));
      // el quinto campo opcional es el sprite del que sale el objeto (por defecto, "comida")
      for (const [nombre, casilla, dx, dy, deSprite = 'comida'] of objetos) {
        const origenSprite =
          deSprite === 'comida' ? comida : sprites.find((s) => s.nombre === deSprite);
        if (!origenSprite) throw new Error(`no existe el sprite "${deSprite}"`);
        const base = frameDe(tiles, piezas[casilla]);
        const [x, y] = origen(casilla);
        const centroTapa = y + base.findIndex((f) => f[16] !== '.') + 8;
        const frame = frameDe(origenSprite, nombre);
        pintarFrame(
          ctx,
          frame,
          x + tiles.ancho / 2 - origenSprite.ancho / 2 + dx,
          centroTapa + 3 - origenSprite.alto + dy,
          escala,
        );
      }
      cont.append(figura(lienzo, titulo));
    } catch (e) {
      const error = document.createElement('p');
      error.className = 'error';
      error.textContent = `${titulo}: ${e.message}`;
      cont.append(error);
    }
  }
}

// ---------- PNG: carga, escala y colores fuera de paleta
function cargarImagen(url) {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => mal(new Error(`no se pudo cargar ${url}`));
    img.src = url;
  });
}

function coloresFueraDePaleta(img) {
  const { ctx } = nuevoLienzo(img.width, img.height);
  ctx.drawImage(img, 0, 0);
  const datos = ctx.getImageData(0, 0, img.width, img.height).data;
  const fuera = new Map();
  let opacos = 0;
  for (let i = 0; i < datos.length; i += 4) {
    if (datos[i + 3] === 0) continue;
    opacos++;
    const hex = '#' + [0, 1, 2].map((k) => datos[i + k].toString(16).padStart(2, '0')).join('');
    if (!hexPaleta.has(hex)) fuera.set(hex, (fuera.get(hex) ?? 0) + 1);
  }
  const pixFuera = [...fuera.values()].reduce((a, b) => a + b, 0);
  return { fuera: [...fuera.entries()].sort((a, b) => b[1] - a[1]), pixFuera, opacos };
}

function lienzoEscalado(img, escala, conCuadros = false) {
  const { lienzo, ctx } = nuevoLienzo(img.width * escala, img.height * escala);
  if (conCuadros) cuadros(ctx, lienzo.width, lienzo.height, 8);
  else pintarFondo(ctx, lienzo.width, lienzo.height, escala);
  ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
  return lienzo;
}

// Aviso de paleta: cuántos colores se salen y cuáles (muestras con su hex)
function avisoPaleta(pal) {
  const div = document.createElement('div');
  if (pal.fuera.length === 0) {
    div.innerHTML = '<span class="aprobado">dentro de paleta</span>';
    return div;
  }
  div.innerHTML = `<span class="fuera">se sale de paleta: ${pal.fuera.length} colores, ${pal.pixFuera}/${pal.opacos} px</span>`;
  const lista = document.createElement('div');
  lista.className = 'colores-fuera';
  for (const [hex, px] of pal.fuera) {
    const m = document.createElement('span');
    m.className = 'color-fuera';
    m.title = `${hex} · ${px} px`;
    m.style.background = hex;
    lista.append(m);
  }
  div.append(lista);
  return div;
}

// ---------- paleta
function pintarPaleta() {
  const cont = document.querySelector('#paleta');
  cont.innerHTML = '';
  for (const [c, { hex, nombre }] of Object.entries(paleta)) {
    const muestra = document.createElement('div');
    muestra.className = 'muestra';
    muestra.title = `${c}: ${nombre}`;
    muestra.textContent = c;
    muestra.style.background = hex ?? 'transparent';
    muestra.style.color = hex && parseInt(hex.slice(1), 16) > 0x888888 ? '#1e1a1d' : '#f4ead2';
    cont.append(muestra);
  }
}

// ---------- a) sprites de texto
// En un tileset, las variantes numeradas ("suelo de gres 1", "suelo de gres 2"…) se agrupan:
// se enseña la primera y cuántas hay
function framesVisibles(sprite) {
  const grupos = new Map();
  sprite.frames.forEach((frame, f) => {
    const etiqueta = sprite.etiquetas?.[f];
    const base = etiqueta?.replace(/ \d+$/, '') ?? `#${f}`;
    if (!grupos.has(base)) grupos.set(base, { frame, etiqueta: etiqueta && base, total: 0 });
    grupos.get(base).total++;
  });
  return [...grupos.values()];
}

function pintar() {
  guardar();
  const cont = document.querySelector('#sprites');
  cont.innerHTML = '';
  if (sprites.length === 0) return vacio(cont, 'vacío · pídele uno a Claude con /sprite');
  for (const sprite of sprites) {
    const tarjeta = document.createElement('section');
    tarjeta.className = 'sprite';
    const estado =
      sprite.estado === 'aprobado' ? '<span class="aprobado">aprobado</span>' : 'borrador';
    tarjeta.innerHTML = `<h2>${sprite.titulo ?? sprite.nombre}</h2><small>${sprite.ancho}×${sprite.alto} · ${sprite.frames.length} frame${sprite.frames.length > 1 ? 's' : ''}, ${estado}<br>${sprite.notas ?? ''}</small>`;
    const lienzos = document.createElement('div');
    lienzos.className = 'lienzos';
    try {
      const objetoPequeno = sprite.ancho <= 16 && sprite.alto <= 16;
      for (const { frame, etiqueta, total } of framesVisibles(sprite)) {
        const lienzo =
          objetoPequeno && apoyo.value !== 'ninguno'
            ? sobreMueble(sprite, frame, apoyo.value)
            : dibujar(sprite, frame, Number(zoom.value), rejilla.checked);
        if (!etiqueta) lienzos.append(lienzo);
        else lienzos.append(figura(lienzo, total > 1 ? `${etiqueta} (×${total})` : etiqueta));
      }
      // Tamaño al que se verá en el juego (×4 sobre 480×270) y sobre el suelo de prueba
      lienzos.append(
        figura(dibujar(sprite, sprite.frames[0], 4, false), 'en el juego (×4)'),
        figura(spriteSobreSuelo(sprite, sprite.frames[0]), 'suelo de prueba (×3)'),
      );
    } catch (e) {
      lienzos.innerHTML = `<span class="error">${e.message}</span>`;
    }
    tarjeta.append(lienzos);
    cont.append(tarjeta);
  }
}

// ---------- b) pendientes de revisión: arte/pixellab/pendientes/<asset>/{v1.png…, meta.json}
async function pintarPendientes() {
  const cont = document.querySelector('#pendientes');
  cont.innerHTML = '';
  const assets = new Map();
  for (const [ruta, url] of Object.entries(pendientesPng)) {
    const [, asset, variante] = ruta.match(/pendientes\/([^/]+)\/([^/]+)\.png$/);
    if (!assets.has(asset)) assets.set(asset, []);
    assets.get(asset).push({ variante, url });
  }
  if (assets.size === 0) return vacio(cont);
  for (const [asset, variantes] of assets) {
    const meta = pendientesMeta[`./pixellab/pendientes/${asset}/meta.json`] ?? {};
    const esSuelo = /suelo/i.test(`${asset} ${meta.tipo ?? ''}`);
    variantes.sort((a, b) => a.variante.localeCompare(b.variante, 'es', { numeric: true }));
    // Frames actuales del tileset que esta propuesta sustituiría (meta.reemplaza: etiquetas)
    const actuales = (meta.reemplaza ?? []).flatMap((etiqueta) =>
      sprites
        .filter((s) => s.etiquetas?.includes(etiqueta))
        .map((s) => ({ etiqueta, sprite: s, frame: s.frames[s.etiquetas.indexOf(etiqueta)] })),
    );
    if (meta.geometria?.plataforma)
      cont.insertAdjacentHTML(
        'beforeend',
        `<p class="pendiente-nota"><b>${asset}:</b> ${meta.geometria.plataforma}</p>`,
      );
    for (const { variante, url } of variantes) {
      const datos = meta.variantes?.[variante] ?? {};
      const anclaje = datos.anclaje ?? meta.geometria?.anclaje ?? { x: 16, y: 0 };
      const tarjeta = document.createElement('section');
      tarjeta.className = 'sprite';
      try {
        const img = await cargarImagen(url);
        tarjeta.innerHTML = `<h2>${asset} ${variante}</h2><small>${img.width}×${img.height} px</small>`;
        tarjeta.append(avisoPaleta(coloresFueraDePaleta(img)));
        const prompt = datos.prompt ?? meta.prompt;
        if (prompt)
          tarjeta.insertAdjacentHTML(
            'beforeend',
            `<p class="pendiente-nota"><b>Prompt:</b> ${prompt}</p>`,
          );
        if (datos.nota)
          tarjeta.insertAdjacentHTML('beforeend', `<p class="pendiente-nota">${datos.nota}</p>`);
        const lienzos = document.createElement('div');
        lienzos.className = 'lienzos';
        lienzos.append(
          figura(lienzoEscalado(img, 1), '×1'),
          figura(lienzoEscalado(img, 4), '×4'),
          figura(pngSobreSuelo(img, anclaje, esSuelo), 'suelo de prueba (×3)'),
          ...actuales.map(({ etiqueta, sprite, frame }) =>
            figura(spriteSobreSuelo(sprite, frame), `actual: ${etiqueta} (×3)`),
          ),
        );
        tarjeta.append(lienzos);
      } catch (e) {
        tarjeta.innerHTML = `<h2>${asset} ${variante}</h2><span class="error">${e.message}</span>`;
      }
      cont.append(tarjeta);
    }
  }
}

// ---------- d) hojas: arte/hojas/<nombre>.png + <nombre>.json (formato de Aseprite / TexturePacker)
function celdasDeHoja(json, img) {
  if (json?.frames) {
    const lista = Array.isArray(json.frames) ? json.frames : Object.values(json.frames);
    return lista.map((f) => f.frame ?? f);
  }
  // Sin JSON de frames: rejilla con frameWidth/frameHeight, o la imagen entera
  const w = json?.frameWidth ?? img.width;
  const h = json?.frameHeight ?? img.height;
  const celdas = [];
  for (let y = 0; y + h <= img.height; y += h)
    for (let x = 0; x + w <= img.width; x += w) celdas.push({ x, y, w, h });
  return celdas;
}

async function pintarHojas() {
  const cont = document.querySelector('#hojas');
  cont.innerHTML = '';
  const hojas = Object.entries(hojasPng);
  if (hojas.length === 0) return vacio(cont);
  for (const [ruta, url] of hojas) {
    const nombre = ruta.match(/hojas\/([^/]+)\.png$/)[1];
    const json = hojasJson[`./hojas/${nombre}.json`];
    const tarjeta = document.createElement('section');
    tarjeta.className = 'sprite';
    try {
      const img = await cargarImagen(url);
      const celdas = celdasDeHoja(json, img);
      tarjeta.innerHTML = `<h2>${nombre}</h2><small>${img.width}×${img.height} px · ${celdas.length} celdas${json ? '' : ' · sin .json'}</small>`;
      const lienzos = document.createElement('div');
      lienzos.className = 'lienzos';
      celdas.forEach((c, i) => {
        const { lienzo, ctx } = nuevoLienzo(c.w * 4, c.h * 4);
        cuadros(ctx, lienzo.width, lienzo.height, 8);
        ctx.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, lienzo.width, lienzo.height);
        lienzos.append(figura(lienzo, `#${i}`));
      });
      tarjeta.append(lienzos);
    } catch (e) {
      tarjeta.innerHTML = `<h2>${nombre}</h2><span class="error">${e.message}</span>`;
    }
    cont.append(tarjeta);
  }
}

// ---------- mapas de Tiled (isométricos), dibujados como en BarScene
const MAPAS = ['bar.tmj'];
const ESCALA_MAPA = 2;

function dibujarMapa(mapa) {
  const origen = mapOrigin(mapa.height);
  const tam = mapPixelSize(mapa.width, mapa.height);
  const { lienzo, ctx } = nuevoLienzo(tam.width * ESCALA_MAPA, tam.height * ESCALA_MAPA);
  ctx.fillStyle = '#1e1a1d';
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  // Cada gid apunta a un frame del sprite que se llama como el tileset
  const casillas = new Map();
  for (const ts of mapa.tilesets) {
    const sprite = sprites.find((s) => s.nombre === ts.name);
    if (!sprite) throw new Error(`no hay sprite "${ts.name}" para el tileset del mapa`);
    sprite.frames.forEach((frame, f) => casillas.set(ts.firstgid + f, { sprite, frame }));
  }
  // Cada frame se apoya por el centro de abajo en la esquina inferior del rombo de su casilla
  const pintarCasilla = ({ gid, col, row }) => {
    const casilla = casillas.get(gid);
    if (!casilla) return;
    const abajo = gridToScreen(col + 1, row + 1, origen);
    pintarFrame(
      ctx,
      casilla.frame,
      abajo.x - casilla.sprite.ancho / 2,
      abajo.y - casilla.sprite.alto,
      ESCALA_MAPA,
    );
  };
  // Mismo orden que BarScene: pared del fondo, mueble y zócalo dentro de cada casilla
  const SUB = { paredes: 0, zocalos: 5 };
  const dibujables = [];
  for (const capa of mapa.layers) {
    if (!capa.visible || capa.type !== 'tilelayer') continue;
    capa.data.forEach((gid, i) => {
      if (!gid) return;
      const col = i % capa.width;
      const row = Math.floor(i / capa.width);
      const orden = capa.name === 'suelo' ? -1 : depthOf(col, row) * 10 + (SUB[capa.name] ?? 0);
      dibujables.push({ gid, col, row, orden });
    });
  }
  readFurniture(mapa).forEach((m, i) => {
    const gid = m.frame + mapa.tilesets[0].firstgid;
    dibujables.push({
      gid,
      col: m.col,
      row: m.row,
      orden: depthOf(m.col, m.row) * 10 + 2 + i / 1000,
    });
  });
  dibujables.sort((a, b) => a.orden - b.orden).forEach(pintarCasilla);
  return lienzo;
}

async function pintarMapas() {
  const cont = document.querySelector('#mapas');
  cont.innerHTML = '';
  for (const nombre of MAPAS) {
    const titulo = document.createElement('h2');
    titulo.textContent = nombre;
    cont.append(titulo);
    try {
      const resp = await fetch(`${import.meta.env.BASE_URL}assets/maps/${nombre}`, {
        cache: 'no-store',
      });
      if (!resp.ok) throw new Error(`no se pudo cargar ${nombre} (${resp.status})`);
      cont.append(dibujarMapa(await resp.json()));
    } catch (e) {
      const error = document.createElement('span');
      error.className = 'error';
      error.textContent = e.message;
      cont.append(error);
    }
  }
}

[zoom, fondo, rejilla, apoyo].forEach((el) => el.addEventListener('input', pintar));
fondo.addEventListener('input', pintarPendientes);
pintarPaleta();
pintar();
pintarMuestras();
pintarPendientes();
pintarHojas();
pintarMapas();
