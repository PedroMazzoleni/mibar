// Genera el bar isométrico a partir del arte 2D de referencia.
//   entrada: arte/referencia/bar-tiles-2d.json (tileset 3/4 anterior, frames con etiqueta)
//   salida:  arte/sprites/bar-tiles.json (frames de 32×48) y public/assets/maps/bar.tmj (Tiled iso 32×16)
// Uso: node tools/generar-bar-iso.js && npm run sprites -- bar-tiles
import { readFileSync, writeFileSync } from 'node:fs';
import { leerPng, rgbAHex } from './ajustar-paleta.js';

const REF = JSON.parse(readFileSync('arte/referencia/bar-tiles-2d.json', 'utf8'));
const ref = (etiqueta) => {
  const i = REF.etiquetas.indexOf(etiqueta);
  if (i < 0) throw new Error(`no hay "${etiqueta}" en el tileset de referencia`);
  return REF.frames[i];
};
// Sprites altos de dos casillas en el 2D: se juntan arriba + abajo
const alto = (nombre) => [...ref(`${nombre} (arriba)`), ...ref(`${nombre} (abajo)`)];

// ---------- lienzo de un frame: rombo de la casilla abajo, esquina de arriba en (16, TOP)
const W = 32;
const H = 48;
const TOP = 32;
const lienzo = () => Array.from({ length: H }, () => Array(W).fill('.'));
const filas = (c) => c.map((f) => f.join(''));
const pixel = (tex, x, y) => tex[Math.floor(y)]?.[Math.floor(x)] ?? '.';
const pon = (c, x, y, ch) => {
  if (ch !== '.' && y >= 0 && y < H && x >= 0 && x < W) c[y][x] = ch;
};

// Un tono más oscuro de cada color de la paleta (caras en sombra)
const OSCURO = {
  9: '8',
  8: 'X',
  7: '6',
  X: 'J',
  6: '5',
  5: '4',
  4: '3',
  3: '2',
  2: '1',
  1: '0',
  q: 'n',
  n: 'z',
  z: '0',
  G: 'q',
  C: 'G',
  g: 'f',
  f: 'e',
  e: 'd',
  d: '0',
  T: 'g',
  E: 'f',
  H: 'z',
  J: '2',
  D: '7',
  c: 'b',
  b: 'a',
  a: '0',
  V: 'R',
  R: 'S',
  S: 'd',
  W: 'F',
  F: 'a',
  B: 'A',
  U: 'A',
  A: 'z',
  r: 's',
  s: 'U',
  Q: 'f',
  Z: 'W',
  Y: 'B',
  '=': '6',
  '#': '7',
  '+': '4',
  '*': 'U',
  '%': 'B',
  '@': 'G',
  K: 'L',
  L: 'M',
  M: 'N',
  N: 'P',
  P: 'z',
};
const oscuro = (ch, n = 1) => {
  for (let i = 0; i < n; i++) ch = OSCURO[ch] ?? ch;
  return ch;
};

// ---------- caras en coordenadas de rejilla: (u, v) en [0,1) dentro de la casilla, z = altura en px
// Cara de arriba a la altura z de un rectángulo [u0,u1)×[v0,v1)
function cara_arriba(c, z, [u0, u1, v0, v1], muestra) {
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      const a = (X + 0.5 - 16) / 16;
      const b = (Y + 0.5 + z - TOP) / 8;
      const u = (b + a) / 2;
      const v = (b - a) / 2;
      if (u >= u0 && u < u1 && v >= v0 && v < v1)
        pon(c, X, Y, muestra((u - u0) / (u1 - u0), (v - v0) / (v1 - v0), X, Y));
    }
}
// Cara sur (plano v = v1, mira abajo a la izquierda): s recorre u, t va de arriba (0) a abajo (1)
function cara_sur(c, v1, [u0, u1], [z0, z1], muestra) {
  for (let X = 0; X < W; X++) {
    const u = (X + 0.5 - 16) / 16 + v1;
    if (u < u0 || u >= u1) continue;
    for (let Y = 0; Y < H; Y++) {
      const z = TOP + (u + v1) * 8 - (Y + 0.5);
      if (z >= z0 && z < z1) pon(c, X, Y, muestra((u - u0) / (u1 - u0), (z1 - z) / (z1 - z0)));
    }
  }
}
// Cara este (plano u = u1, mira abajo a la derecha): s recorre v
function cara_este(c, u1, [v0, v1], [z0, z1], muestra) {
  for (let X = 0; X < W; X++) {
    const v = u1 - (X + 0.5 - 16) / 16;
    if (v < v0 || v >= v1) continue;
    for (let Y = 0; Y < H; Y++) {
      const z = TOP + (u1 + v) * 8 - (Y + 0.5);
      if (z >= z0 && z < z1) pon(c, X, Y, muestra((v - v0) / (v1 - v0), (z1 - z) / (z1 - z0)));
    }
  }
}

// Bloque con caras sur, este y arriba; `bordes` pinta de tinta las aristas de delante
function bloque(c, { u = [0, 1], v = [0, 1], z = [0, 16], arriba, sur, este, bordes = true }) {
  const [u0, u1] = u;
  const [v0, v1] = v;
  cara_sur(c, v1, u, z, sur);
  cara_este(c, u1, v, z, este ?? ((s, t) => oscuro(sur(s, t))));
  cara_arriba(c, z[1], [u0, u1, v0, v1], arriba);
  if (!bordes) return;
  const tinta = () => '0';
  cara_sur(c, v1, u, [z[0], z[0] + 1], tinta);
  cara_este(c, u1, v, [z[0], z[0] + 1], tinta);
  // arista vertical de la esquina de delante
  const X = Math.round(16 + (u1 - v1) * 16) - 1;
  for (let zz = z[0]; zz < z[1]; zz++) pon(c, X, Math.floor(TOP + (u1 + v1) * 8 - zz - 0.5), '0');
}

// Muestreo de una zona de un frame 2D: (s, t) en [0,1) → carácter
const zona =
  (tex, x0, y0, x1, y1, relleno = null) =>
  (s, t) => {
    const ch = pixel(tex, x0 + s * (x1 - x0), y0 + t * (y1 - y0));
    return ch === '.' && relleno ? relleno : ch;
  };

// Pega un sprite 2D (su caja no transparente) escalado, centrado en cx y apoyado en `abajo`
function pegar(c, tex, { escala = 1, cx = 16, abajo = 43 } = {}) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -1, -1];
  tex.forEach((fila, y) =>
    [...fila].forEach((ch, x) => {
      if (ch === '.') return;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }),
  );
  const ancho = Math.round((x1 - x0 + 1) * escala);
  const altoP = Math.round((y1 - y0 + 1) * escala);
  const izq = Math.round(cx - ancho / 2);
  for (let y = 0; y < altoP; y++)
    for (let x = 0; x < ancho; x++)
      pon(c, izq + x, abajo - altoP + 1 + y, pixel(tex, x0 + x / escala, y0 + y / escala));
}

// ---------- suelos con luz cálida
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
// Tres niveles de luz por tono: bajo la lámpara, normal y en penumbra
const RAMPA = {
  9: ['9', '9', '8'],
  8: ['9', '8', '7'],
  7: ['8', '7', '6'],
  X: ['X', '6', '6'],
  6: ['6', '5', '5'],
};
const LUCES = [];
const RADIO = 3;
// El tramado solo aparece en una franja estrecha entre niveles, para que el suelo se lea limpio
function nivelLuz(gc, gr, X, Y) {
  let b = 0;
  for (const l of LUCES) b = Math.max(b, 1 - Math.hypot(gc - l.gc, gr - l.gr) / RADIO);
  const f = (1 - Math.max(0, b)) * 2.2;
  const tramado = (BAYER[Y % 4][X % 4] / 16 - 0.47) * 0.5;
  return Math.max(0, Math.min(2, Math.round(f - 0.5 + tramado)));
}
// Suelo de baldosas: 2×2 baldosas por casilla en dos tonos alternos; la junta del borde
// de la casilla, más marcada, dibuja el rombo para que la rejilla se lea al jugar
function sueloBaldosas(col, row, { claro, oscuro: os, junta, borde, sinLuz = false }) {
  const c = lienzo();
  cara_arriba(c, 0, [0, 1, 0, 1], (u, v, X, Y) => {
    const ju = u < 1 / 32 || Math.abs(u - 0.5) < 1 / 32;
    const jv = v < 1 / 32 || Math.abs(v - 0.5) < 1 / 32;
    let ch;
    if (u < 1 / 32 || v < 1 / 32) ch = borde;
    else if (ju || jv) ch = junta;
    else ch = u < 0.5 === v < 0.5 ? claro : os;
    if (sinLuz) return ch;
    return (RAMPA[ch] ?? [ch, ch, ch])[nivelLuz(col + u, row + v, X, Y)];
  });
  return c;
}

// ---------- paredes del fondo (norte y oeste) con la textura 2D de 32×64 (parte alta + baja)
// Fuera: 24 px. Tabiques entre salas: 12 px para ver lo de detrás; el de detrás de la barra,
// con las botellas y la puerta de la cocina, se queda alto.
const ALTO = { exterior: 24, tabique: 12 };
const sobre = (base, encima) =>
  base.map((f, y) =>
    [...f].map((ch, x) => (encima[y]?.[x] && encima[y][x] !== '.' ? encima[y][x] : ch)).join(''),
  );
const MADERA_ALTA = ref('pared (parte alta)');
const MADERA_BAJA = ref('pared (parte baja)');
const CREMA_ALTA = ref('pared crema (alta)');
const CREMA_BAJA = ref('pared crema (baja)');
const TEXTURAS_PARED = {
  madera: [...MADERA_ALTA, ...MADERA_BAJA],
  crema: [...CREMA_ALTA, ...CREMA_BAJA],
  'madera con urinario': [...MADERA_ALTA, ...sobre(MADERA_BAJA, ref('urinario'))],
  'crema con estantería': [...CREMA_ALTA, ...sobre(CREMA_BAJA, ref('estantería con botellas'))],
  'crema con puerta': [...CREMA_ALTA, ...ref('puerta')],
  'crema con puerta de la calle (izq.)': [...CREMA_ALTA, ...ref('puerta de la calle (izq.)')],
  'crema con puerta de la calle (der.)': [...CREMA_ALTA, ...ref('puerta de la calle (der.)')],
};
// La textura se apoya abajo (zócalo en el suelo) a 2 filas por píxel de altura; `hueco` deja
// una puerta abierta entre dos jambas
function pared(c, lado, textura, alto, hueco = false) {
  const tex = TEXTURAS_PARED[textura];
  for (let X = 0; X < W; X++) {
    const norte = lado === 'norte';
    if (norte ? X < 16 : X >= 16) continue;
    // s recorre la pared desde la esquina del fondo (arriba del rombo)
    const s = norte ? (X + 0.5 - 16) / 16 : (16 - (X + 0.5)) / 16;
    if (hueco && s > 0.15 && s < 0.85) continue;
    const base = TOP + s * 8;
    for (let Y = 0; Y < H; Y++) {
      const z = base - (Y + 0.5);
      if (z < 0 || z > alto + 1) continue;
      let ch;
      if (z >= alto) ch = '0';
      else if (z >= alto - 1) ch = '5';
      else ch = pixel(tex, s * 32, 64 - z * 2);
      // la pared oeste mira a la derecha: más en sombra
      pon(c, X, Y, norte || z >= alto - 1 ? ch : oscuro(ch));
    }
  }
}
// Zócalo bajo en los bordes de delante (sur y este) que dan a la calle
const ZOCALO = ['0', '2', '3', '3', '5'];
function zocalo(c, lado) {
  const muestra = (s, t) => ZOCALO[Math.min(4, Math.floor((1 - t) * 5))];
  if (lado === 'sur') cara_sur(c, 1, [0, 1], [0, 5], muestra);
  else cara_este(c, 1, [0, 1], [0, 5], (s, t) => oscuro(muestra(s, t)));
}

// ---------- muebles
const BARRA = ref('barra');
const barra = () => {
  const c = lienzo();
  bloque(c, {
    z: [0, 18],
    arriba: zona(BARRA, 0, 3, 32, 17),
    sur: zona(BARRA, 0, 19, 32, 31),
    bordes: false,
  });
  cara_sur(c, 1, [0, 1], [0, 1], () => '0');
  cara_este(c, 1, [0, 1], [0, 1], () => '0');
  return c;
};
// Torre de cerveza: bandeja de goteo, columna cromada, travesaño con medallón y dos tiradores
function tirador() {
  const c = barra();
  const cromo = { arriba: () => '9', sur: () => 'g', este: () => 'f' };
  bloque(c, {
    u: [0.15, 0.85],
    v: [0.55, 0.85],
    z: [18, 19],
    arriba: (s) => (Math.floor(s * 8) % 2 ? 'd' : 'e'),
    sur: () => 'f',
    bordes: false,
  });
  bloque(c, { u: [0.42, 0.58], v: [0.3, 0.46], z: [18, 28], ...cromo, bordes: false });
  bloque(c, {
    u: [0.15, 0.85],
    v: [0.3, 0.46],
    z: [28, 32],
    arriba: () => '9',
    sur: (s) => (s > 0.38 && s < 0.62 ? (s > 0.45 && s < 0.55 ? 'C' : 'r') : 'g'),
    este: () => 'f',
  });
  // caños hacia el cliente y tiradores negros con bola
  for (const u0 of [0.2, 0.66]) {
    bloque(c, { u: [u0, u0 + 0.12], v: [0.46, 0.56], z: [26, 28], ...cromo, bordes: false });
    bloque(c, {
      u: [u0, u0 + 0.12],
      v: [0.34, 0.44],
      z: [32, 36],
      arriba: () => 'z',
      sur: (s, t) => (t < 0.35 ? 'n' : 'z'),
      este: () => '0',
      bordes: false,
    });
  }
  return c;
}
// Caja registradora: cuerpo con cajón, teclado inclinado delante y visor verde detrás
function cajaRegistradora() {
  const c = barra();
  bloque(c, {
    u: [0.18, 0.82],
    v: [0.22, 0.82],
    z: [18, 22],
    arriba: () => 'f',
    sur: (s, t) =>
      t > 0.4 && t < 0.6 && s > 0.1 && s < 0.9 ? 'd' : s > 0.45 && s < 0.55 ? 'g' : 'e',
    este: () => 'd',
  });
  bloque(c, {
    u: [0.18, 0.82],
    v: [0.22, 0.6],
    z: [22, 25],
    arriba: (s, t) => ((Math.floor(s * 6) + Math.floor(t * 3)) % 2 ? 'g' : '9'),
    sur: () => 'e',
    este: () => 'd',
  });
  bloque(c, {
    u: [0.3, 0.7],
    v: [0.22, 0.36],
    z: [25, 32],
    arriba: () => 'e',
    sur: (s, t) => (s > 0.15 && s < 0.85 && t > 0.2 && t < 0.65 ? (s > 0.6 ? 'b' : 'c') : 'e'),
    este: () => 'd',
  });
  return c;
}
// Portezuela de madera para pasar detrás de la barra (no ocupa la casilla)
function portezuela() {
  const c = lienzo();
  bloque(c, {
    v: [0.42, 0.58],
    z: [0, 14],
    arriba: () => '6',
    sur: (s, t) => (t < 0.15 ? '5' : Math.floor(s * 6) % 2 ? 'q' : 'n'),
    este: () => 'n',
  });
  return c;
}
// Vitrina refrigerada de cristal curvo (cuarto de cilindro a lo largo de la barra), con tres
// bandejas de tapas dentro. Se pinta lanzando un rayo por píxel: el primer sólido que toca manda.
const vitrina = () => {
  const c = barra();
  const [U0, U1] = [0.04, 0.96];
  const [VB, VC, VF] = [0.3, 0.32, 0.82]; // pared de atrás, arranque de la curva, frente
  const [ZB, ZT] = [20, 27]; // suelo de la vitrina y techo del cristal
  const enU = (u) => u >= U0 && u <= U1;
  const zocalo = (u, v, z) => enU(u) && v >= VB - 0.02 && v <= VF && z >= 18 && z < ZB;
  const cupula = (u, v, z) => {
    if (!enU(u) || v < VB || v > VF || z < ZB || z > ZT) return false;
    if (v <= VC) return true;
    const dv = (v - VC) / (VF - VC);
    const dz = (z - ZB) / (ZT - ZB);
    return dv * dv + dz * dz <= 1;
  };
  // tres bandejas a lo largo de u: tortilla, jamón y ensaladilla con aceitunas
  const TAPAS = [
    { top: '6', lado: '5', mota: '7' },
    { top: '*', lado: 'U', mota: '%' },
    { top: '8', lado: '7', mota: 'b' },
  ];
  const bandeja = (u) => {
    const s = (u - U0) / (U1 - U0);
    const i = Math.min(2, Math.floor(s * 3));
    const local = s * 3 - i;
    return { i, borde: local < 0.1 || local > 0.9 };
  };
  const alturaTapa = (u, v) => {
    const { borde } = bandeja(u);
    if (borde || v < VB + 0.05 || v > VF - 0.12) return ZB + 0.5;
    return ZB + 2.5;
  };
  const tapa = (u, v, z) => enU(u) && v > VB && v < VF - 0.04 && z >= ZB && z < alturaTapa(u, v);

  const visto = Array.from({ length: H }, () => Array(W).fill(false));
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      const a = (X + 0.5 - 16) / 16;
      const punto = (v) => [v + a, v, TOP + (2 * v + a) * 8 - (Y + 0.5)];
      let cristal = null;
      let ch = null;
      for (let v = 1; v >= 0; v -= 0.002) {
        const [u, , z] = punto(v);
        const [uA, , zA] = punto(v + 0.002);
        if (!cristal && cupula(u, v, z)) {
          // entra por la tapa del extremo este (acero) o por el cristal
          if (uA > U1) {
            const t = (z - ZB) / (ZT - ZB);
            ch = t > 0.85 || v > VF - 0.03 ? 'e' : 'f';
            break;
          }
          const ang = v <= VC ? Math.PI / 2 : Math.atan2((z - ZB) / (ZT - ZB), (v - VC) / (VF - VC));
          cristal = { ang };
          continue;
        }
        if (tapa(u, v, z)) {
          const { i, borde } = bandeja(u);
          const arriba = zA >= alturaTapa(uA, v + 0.002);
          const t = TAPAS[i];
          if (borde) ch = arriba ? 'T' : 'g';
          else if (!arriba) ch = t.lado;
          else ch = (Math.floor(u * 40) * 7 + Math.floor(v * 40) * 3) % 5 === 0 ? t.mota : t.top;
          break;
        }
        if (cupula(u, v, z)) continue;
        if (zocalo(u, v, z)) {
          if (uA > U1) ch = 'e';
          else ch = zA >= ZB ? 'g' : z > 18.8 ? 'f' : 'e';
          break;
        }
        if (cristal) {
          ch = 'E'; // fondo del cristal sin nada detrás
          break;
        }
      }
      if (cristal) {
        // brillo del cristal: veta clara en la curva y tapa casi opaca
        const g = cristal.ang;
        if (g > 1.0 && g < 1.18) ch = '9';
        else if (g > 1.35) ch = ch === 'E' || !ch ? 'E' : (X + Y) % 2 ? 'E' : ch;
        else if (g < 0.12) ch = 'g';
        else ch = ch ?? 'E';
      }
      if (ch) {
        pon(c, X, Y, ch);
        visto[Y][X] = true;
      }
    }
  // contorno de acero por arriba y por los lados de la silueta
  for (let Y = 0; Y < H; Y++)
    for (let X = 0; X < W; X++) {
      if (!visto[Y][X]) continue;
      const fuera = (x, y) => !visto[y]?.[x];
      if (fuera(X, Y - 1) || fuera(X - 1, Y) || fuera(X + 1, Y)) pon(c, X, Y, 'e');
    }
  return c;
};

// Mesa de mármol por piezas a lo largo de las columnas; patas solo en las esquinas de fuera
const MESA = ref('mesa (centro)');
function mesa({ primera, ultima, servilletero }) {
  const c = lienzo();
  const pata = (u, v) => {
    const X = Math.round(16 + (u - v) * 16);
    const base = Math.round(TOP + (u + v) * 8);
    for (let Y = base - 13; Y < base; Y++) {
      pon(c, X - 1, Y, '0');
      pon(c, X, Y, 'd');
    }
  };
  if (primera) pata(0.1, 0.88);
  if (ultima) {
    pata(0.9, 0.88);
    pata(0.9, 0.12);
  }
  const borde = 0.1;
  bloque(c, {
    z: [11, 14],
    arriba: (u, v) => {
      if (v < borde || v > 1 - borde || (primera && u < borde) || (ultima && u > 1 - borde))
        return v < 0.5 && u < 0.5 ? '9' : '8';
      return pixel(MESA, 3 + u * 26, 4 + v * 10);
    },
    sur: (s, t) => ['8', '7', '6'][Math.min(2, Math.floor(t * 3))],
    bordes: false,
  });
  cara_sur(c, 1, [0, 1], [11, 12], () => '0');
  cara_este(c, 1, [0, 1], [11, 12], () => '0');
  if (servilletero)
    bloque(c, {
      u: [0.4, 0.62],
      v: [0.35, 0.55],
      z: [14, 19],
      arriba: () => 'X',
      sur: () => 'r',
      este: () => 's',
    });
  return c;
}

// Mueble de cocina: encimera o plancha
const encimera = (etiqueta, arriba, frente) => {
  const c = lienzo();
  const T = ref(etiqueta);
  bloque(c, { z: [0, 18], arriba: zona(T, ...arriba), sur: zona(T, ...frente), bordes: false });
  cara_sur(c, 1, [0, 1], [0, 1], () => '0');
  cara_este(c, 1, [0, 1], [0, 1], () => '0');
  return c;
};

// Cafetera de dos casillas sobre un mueble bajo, contra la pared del fondo
// Cuerpo de la cafetera en negro: los grises y blancos de la referencia pasan a tonos oscuros
const NEGRO = { 9: 'f', T: 'e', 8: 'e', g: 'd', f: '0', e: '1', d: '0' };
function cafetera(mitad) {
  const c = lienzo();
  const T = ref(`cafetera (${mitad})`).map((fila, y) =>
    y < 25 ? [...fila].map((ch) => NEGRO[ch] ?? ch).join('') : fila,
  );
  const ultima = mitad === 'der.';
  bloque(c, {
    z: [0, 12],
    arriba: () => 'g',
    sur: zona(T, 0, 25, 32, 31),
    este: () => 'n',
    bordes: false,
  });
  cara_sur(c, 1, [0, 1], [0, 1], () => '0');
  bloque(c, {
    u: ultima ? [0, 0.9] : [0.1, 1],
    v: [0.05, 0.55],
    z: [12, 30],
    arriba: zona(T, 0, 1, 32, 8, 'd'),
    sur: zona(T, 0, 2, 32, 21, 'd'),
    este: () => '0',
    bordes: false,
  });
  return c;
}

// Asset de PixelLab aprobado y ajustado a paleta (arte/pixellab/aprobados/<nombre>.paleta.png):
// ya viene en 32×48 con el centro inferior del rombo en (16, 48); se pasa a caracteres de paleta
const PALETA = Object.fromEntries(
  JSON.parse(readFileSync('arte/paleta.json', 'utf8'))
    .filter((p) => p.hex)
    .map((p) => [p.hex.toLowerCase(), p.char]),
);
function aprobado(nombre) {
  const ruta = `arte/pixellab/aprobados/${nombre}.paleta.png`;
  const { ancho, alto, rgba } = leerPng(readFileSync(ruta));
  if (ancho !== W || alto !== H) throw new Error(`${ruta} mide ${ancho}×${alto}, no ${W}×${H}`);
  const c = lienzo();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (!rgba[i + 3]) continue;
      const hex = rgbAHex([rgba[i], rgba[i + 1], rgba[i + 2]]);
      if (!PALETA[hex]) throw new Error(`${ruta}: ${hex} en (${x}, ${y}) no está en la paleta`);
      c[y][x] = PALETA[hex];
    }
  return c;
}

const pegado = (tex, escala, abajo = 43) => {
  const c = lienzo();
  pegar(c, tex, { escala, abajo });
  return c;
};

// ---------- baño en isométrico (loza blanca: tapa T, cara izquierda g, cara derecha f)
const loza = { arriba: () => 'T', sur: () => 'g', este: () => 'f' };
// Lavabo de pie contra la pared del fondo
function lavabo() {
  const c = lienzo();
  bloque(c, { u: [0.4, 0.6], v: [0.25, 0.45], z: [0, 12], ...loza });
  bloque(c, {
    u: [0.15, 0.85],
    v: [0.05, 0.55],
    z: [12, 17],
    arriba: (s, t) => (s > 0.2 && s < 0.8 && t > 0.25 && t < 0.8 ? (s < 0.45 ? 'g' : 'E') : '9'),
    sur: () => 'g',
    este: () => 'f',
  });
  // grifo
  for (let Y = 9; Y <= 12; Y++) pon(c, 16, Y, Y === 9 ? 'g' : 'f');
  pon(c, 17, 9, 'f');
  return c;
}
// Váter provisional contra la pared izquierda (oeste), mirando hacia +columna
function vaterIso() {
  const c = lienzo();
  bloque(c, { u: [0.05, 0.3], v: [0.25, 0.75], z: [0, 17], ...loza });
  bloque(c, {
    u: [0.3, 0.85],
    v: [0.3, 0.7],
    z: [0, 10],
    arriba: (s, t) => {
      const d = Math.hypot((s - 0.45) / 0.45, (t - 0.5) / 0.5);
      if (d < 0.55) return 'E';
      if (d < 0.8) return 'g';
      return 'T';
    },
    sur: () => 'g',
    este: () => 'f',
  });
  // pulsador de la cisterna
  pon(c, 11, 10, 'f');
  return c;
}

// ---------- plano del bar: B baño · K cocina · S sala · . fuera
// La cocina es 3 filas más honda que el baño: el tabique alto de detrás de la barra tapa las
// filas de suelo más cercanas y así se siguen viendo 4 filas de suelo de la cocina
const PLANO = [
  ...Array(3).fill('.....KKKKKKK....'),
  'BBBBBKKKKKKK....',
  'BBBBBKKKKKKK....',
  'BBBBBKKKKKKKSSSS',
  ...Array(13).fill('SSSSSSSSSSSSSSSS'),
];
const COLS = PLANO[0].length;
const ROWS = PLANO.length;
const sala = (c, r) => (c < 0 || r < 0 || c >= COLS || r >= ROWS ? '.' : PLANO[r][c]);
// Puertas en el borde norte de una casilla: [col, fila, textura de la pared]
// ('hueco': tabique bajo con el paso abierto entre dos jambas). Las puertas se ven enteras: 24 px
const PUERTAS_NORTE = new Map([
  ['1,6', 'crema con puerta'],
  ['7,6', 'crema con puerta'],
  ['12,5', 'crema con puerta de la calle (izq.)'],
  ['13,5', 'crema con puerta de la calle (der.)'],
]);
// Decoración en la pared norte de una casilla
const DECORADO_NORTE = new Map([
  ['2,3', 'madera con urinario'],
  ['3,3', 'madera con urinario'],
  ...[5, 6, 8, 9, 10, 11].map((c) => [`${c},6`, 'crema con estantería']),
]);
const texturaSala = (s) => (s === 'S' ? 'crema' : 'madera');
// Tabique de detrás de la barra (botellas y puerta de la cocina): alto como los de fuera
const TRASBARRA = (c, r) => r === 6 && c >= 5 && c <= 11;
const altoPared = (c, r, vecina, puerta = false) =>
  vecina === '.' || TRASBARRA(c, r) || puerta ? ALTO.exterior : ALTO.tabique;

// Mesas [col, fila, plazas]: dos filas con pasillos entre grupos
const MESAS = [
  [1, 13, 2],
  [3, 13, 4],
  [6, 13, 2],
  [8, 13, 4],
  [2, 17, 4],
  [6, 17, 4],
];
// Luces del techo (puntos de rejilla): mesas, barra, entrada, rincón y zona libre
for (const [x, fila, plazas] of MESAS) LUCES.push({ gc: x + plazas / 4, gr: fila + 0.5 });
for (const gc of [4.5, 7, 9.5]) LUCES.push({ gc, gr: 10 });
LUCES.push({ gc: 13, gr: 6 }, { gc: 1, gr: 6.8 }, { gc: 12, gr: 14 }, { gc: 11, gr: 17.5 });

// ---------- tileset: cada frame lleva etiqueta; los repetidos se reutilizan
const frames = [];
const etiquetas = [];
const propiedades = [];
const indice = new Map();
function frame(etiqueta, c, props) {
  const f = filas(c);
  const clave = f.join('|');
  if (indice.has(clave)) return indice.get(clave);
  frames.push(f);
  etiquetas.push(etiqueta);
  if (props) propiedades.push({ id: frames.length - 1, properties: props });
  indice.set(clave, frames.length);
  return frames.length;
}

// Muebles de una casilla: etiqueta → gid
const MUEBLES = {
  barra: frame('barra', barra()),
  vitrina: frame('vitrina de tapas', vitrina()),
  grifo: frame('grifo de cerveza', tirador()),
  caja: frame('caja registradora', cajaRegistradora()),
  portezuela: frame('portezuela de la barra', portezuela()),
  taburete: frame('taburete', pegado(ref('taburete'), 0.8)),
  'silla de frente': frame('silla de frente', pegado(ref('silla de frente'), 0.8)),
  'silla de espaldas': frame('silla de espaldas', pegado(ref('silla de espaldas'), 0.8)),
  'mesa (izquierda)': frame('mesa (izquierda)', mesa({ primera: true })),
  'mesa (centro)': frame('mesa (centro)', mesa({})),
  'mesa (derecha)': frame('mesa (derecha)', mesa({ ultima: true, servilletero: true })),
  'mesa de dos': frame('mesa de dos', mesa({ primera: true, ultima: true, servilletero: true })),
  encimera: frame('encimera', encimera('encimera', [0, 3, 32, 17], [0, 19, 32, 31])),
  plancha: frame('plancha', encimera('plancha', [4, 4, 28, 10], [3, 14, 29, 28])),
  'cafetera (izq.)': frame('cafetera (izq.)', cafetera('izq.')),
  'cafetera (der.)': frame('cafetera (der.)', cafetera('der.')),
  lavabo: frame('lavabo', lavabo()),
  vater: frame('váter (provisional)', vaterIso()),
  'tragaperras burdeos': frame('tragaperras burdeos', aprobado('tragaperras-burdeos')),
  'tragaperras azul': frame('tragaperras azul', aprobado('tragaperras-azul')),
  tabaco: frame('máquina de tabaco', aprobado('maquina-tabaco')),
  perchero: frame('perchero', pegado(alto('perchero'), 0.72)),
};

// Capas de casillas
const suelos = Array(COLS * ROWS).fill(0);
const paredes = Array(COLS * ROWS).fill(0);
const zocalos = Array(COLS * ROWS).fill(0);
const BALDOSAS = {
  S: { claro: '8', oscuro: '7', junta: 'X', borde: '6' },
  K: { claro: '9', oscuro: 'g', junta: 'f', borde: 'e' },
  B: { claro: 'T', oscuro: 'E', junta: 'g', borde: 'f' },
};
const NOMBRE_SUELO = { S: 'suelo de gres', K: 'baldosa de la cocina', B: 'baldosa del baño' };
for (let r = 0; r < ROWS; r++)
  for (let c = 0; c < COLS; c++) {
    const s = sala(c, r);
    if (s === '.') continue;
    const i = r * COLS + c;
    // Solo la sala tiene luz; en baño y cocina, la baldosa es siempre la misma
    suelos[i] =
      s === 'S'
        ? frame(`${NOMBRE_SUELO[s]} ${indice.size + 1}`, sueloBaldosas(c, r, BALDOSAS[s]))
        : frame(NOMBRE_SUELO[s], sueloBaldosas(0, 0, { ...BALDOSAS[s], sinLuz: true }));

    // Paredes del fondo: hacia fuera o hacia otra sala
    const norte = sala(c, r - 1) !== s;
    const oeste = sala(c - 1, r) !== s;
    if (norte || oeste) {
      const k = `${c},${r}`;
      const puerta = PUERTAS_NORTE.get(k);
      const hueco = puerta === 'hueco';
      const texN = (!hueco && puerta) || DECORADO_NORTE.get(k) || texturaSala(s);
      const texO = texturaSala(s);
      const altoN = altoPared(c, r, sala(c, r - 1), Boolean(puerta) && !hueco);
      const altoO = altoPared(c, r, sala(c - 1, r));
      const lienzoPared = lienzo();
      if (oeste) pared(lienzoPared, 'oeste', texO, altoO);
      if (norte) pared(lienzoPared, 'norte', texN, altoN, hueco);
      const partes = [
        norte && `norte ${hueco ? 'con hueco de puerta' : texN} (${altoN})`,
        oeste && `oeste ${texO} (${altoO})`,
      ].filter(Boolean);
      const props =
        PUERTAS_NORTE.has(k) && norte ? [{ name: 'puerta', type: 'string', value: 'norte' }] : null;
      paredes[i] = frame(`pared ${partes.join(' + ')}`, lienzoPared, props);
    }
    // Zócalo delante, solo donde acaba el local
    const sur = sala(c, r + 1) === '.';
    const este = sala(c + 1, r) === '.';
    if (sur || este) {
      const lz = lienzo();
      if (este) zocalo(lz, 'este');
      if (sur) zocalo(lz, 'sur');
      zocalos[i] = frame(
        `zócalo ${[sur && 'sur', este && 'este'].filter(Boolean).join(' + ')}`,
        lz,
      );
    }
  }

// ---------- muebles en el mapa: [etiqueta, tipo, col, fila]
const M = [];
const mueble = (etiqueta, tipo, c, r, props) => M.push([etiqueta, tipo, c, r, props]);
// baño
mueble('vater', 'vater', 0, 4);
mueble('lavabo', 'lavabo', 4, 3);
// cocina
for (let c = 5; c <= 11; c++)
  mueble(c === 7 ? 'plancha' : 'encimera', c === 7 ? 'plancha' : 'encimera', c, 0);
// detrás de la barra: cafetera en su mueble contra la pared
mueble('cafetera (izq.)', 'cafetera', 3, 6);
mueble('cafetera (der.)', 'cafetera', 4, 6);
// barra cerrada por los dos lados; deja tres filas detrás para que, pese al alto de la barra,
// se vea una fila de suelo libre entre la cafetera y la barra
const FILA_BARRA = 9;
for (let r = 6; r <= FILA_BARRA; r++) mueble('barra', 'barra', 2, r);
for (let c = 3; c <= 9; c++) {
  const encima = { 3: 'vitrina', 4: 'vitrina', 6: 'grifo', 7: 'grifo', 9: 'caja' }[c];
  mueble(encima ?? 'barra', encima ?? 'barra', c, FILA_BARRA);
}
// cerrada por la derecha: portezuela en (10, FILA_BARRA) y esquina + lateral en la columna 11
mueble('portezuela', 'portezuela', 10, FILA_BARRA, { ocupa: false });
for (let r = 6; r <= FILA_BARRA; r++) mueble('barra', 'barra', 11, r);
for (let c = 3; c <= 9; c++) mueble('taburete', 'taburete', c, FILA_BARRA + 1);
// comedor: seis mesas en dos filas, sillas detrás (de frente) y delante (de espaldas)
for (const [x, fila, plazas] of MESAS) {
  const ancho = plazas / 2;
  for (let i = 0; i < ancho; i++) {
    const pieza =
      ancho === 1
        ? 'mesa de dos'
        : i === 0
          ? 'mesa (izquierda)'
          : i === ancho - 1
            ? 'mesa (derecha)'
            : 'mesa (centro)';
    mueble('silla de frente', 'silla', x + i, fila - 1);
    mueble(pieza, 'mesa', x + i, fila);
    mueble('silla de espaldas', 'silla', x + i, fila + 1);
  }
}
// entrada
mueble('tragaperras burdeos', 'tragaperras', 14, 5);
mueble('perchero', 'perchero', 15, 5);
mueble('tabaco', 'tabaco', 15, 8);
mueble('tragaperras azul', 'tragaperras', 15, 11);

// ---------- escribir el tileset
const sprite = {
  nombre: 'bar-tiles',
  titulo: 'Casillas del bar (isométrico)',
  ancho: W,
  alto: H,
  estado: 'borrador',
  notas:
    'Tileset isométrico: rombo de 32×16 abajo y 32 px de alto encima. Generado con tools/generar-bar-iso.js a partir de arte/referencia/bar-tiles-2d.json.',
  etiquetas,
  frames,
};
writeFileSync('arte/sprites/bar-tiles.json', JSON.stringify(sprite, null, 2) + '\n');

// ---------- escribir el mapa de Tiled (isométrico; los objetos van en unidades de tileheight)
const TH = 16;
let id = 1;
const objetos = M.map(([etiqueta, tipo, c, r, props]) => ({
  id: id++,
  gid: MUEBLES[etiqueta],
  name: tipo,
  type: tipo,
  x: (c + 1) * TH,
  y: (r + 1) * TH,
  width: W,
  height: H,
  rotation: 0,
  visible: true,
  ...(props && {
    properties: Object.entries(props).map(([name, value]) => ({
      name,
      type: typeof value === 'boolean' ? 'bool' : 'string',
      value,
    })),
  }),
}));
const rect = (nombre, c, r, cols, rows) => ({
  id: id++,
  name: nombre,
  type: 'zona',
  x: c * TH,
  y: r * TH,
  width: cols * TH,
  height: rows * TH,
  rotation: 0,
  visible: true,
});
const zonas = [
  rect('baño', 0, 3, 5, 3),
  rect('cocina', 5, 0, 7, 6),
  rect('barra', 3, 6, 8, 3),
  rect('sala', 0, 6, 3, 3),
  rect('sala', 12, 5, 4, 4),
  rect('sala', 0, 9, 16, 10),
  {
    id: id++,
    name: 'entrada',
    type: 'punto',
    point: true,
    x: 13 * TH,
    y: 5.5 * TH,
    width: 0,
    height: 0,
    rotation: 0,
    visible: true,
  },
];
const capa = (lid, name, data) => ({
  id: lid,
  name,
  type: 'tilelayer',
  x: 0,
  y: 0,
  width: COLS,
  height: ROWS,
  opacity: 1,
  visible: true,
  data,
});
const grupo = (lid, name, objects) => ({
  id: lid,
  name,
  type: 'objectgroup',
  draworder: 'topdown',
  x: 0,
  y: 0,
  opacity: 1,
  visible: true,
  objects,
});
const mapa = {
  type: 'map',
  version: '1.10',
  tiledversion: '1.11.0',
  orientation: 'isometric',
  renderorder: 'right-down',
  width: COLS,
  height: ROWS,
  tilewidth: W,
  tileheight: TH,
  infinite: false,
  nextlayerid: 6,
  nextobjectid: id,
  layers: [
    capa(1, 'suelo', suelos),
    capa(2, 'paredes', paredes),
    capa(3, 'zocalos', zocalos),
    grupo(4, 'muebles', objetos),
    grupo(5, 'zonas', zonas),
  ],
  tilesets: [
    {
      firstgid: 1,
      name: 'bar-tiles',
      image: '../sprites/bar-tiles.png',
      imagewidth: frames.length * W,
      imageheight: H,
      tilewidth: W,
      tileheight: H,
      columns: frames.length,
      tilecount: frames.length,
      margin: 0,
      spacing: 0,
      tiles: propiedades,
    },
  ],
};
writeFileSync('public/assets/maps/bar.tmj', JSON.stringify(mapa, null, 1) + '\n');
console.log(`✔ ${frames.length} frames · mapa ${COLS}×${ROWS} · ${objetos.length} muebles`);
