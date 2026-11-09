import { describe, it, expect } from 'vitest';
import {
  hourSlot,
  spawnIntervalMs,
  advanceSpawner,
  createSpawner,
  MAX_CUSTOMERS,
} from '../src/logic/spawner.js';

const open = { open: true };
const rng = () => 0.5; // factor 1
const ctx = (o = {}) => ({ barStatus: open, hour: 9, customerCount: 0, freeSeats: 3, ...o });

describe('hourSlot', () => {
  it('franjas y bordes', () => {
    expect(hourSlot(0)).toBe('quiet');
    expect(hourSlot(8)).toBe('normal');
    expect(hourSlot(12)).toBe('normal');
    expect(hourSlot(13)).toBe('rush');
    expect(hourSlot(15)).toBe('rush');
    expect(hourSlot(16)).toBe('quiet');
    expect(hourSlot(19)).toBe('quiet');
    expect(hourSlot(20)).toBe('rush');
    expect(hourSlot(23)).toBe('rush');
  });
});

describe('spawnIntervalMs', () => {
  it('baja de quiet a rush', () => {
    expect(spawnIntervalMs('quiet')).toBeGreaterThan(spawnIntervalMs('normal'));
    expect(spawnIntervalMs('normal')).toBeGreaterThan(spawnIntervalMs('rush'));
  });
});

describe('advanceSpawner', () => {
  it('cerrado nunca spawn', () => {
    const r = advanceSpawner(createSpawner(rng), 999999, ctx({ barStatus: { open: false } }), rng);
    expect(r.spawn).toBe(false);
  });
  it('sin sitios no spawn', () => {
    expect(advanceSpawner(createSpawner(rng), 999999, ctx({ freeSeats: 0 }), rng).spawn).toBe(
      false,
    );
  });
  it('spawn al cumplir el intervalo y reinicia', () => {
    let r = advanceSpawner(createSpawner(rng), 9999, ctx(), rng);
    expect(r.spawn).toBe(false);
    r = advanceSpawner(r.state, 1, ctx(), rng);
    expect(r.spawn).toBe(true);
    expect(r.state.elapsedMs).toBe(0);
  });
  it('rush llega antes que quiet', () => {
    const rush = advanceSpawner(createSpawner(rng), 5000, ctx({ hour: 13 }), rng);
    const quiet = advanceSpawner(createSpawner(rng), 5000, ctx({ hour: 17 }), rng);
    expect(rush.spawn).toBe(true);
    expect(quiet.spawn).toBe(false);
  });
  it('variación de ±20% con rng extremo', () => {
    expect(
      advanceSpawner(
        createSpawner(() => 0),
        8000,
        ctx(),
        () => 0,
      ).spawn,
    ).toBe(true);
    expect(
      advanceSpawner(
        createSpawner(() => 0.999),
        11990,
        ctx(),
        rng,
      ).spawn,
    ).toBe(false);
  });
  it('cerrado mucho tiempo no acumula: sale 1 solo', () => {
    const closed = ctx({ barStatus: { open: false } });
    let r = advanceSpawner(createSpawner(rng), 1e7, closed, rng);
    r = advanceSpawner(r.state, 1000, ctx(), rng);
    expect(r.spawn).toBe(false);
    r = advanceSpawner(r.state, 20000, ctx(), rng);
    expect(r.spawn).toBe(true);
    expect(advanceSpawner(r.state, 1000, ctx(), rng).spawn).toBe(false);
  });
  it('rng fijo: misma secuencia da mismos resultados', () => {
    const run = () => {
      let s = createSpawner(rng);
      const out = [];
      for (let i = 0; i < 5; i++) {
        const r = advanceSpawner(s, 10000, ctx(), rng);
        out.push(r.spawn, r.state.elapsedMs, r.state.factor);
        s = r.state;
      }
      return out;
    };
    expect(run()).toEqual(run());
  });
  it('límite de clientes: con MAX_CUSTOMERS dentro no spawn', () => {
    expect(
      advanceSpawner(createSpawner(rng), 999999, ctx({ customerCount: MAX_CUSTOMERS }), rng).spawn,
    ).toBe(false);
  });
});
