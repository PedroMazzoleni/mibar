import { describe, it, expect } from 'vitest';
import {
  createGameTime,
  advanceGameTime,
  addHours,
  getHour,
  formatTime,
} from '../src/logic/gameTime.js';

describe('gameTime', () => {
  it('empieza a las 09:00', () => {
    expect(formatTime(createGameTime())).toBe('09:00');
  });
  it('avanza 1 minuto cada 15000 ms y acumula restos', () => {
    let t = advanceGameTime(createGameTime(), 14999);
    expect(formatTime(t)).toBe('09:00');
    t = advanceGameTime(t, 1);
    expect(formatTime(t)).toBe('09:01');
    t = advanceGameTime(t, 7500);
    t = advanceGameTime(t, 7500);
    expect(formatTime(t)).toBe('09:02');
  });
  it('vuelve a 00:00 tras 23:59', () => {
    const t = advanceGameTime(createGameTime(23 * 60 + 59), 15000);
    expect(formatTime(t)).toBe('00:00');
  });
  it('formatTime con ceros y getHour', () => {
    const t = createGameTime(9 * 60 + 5);
    expect(formatTime(t)).toBe('09:05');
    expect(getHour(t)).toBe(9);
  });
  it('addHours adelanta y da la vuelta', () => {
    expect(formatTime(addHours(createGameTime(), 4))).toBe('13:00');
    expect(formatTime(addHours(createGameTime(23 * 60), 2))).toBe('01:00');
  });
});

describe('velocidad', () => {
  it('por defecto x1 y SPEEDS válidas', async () => {
    const { SPEEDS, setSpeed, simDelta } = await import('../src/logic/gameTime.js');
    const t = createGameTime();
    expect(t.speed).toBe(1);
    expect(SPEEDS).toEqual([1, 2, 3, 5]);
    expect(setSpeed(t, 5).speed).toBe(5);
    expect(setSpeed(t, 4)).toBe(t);
    expect(setSpeed(t, 'x')).toBe(t);
    expect(simDelta(setSpeed(t, 3), 100)).toBe(300);
  });
  it('x5 avanza 1 minuto cada 3 s reales y conserva la velocidad', async () => {
    const { setSpeed, simDelta } = await import('../src/logic/gameTime.js');
    const t = setSpeed(createGameTime(), 5);
    const n = advanceGameTime(t, simDelta(t, 3000));
    expect(formatTime(n)).toBe('09:01');
    expect(n.speed).toBe(5);
  });
});
