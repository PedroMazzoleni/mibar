// Spawner de clientes según la hora. Lógica pura, sin Phaser; el rng se inyecta.
import { canEnter } from './customerFsm.js';

// PROVISIONAL (hasta 5.1): franjas horarias [desde, hasta] inclusive
const SLOTS = [
  { from: 8, to: 12, slot: 'normal' },
  { from: 13, to: 15, slot: 'rush' },
  { from: 16, to: 19, slot: 'quiet' },
  { from: 20, to: 23, slot: 'rush' },
];
const DEFAULT_SLOT = 'quiet';

// Milisegundos entre llegadas por franja (ajuste)
const SPAWN_INTERVAL_MS = { quiet: 20000, normal: 10000, rush: 5000 };
// Variación aleatoria del intervalo: ±20%
const VARIATION = 0.2;
// Límite provisional de clientes dentro a la vez
export const MAX_CUSTOMERS = 12;

export function hourSlot(hour) {
  return SLOTS.find((s) => hour >= s.from && hour <= s.to)?.slot ?? DEFAULT_SLOT;
}

export function spawnIntervalMs(slot) {
  return SPAWN_INTERVAL_MS[slot] ?? SPAWN_INTERVAL_MS[DEFAULT_SLOT];
}

// Factor de variación en [1 - VARIATION, 1 + VARIATION] a partir de rng() en [0, 1)
const drawFactor = (rng) => 1 - VARIATION + 2 * VARIATION * rng();

// Estado inicial: nada acumulado y un factor de variación para la primera llegada
export function createSpawner(rng = () => 0.5) {
  return { elapsedMs: 0, factor: drawFactor(rng) };
}

// Acumula tiempo y decide si llega un cliente. Cerrado, sin sitio o lleno: no acumula.
export function advanceSpawner(state, dtMs, ctx, rng) {
  const { barStatus, hour, customerCount = 0, freeSeats } = ctx;
  if (!canEnter(barStatus) || freeSeats <= 0 || customerCount >= MAX_CUSTOMERS) {
    return { state, spawn: false };
  }
  const elapsedMs = state.elapsedMs + dtMs;
  if (elapsedMs >= spawnIntervalMs(hourSlot(hour)) * state.factor) {
    return { state: { elapsedMs: 0, factor: drawFactor(rng) }, spawn: true };
  }
  return { state: { ...state, elapsedMs }, spawn: false };
}
