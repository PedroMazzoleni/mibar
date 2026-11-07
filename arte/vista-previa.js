// Vista previa del taller de sprites (solo en desarrollo, no entra en el build).
import paletaJson from './paleta.json';

const paleta = paletaJson.colores;
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
    tarjeta.innerHTML = `<h2>${sprite.nombre}</h2><small>${sprite.ancho}×${sprite.alto}, ${estado}<br>${sprite.notas ?? ''}</small>`;
    const lienzos = document.createElement('div');
    lienzos.className = 'lienzos';
    try {
      for (const frame of sprite.frames) {
        lienzos.append(dibujar(sprite, frame, Number(zoom.value), rejilla.checked));
      }
      // Tamaño aproximado al que se verá en el juego (zoom ×4 sobre 320×180)
      lienzos.append(dibujar(sprite, sprite.frames[0], 4, false));
    } catch (e) {
      lienzos.innerHTML = `<span class="error">${e.message}</span>`;
    }
    tarjeta.append(lienzos);
    cont.append(tarjeta);
  }
}

[zoom, fondo, rejilla].forEach((el) => el.addEventListener('input', pintar));
pintarPaleta();
pintar();