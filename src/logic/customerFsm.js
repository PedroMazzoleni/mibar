// Máquina de estados del cliente. Lógica pura, sin Phaser. Las funciones no mutan: devuelven copias.
import { findPath } from './pathfinding.js';

export const STATES = [
  'entering',
  'walkingToSeat',
  'ordering',
  'waiting',
  'consuming',
  'paying',
  'leaving',
  'gone',
];

// Duraciones provisionales en ms (pasarán a JSON en 3.5)
export const CONSUME_MS = 6000;
export const PAY_MS = 1500;

// Transición por estado: evento -> estado siguiente
const TRANSITIONS = {
  entering: { arrived: 'walkingToSeat' },
  walkingToSeat: { arrived: 'ordering' },
  ordering: { orderTaken: 'waiting' },
  waiting: { served: 'consuming' },
  consuming: { finishedEating: 'paying' },
  paying: { paid: 'leaving' },
  leaving: { leftBar: 'gone' },
};

// Con tipo (customers.json) toma sus tiempos; sin tipo usa las constantes por defecto
export function createCustomer(id, entrance, type, order = null) {
  return {
    id,
    state: 'entering',
    entrance,
    seat: null,
    route: [],
    typeId: type?.id ?? null,
    order,
    timers: { consuming: type?.consumeMs ?? CONSUME_MS, paying: type?.payMs ?? PAY_MS },
  };
}

// Un evento inválido en el estado actual devuelve el cliente sin cambios
export function advance(customer, event) {
  const next = TRANSITIONS[customer.state]?.[event];
  return next ? { ...customer, state: next } : customer;
}

// Asigna sitio al recién llegado; sin sitio (null) se marcha directamente
export function assignSeat(customer, seat) {
  if (customer.state !== 'entering') return customer;
  if (!seat) return { ...customer, state: 'leaving' };
  return advance({ ...customer, seat }, 'arrived');
}

// Descuenta el tiempo de consumir y pasa a 'paying' cuando se agota.
// En 'paying' el cliente espera sin límite a que le cobren (evento 'paid'):
// timers.paying queda solo como dato por ahora.
export function tick(customer, dtMs) {
  if (customer.state !== 'consuming') return customer;
  const left = Math.max(0, customer.timers.consuming - dtMs);
  const c = { ...customer, timers: { ...customer.timers, consuming: left } };
  return left > 0 ? c : advance(c, 'finishedEating');
}

// Los clientes solo entran con el bar abierto
export function canEnter(barStatus) {
  return Boolean(barStatus?.open);
}

const SEAT_TYPES = ['silla', 'taburete'];
const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

// Casilla transitable junto a un asiento (los asientos ocupan su casilla): desde ahí se sienta.
// Con `from`, exige además que haya ruta hasta ella.
function standTile(nav, seat, from) {
  for (const [dc, dr] of NEIGHBORS) {
    const stand = { col: seat.col + dc, row: seat.row + dr };
    if (!nav.walkable[stand.row]?.[stand.col]) continue;
    if (!from || findPath(nav, from, stand)) return stand;
  }
  return null;
}

// Primer asiento (silla/taburete) libre y alcanzable, con su casilla de acceso `stand`; o null.
// seats: muebles {type,col,row}; taken: lista de {col,row} ocupadas; from: casilla de salida.
export function pickSeat(nav, seats, taken, from = null) {
  for (const s of seats) {
    if (!SEAT_TYPES.includes(s.type)) continue;
    if (taken.some((t) => t.col === s.col && t.row === s.row)) continue;
    const stand = standTile(nav, s, from);
    if (stand) return { col: s.col, row: s.row, type: s.type, stand };
  }
  return null;
}

// Casilla de entrada: la del punto (gc, gr) si se pisa; si no, la transitable más cercana de la sala
export function spawnTile(nav, point, room = 'sala') {
  const base = { col: Math.floor(point.gc), row: Math.floor(point.gr) };
  if (nav.walkable[base.row]?.[base.col]) return base;
  let best = null;
  let bestDist = Infinity;
  for (let row = 0; row < nav.rows; row++) {
    for (let col = 0; col < nav.cols; col++) {
      if (!nav.walkable[row][col] || nav.room[row][col] !== room) continue;
      const d = Math.abs(col - base.col) + Math.abs(row - base.row);
      if (d < bestDist) {
        bestDist = d;
        best = { col, row };
      }
    }
  }
  return best;
}
