// Reloj ficticio PROVISIONAL (hasta 5.1, gameClock real). Lógica pura, sin Phaser.

// 1 minuto de juego cada 15 s reales
export const MS_PER_GAME_MINUTE = 15000;
// Velocidades de simulación disponibles (multiplican el dt de todo)
export const SPEEDS = [1, 2, 3, 5];
const DAY_MINUTES = 24 * 60;

export function createGameTime(startMinutes = 9 * 60) {
  return {
    minutes: ((startMinutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES,
    restMs: 0,
    speed: 1,
  };
}

// Estado nuevo con otra velocidad; los valores no válidos se ignoran
export function setSpeed(t, speed) {
  return SPEEDS.includes(speed) ? { ...t, speed } : t;
}

// dt de simulación = dt real × velocidad (único sitio donde se calcula)
export function simDelta(t, realDtMs) {
  return realDtMs * t.speed;
}

// Estado nuevo; el resto de ms se acumula para no perder precisión
export function advanceGameTime(t, dtMs) {
  const total = t.restMs + dtMs;
  const add = Math.floor(total / MS_PER_GAME_MINUTE);
  return {
    ...t,
    minutes: (t.minutes + add) % DAY_MINUTES,
    restMs: total - add * MS_PER_GAME_MINUTE,
  };
}

// Adelanta el reloj un número de horas (para pruebas en dev)
export function addHours(t, hours) {
  return { ...t, minutes: (t.minutes + hours * 60) % DAY_MINUTES };
}

export function getHour(t) {
  return Math.floor(t.minutes / 60);
}

export function formatTime(t) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(getHour(t))}:${pad(t.minutes % 60)}`;
}
