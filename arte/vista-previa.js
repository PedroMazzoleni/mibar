// Vista previa del taller de sprites (solo en desarrollo, no entra en el build).
import paletaJson from './paleta.json';

// La paleta es una lista [{ char, hex, nombre }]; se indexa por carácter
const paleta = Object.fromEntries(
  paletaJson.map(({ char, hex, nombre }) => [char, { hex, nombre }]),
);
const sprites = Object.values(
  import.meta.glob('./sprites/*.json', { eager: true, import: 'default' }),
);

const zoom = document.querySelector('#zoom');
const fondo = document.querySelector('#fondo');
const rejilla = document.querySelector('#rejilla');

// Recordar los controles entre recargas
try {
  const guardado = JSON.parse(localStorage.getItem('taller-sprites') ?? '{}');
  if (guardado.zoom) zoom.value = guardado.zoom;
  if (guardado.fondo) fondo.value = guardado.fondo;
  if (guardado.rejilla !== undefined) rejilla.checked = guardado.rejilla;
} catch {
  /* sin preferencias guardadas */
}

function guardar() {
  try {
    localStorage.setItem(
      'taller-sprites',
      JSON.stringify({ zoom: zoom.value, fondo: fondo.value, rejilla: rejilla.checked }),
    );
  } catch {
    /* no pasa nada */
  }
}

function pintarFondo(ctx, w, h, escala) {
  if (fondo.value === 'tablero') {
    const t = Math.max(4, escala);
    for (let y = 0; y < h; y += t) {
      for (let x = 0; x < w; x += t) {
        ctx.fillStyle = (x / t + y / t) % 2 ? '#7f909c' : '#b3c0c6';
        ctx.fillRect(x, y, t, t);
      }
    }
  } else {
    ctx.fillStyle = fondo.value === 'suelo' ? '#7a5236' : '#f4ead2';
    ctx.fillRect(0, 0, w, h);
  }
}

function dibujar(sprite, frame, escala, conRejilla) {
  const lienzo = document.createElement('canvas');
  lienzo.width = sprite.ancho * escala;
  lienzo.height = sprite.alto * escala;
  const ctx = lienzo.getContext('2d');
  pintarFondo(ctx, lienzo.width, lienzo.height, escala);
  frame.forEach((fila, y) => {
    [...fila].forEach((c, x) => {
      const color = paleta[c];
      if (!color) throw new Error(`carácter "${c}" fuera de la paleta (fila ${y}, columna ${x})`);
      if (color.hex === null) return;
      ctx.fillStyle = color.hex;
      ctx.fillRect(x * escala, y * escala, escala, escala);
    });
  });
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

function pintar() {
  guardar();
  const cont = document.querySelector('#sprites');
  cont.innerHTML = '';
  if (sprites.length === 0) {
    cont.textContent = 'Todavía no hay sprites. Pídele uno a Claude con /sprite.';
    return;
  }
  for (const sprite of sprites) {
    const tarjeta = document.createElement('section');
    tarjeta.className = 'sprite';
    const estado =
      sprite.estado === 'aprobado' ? '<span class="aprobado">aprobado</span>' : 'borrador';
    tarjeta.innerHTML = `<h2>${sprite.titulo ?? sprite.nombre}</h2><small>${sprite.ancho}×${sprite.alto}, ${estado}<br>${sprite.notas ?? ''}</small>`;
    const lienzos = document.createElement('div');
    lienzos.className = 'lienzos';
    try {
      sprite.frames.forEach((frame, f) => {
        const lienzo = dibujar(sprite, frame, Number(zoom.value), rejilla.checked);
        // Con etiquetas (p. ej. un tileset), cada frame lleva su nombre en español debajo
        const etiqueta = sprite.etiquetas?.[f];
        if (!etiqueta) return lienzos.append(lienzo);
        const figura = document.createElement('figure');
        const pie = document.createElement('figcaption');
        pie.textContent = etiqueta;
        figura.append(lienzo, pie);
        lienzos.append(figura);
      });
      // Tamaño aproximado al que se verá en el juego (zoom ×3 sobre 640×360)
      lienzos.append(dibujar(sprite, sprite.frames[0], 3, false));
    } catch (e) {
      lienzos.innerHTML = `<span class="error">${e.message}</span>`;
    }
    tarjeta.append(lienzos);
    cont.append(tarjeta);
  }
}

// Mapas de Tiled que se enseñan debajo de los sprites
const MAPAS = ['bar.tmj'];
const ESCALA_MAPA = 2;

// Dibuja las capas de casillas y los objetos-casilla de un mapa con los frames del tileset
function dibujarMapa(mapa) {
  const t = mapa.tilewidth;
  const lienzo = document.createElement('canvas');
  lienzo.width = mapa.width * t * ESCALA_MAPA;
  lienzo.height = mapa.height * t * ESCALA_MAPA;
  const ctx = lienzo.getContext('2d');
  ctx.fillStyle = '#1e1a1d';
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  // Cada gid apunta a un frame del sprite que se llama como el tileset
  const casillas = new Map();
  for (const ts of mapa.tilesets) {
    const sprite = sprites.find((s) => s.nombre === ts.name);
    if (!sprite) throw new Error(`no hay sprite "${ts.name}" para el tileset del mapa`);
    sprite.frames.forEach((frame, f) => casillas.set(ts.firstgid + f, { sprite, frame }));
  }
  const pintarCasilla = (gid, x, y) => {
    const casilla = casillas.get(gid);
    if (!casilla) return;
    casilla.frame.forEach((fila, fy) => {
      [...fila].forEach((c, fx) => {
        const hex = paleta[c]?.hex;
        if (!hex) return;
        ctx.fillStyle = hex;
        ctx.fillRect((x + fx) * ESCALA_MAPA, (y + fy) * ESCALA_MAPA, ESCALA_MAPA, ESCALA_MAPA);
      });
    });
  };
  for (const capa of mapa.layers) {
    if (!capa.visible) continue;
    if (capa.type === 'tilelayer') {
      capa.data.forEach((gid, i) =>
        pintarCasilla(gid, (i % capa.width) * t, Math.floor(i / capa.width) * t),
      );
    } else if (capa.type === 'objectgroup') {
      // En Tiled los objetos-casilla se anclan por la esquina inferior izquierda
      for (const o of capa.objects) if (o.gid) pintarCasilla(o.gid, o.x, o.y - o.height);
    }
  }
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

[zoom, fondo, rejilla].forEach((el) => el.addEventListener('input', pintar));
pintarPaleta();
pintar();
pintarMapas();
