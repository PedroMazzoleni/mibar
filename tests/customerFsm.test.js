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
  STATES,
} from '../src/logic/customerFsm.js';
import { readFileSync } from 'node:fs';
import { createBarStatus } from '../src/logic/barStatus.js';

const { types } = JSON.parse(readFileSync('public/assets/data/customers.json', 'utf-8'));
const regular = types.find((t) => t.id === 'regular');
const worker = types.find((t) => t.id === 'worker');

// Congela el objeto y sus anidados
function deepFreeze(o) {
  Object.values(o).forEach((v) => v && typeof v === 'object' && deepFreeze(v));
  return Object.freeze(o);
}

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
  it('tick agota consuming y pasa a paying', () => {
    let c = { ...createCustomer(1, entrance), state: 'consuming' };
    c = tick(c, CONSUME_MS - 1);
    expect(c.state).toBe('consuming');
    c = tick(c, 1);
    expect(c.state).toBe('paying');
  });
  it('en paying espera a que le cobren por mucho tiempo que pase', () => {
    const c = { ...createCustomer(1, entrance), state: 'paying' };
    const later = tick(c, PAY_MS * 1000);
    expect(later).toBe(c);
    expect(advance(later, 'paid').state).toBe('leaving');
  });
  it('tick no hace nada en otros estados', () => {
    const c = createCustomer(1, entrance);
    expect(tick(c, 99999)).toBe(c);
  });
});

describe('customerFsm: transiciones', () => {
  const EVENTS = [
    'arrived',
    'orderTaken',
    'served',
    'finishedEating',
    'paid',
    'leftBar',
    'nonsense',
  ];
  const VALID = {
    entering: 'arrived',
    walkingToSeat: 'arrived',
    ordering: 'orderTaken',
    waiting: 'served',
    consuming: 'finishedEating',
    paying: 'paid',
    leaving: 'leftBar',
    gone: null,
  };
  const cases = STATES.flatMap((state) =>
    EVENTS.filter((e) => e !== VALID[state]).map((e) => [state, e]),
  );
  it.each(cases)('en %s rechaza el evento %s', (state, event) => {
    const c = { ...createCustomer(1, entrance), state };
    expect(advance(c, event)).toBe(c);
  });
  it('gone es terminal', () => {
    const c = { ...createCustomer(1, entrance), state: 'gone' };
    for (const e of EVENTS) expect(advance(c, e)).toBe(c);
  });
});

describe('customerFsm: inmutabilidad', () => {
  it('advance no muta el original', () => {
    const c = deepFreeze(createCustomer(1, entrance));
    expect(advance(c, 'arrived').state).toBe('walkingToSeat');
    expect(c.state).toBe('entering');
  });
  it('assignSeat no muta el original', () => {
    const c = deepFreeze(createCustomer(1, entrance));
    expect(assignSeat(c, seat).seat).toBe(seat);
    expect(assignSeat(c, null).state).toBe('leaving');
    expect(c.seat).toBeNull();
    expect(c.state).toBe('entering');
  });
  it('tick no muta el original', () => {
    const c = deepFreeze({ ...createCustomer(1, entrance), state: 'consuming' });
    expect(tick(c, 100).timers.consuming).toBe(CONSUME_MS - 100);
    expect(tick(c, CONSUME_MS).state).toBe('paying');
    expect(c.timers.consuming).toBe(CONSUME_MS);
    expect(c.state).toBe('consuming');
  });
});

describe('assignSeat', () => {
  it('con sitio guarda seat y pasa a walkingToSeat', () => {
    const c = assignSeat(createCustomer(1, entrance), seat);
    expect(c.seat).toEqual(seat);
    expect(c.state).toBe('walkingToSeat');
  });
  it('fuera de entering devuelve el mismo objeto', () => {
    const c = { ...createCustomer(1, entrance), state: 'waiting' };
    expect(assignSeat(c, seat)).toBe(c);
    expect(assignSeat(c, null)).toBe(c);
  });
  it('con sitio null no deja seat', () => {
    expect(assignSeat(createCustomer(1, entrance), null).seat).toBeNull();
  });
});

describe('createCustomer', () => {
  it('estado inicial', () => {
    const c = createCustomer(7, entrance);
    expect(c.id).toBe(7);
    expect(c.state).toBe('entering');
    expect(c.entrance).toBe(entrance);
    expect(c.seat).toBeNull();
    expect(c.route).toEqual([]);
  });
  it('sin tipo usa los tiempos por defecto y typeId null', () => {
    const c = createCustomer(1, entrance);
    expect(c.typeId).toBeNull();
    expect(c.timers).toEqual({ consuming: CONSUME_MS, paying: PAY_MS });
  });
  it.each([
    ['regular', regular],
    ['worker', worker],
  ])('con tipo %s usa sus tiempos y su typeId', (id, type) => {
    const c = createCustomer(1, entrance, type);
    expect(c.typeId).toBe(id);
    expect(c.timers).toEqual({ consuming: type.consumeMs, paying: type.payMs });
  });
});

describe('tick', () => {
  const eating = (type) => ({ ...createCustomer(1, entrance, type), state: 'consuming' });
  it('acumula varios ticks parciales', () => {
    let c = eating();
    c = tick(c, 1000);
    c = tick(c, 2000);
    expect(c.state).toBe('consuming');
    expect(c.timers.consuming).toBe(CONSUME_MS - 3000);
    c = tick(c, CONSUME_MS - 3000);
    expect(c.state).toBe('paying');
  });
  it('dt mayor que el restante deja 0 y pasa a paying', () => {
    const c = tick(eating(), CONSUME_MS * 10);
    expect(c.timers.consuming).toBe(0);
    expect(c.state).toBe('paying');
  });
  it('dt=0 no cambia nada', () => {
    const c = eating();
    const t = tick(c, 0);
    expect(t.state).toBe('consuming');
    expect(t.timers).toEqual(c.timers);
  });
  it('usa el tiempo del tipo', () => {
    let c = eating(worker);
    c = tick(c, worker.consumeMs - 1);
    expect(c.state).toBe('consuming');
    expect(tick(c, 1).state).toBe('paying');
  });
  it('no toca timers.paying', () => {
    expect(tick(eating(worker), 1000).timers.paying).toBe(worker.payMs);
    expect(tick(eating(worker), worker.consumeMs).timers.paying).toBe(worker.payMs);
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
  it('devuelve el stand correcto', () => {
    expect(pickSeat(nav, [{ type: 'silla', col: 2, row: 0 }], [], entrance)).toEqual({
      col: 2,
      row: 0,
      type: 'silla',
      stand: { col: 3, row: 0 },
    });
  });
  it('sin from no exige ruta', () => {
    const closed = openNav(4, 1, [{ col: 1, row: 0 }]);
    expect(pickSeat(closed, [{ type: 'silla', col: 3, row: 0 }], [])).toMatchObject({
      stand: { col: 2, row: 0 },
    });
  });
  it('respeta el orden de la lista', () => {
    expect(pickSeat(nav, seats, [], entrance)).toMatchObject({ col: 2, row: 0 });
    expect(pickSeat(nav, [...seats].reverse(), [], entrance)).toMatchObject({ col: 3, row: 1 });
  });
  it('ignora asientos sin casilla de acceso transitable', () => {
    const walled = openNav(3, 1, [
      { col: 0, row: 0 },
      { col: 2, row: 0 },
    ]);
    expect(pickSeat(walled, [{ type: 'silla', col: 1, row: 0 }], [])).toBeNull();
  });
  it('lista vacía devuelve null', () => {
    expect(pickSeat(nav, [], [], entrance)).toBeNull();
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
  it('usa la casilla del punto si es transitable', () => {
    expect(spawnTile(openNav(3, 3), { gc: 1.7, gr: 2.2 })).toEqual({ col: 1, row: 2 });
  });
  it('sin casillas transitables en la sala devuelve null', () => {
    const nav = openNav(2, 1, [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ]);
    expect(spawnTile(nav, { gc: 0.5, gr: 0.5 })).toBeNull();
  });
  it('solo cuenta casillas de la sala pedida', () => {
    const nav = openNav(3, 1, [{ col: 0, row: 0 }]);
    nav.room[0] = ['sala', 'cocina', 'cocina'];
    expect(spawnTile(nav, { gc: 0.5, gr: 0.5 })).toBeNull();
    expect(spawnTile(nav, { gc: 0.5, gr: 0.5 }, 'cocina')).toEqual({ col: 1, row: 0 });
  });
});
