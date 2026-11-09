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
  it('por defecto x5 y SPEEDS válidas', async () => {
    const { SPEEDS, setSpeed, simDelta } = await import('../src/logic/gameTime.js');
    const t = createGameTime();
    expect(t.speed).toBe(5);
    expect(SPEEDS).toEqual([5, 10, 50, 100]);
    expect(setSpeed(t, 100).speed).toBe(100);
    expect(setSpeed(t, 1)).toBe(t);
    expect(setSpeed(t, 'x')).toBe(t);
    expect(simDelta(setSpeed(t, 10), 100)).toBe(1000);
  });
  it('x5 avanza 1 minuto cada 3 s reales y x100 cada 150 ms', async () => {
    const { setSpeed, simDelta } = await import('../src/logic/gameTime.js');
    const t = createGameTime();
    const n = advanceGameTime(t, simDelta(t, 3000));
    expect(formatTime(n)).toBe('09:01');
    expect(n.speed).toBe(5);
    const f = setSpeed(t, 100);
    expect(formatTime(advanceGameTime(f, simDelta(f, 150)))).toBe('09:01');
  });
});
