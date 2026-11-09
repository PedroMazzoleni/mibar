import { describe, it, expect } from 'vitest';
import {
  createCustomer,
  advance,
  assignSeat,
  tick,
  pickSeat,
  canEnter,
  spawnTile,
  CONSUME_MS,
  PAY_MS,
} from '../src/logic/customerFsm.js';
import { createBarStatus } from '../src/logic/barStatus.js';

const entrance = { col: 0, row: 0 };
const seat = { col: 2, row: 0, type: 'silla', stand: { col: 1, row: 0 } };

function openNav(cols, rows, blocked = []) {
  const walkable = Array.from({ length: rows }, () => Array(cols).fill(true));
  for (const b of blocked) walkable[b.row][b.col] = false;
  const grid = (v) => Array.from({ length: rows }, () => Array(cols).fill(v));
  return { cols, rows, walkable, door: grid(null), room: grid('sala') };
}

describe('customerFsm', () => {
  it('recorrido feliz hasta gone', () => {
    let c = assignSeat(createCustomer(1, entrance), seat);
    expect(c.state).toBe('walkingToSeat');
    for (const [event, state] of [
      ['arrived', 'ordering'],
      ['orderTaken', 'waiting'],
      ['served', 'consuming'],
      ['finishedEating', 'paying'],
      ['paid', 'leaving'],
      ['leftBar', 'gone'],
    ]) {
      c = advance(c, event);
      expect(c.state).toBe(state);
    }
  });
  it('evento inválido no cambia el estado', () => {
    const c = createCustomer(1, entrance);
    expect(advance(c, 'served')).toBe(c);
    expect(advance(c, 'nonsense')).toBe(c);
  });
  it('sin sitio pasa a leaving', () => {
    expect(assignSeat(createCustomer(1, entrance), null).state).toBe('leaving');
  });
  it('tick agota consuming y paying', () => {
    let c = { ...createCustomer(1, entrance), state: 'consuming' };
    c = tick(c, CONSUME_MS - 1);
    expect(c.state).toBe('consuming');
    c = tick(c, 1);
    expect(c.state).toBe('paying');
    c = tick(c, PAY_MS);
    expect(c.state).toBe('leaving');
  });
  it('tick no hace nada en otros estados', () => {
    const c = createCustomer(1, entrance);
    expect(tick(c, 99999)).toBe(c);
  });
});

describe('pickSeat', () => {
  const nav = openNav(4, 2);
  const seats = [
    { type: 'silla', col: 2, row: 0 },
    { type: 'taburete', col: 3, row: 1 },
    { type: 'mesa', col: 1, row: 1 },
  ];
  it('ignora las ocupadas y las que no son asiento', () => {
    expect(pickSeat(nav, seats, [{ col: 2, row: 0 }], entrance)).toMatchObject({ col: 3, row: 1 });
  });
  it('devuelve null si no hay sitio libre', () => {
    const taken = [
      { col: 2, row: 0 },
      { col: 3, row: 1 },
    ];
    expect(pickSeat(nav, seats, taken, entrance)).toBeNull();
  });
  it('ignora asientos inalcanzables', () => {
    const closed = openNav(4, 1, [{ col: 1, row: 0 }]);
    expect(pickSeat(closed, [{ type: 'silla', col: 3, row: 0 }], [], entrance)).toBeNull();
  });
});

describe('canEnter y spawnTile', () => {
  it('solo entra con el bar abierto', () => {
    expect(canEnter(createBarStatus(true))).toBe(true);
    expect(canEnter(createBarStatus(false))).toBe(false);
    expect(canEnter(undefined)).toBe(false);
  });
  it('la entrada no transitable usa la casilla más cercana', () => {
    const nav = openNav(3, 1, [{ col: 0, row: 0 }]);
    expect(spawnTile(nav, { gc: 0.5, gr: 0.5 })).toEqual({ col: 1, row: 0 });
  });
});
