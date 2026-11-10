import { describe, it, expect } from 'vitest';
import {
  pickOrder,
  describeCustomer,
  createTicket,
  seatLabel,
} from '../src/logic/orders.js';

const ORDERS = [
  { id: 'cana', name: 'Caña' },
  { id: 'vino', name: 'Vino' },
  { id: 'cafe', name: 'Café' },
];

describe('pickOrder', () => {
  it('rota por los pedidos en orden y da la vuelta', () => {
    const names = [0, 1, 2, 3, 4, 5, 6].map((i) => pickOrder(ORDERS, i).name);
    expect(names).toEqual(['Caña', 'Vino', 'Café', 'Caña', 'Vino', 'Café', 'Caña']);
  });

  it('no falla con un índice grande', () => {
    const big = 1_000_000_007;
    expect(pickOrder(ORDERS, big)).toBe(ORDERS[big % ORDERS.length]);
    expect(pickOrder(ORDERS, Number.MAX_SAFE_INTEGER)).toBe(
      ORDERS[Number.MAX_SAFE_INTEGER % ORDERS.length],
    );
  });

  it('con un solo pedido devuelve siempre ese', () => {
    expect(pickOrder([ORDERS[0]], 5)).toBe(ORDERS[0]);
  });

  it('sin pedidos devuelve null', () => {
    expect(pickOrder([], 0)).toBeNull();
    expect(pickOrder(undefined, 0)).toBeNull();
  });
});

describe('describeCustomer', () => {
  const type = { id: 'regular', name: 'Cliente habitual' };
  const withOrder = { id: 1, state: 'waiting', order: { id: 'cana', name: 'Caña' } };

  it.each([
    ['entering', 'Entrando'],
    ['walkingToSeat', 'Yendo a sentarse'],
    ['ordering', 'Quiere pedir'],
    ['waiting', 'Esperando su pedido'],
    ['consuming', 'Consumiendo'],
    ['paying', 'Quiere pagar'],
    ['leaving', 'Marchándose'],
    ['gone', 'Se ha ido'],
  ])('en el estado %s muestra "%s"', (state, label) => {
    const d = describeCustomer({ ...withOrder, state }, type);
    expect(d.stateLabel).toBe(label);
    expect(d.title).toBe('Cliente habitual');
    expect(d.orderLabel).toBe('x1 Caña');
  });

  it('sin pedido muestra "Aún no ha pedido"', () => {
    const d = describeCustomer({ id: 2, state: 'ordering', order: null }, type);
    expect(d.orderLabel).toBe('Aún no ha pedido');
    expect(d.stateLabel).toBe('Quiere pedir');
  });

  it('sin tipo usa un título genérico', () => {
    expect(describeCustomer(withOrder, undefined).title).toBe('Cliente');
  });
});

describe('createTicket', () => {
  it('da "x1 Caña" y guarda el id del cliente y el sitio', () => {
    const customer = { id: 7, state: 'waiting', order: { id: 'cana', name: 'Caña' } };
    expect(createTicket(customer, 'Mesa 2')).toEqual({
      customerId: 7,
      text: 'x1 Caña',
      seatLabel: 'Mesa 2',
    });
  });
});

describe('seatLabel', () => {
  it('devuelve cadena vacía sin asiento', () => {
    expect(seatLabel(null, [])).toBe('');
  });

  it('numera los taburetes por orden fila-columna, no por orden de la lista', () => {
    const furniture = [
      { type: 'taburete', col: 5, row: 2 },
      { type: 'taburete', col: 3, row: 0 },
      { type: 'taburete', col: 1, row: 0 },
    ];
    expect(seatLabel({ type: 'taburete', col: 1, row: 0 }, furniture)).toBe('Taburete 1');
    expect(seatLabel({ type: 'taburete', col: 3, row: 0 }, furniture)).toBe('Taburete 2');
    expect(seatLabel({ type: 'taburete', col: 5, row: 2 }, furniture)).toBe('Taburete 3');
  });

  it('una silla da "Mesa N" de la mesa más cercana', () => {
    const furniture = [
      { type: 'mesa', col: 0, row: 0 },
      { type: 'mesa', col: 6, row: 0 },
      { type: 'silla', col: 1, row: 1 },
      { type: 'silla', col: 5, row: 0 },
    ];
    expect(seatLabel({ type: 'silla', col: 1, row: 1 }, furniture)).toBe('Mesa 1');
    expect(seatLabel({ type: 'silla', col: 5, row: 0 }, furniture)).toBe('Mesa 2');
  });

  it('numera las mesas por orden fila-columna aunque la lista esté desordenada', () => {
    const furniture = [
      { type: 'mesa', col: 9, row: 0 },
      { type: 'mesa', col: 0, row: 0 },
      { type: 'silla', col: 8, row: 0 },
    ];
    expect(seatLabel({ type: 'silla', col: 8, row: 0 }, furniture)).toBe('Mesa 2');
  });

  it('en empate de distancia gana la mesa de menor fila', () => {
    // Silla (2,1): mesas (2,0) y (2,2) a distancia 1 cada una
    const furniture = [
      { type: 'mesa', col: 2, row: 2 },
      { type: 'mesa', col: 2, row: 0 },
      { type: 'silla', col: 2, row: 1 },
    ];
    expect(seatLabel({ type: 'silla', col: 2, row: 1 }, furniture)).toBe('Mesa 1');
  });

  it('en empate de distancia y misma fila gana la mesa de menor columna', () => {
    // Silla (2,0): mesas (1,1) y (3,1) a distancia 2 cada una
    const furniture = [
      { type: 'mesa', col: 3, row: 1 },
      { type: 'mesa', col: 1, row: 1 },
      { type: 'silla', col: 2, row: 0 },
    ];
    expect(seatLabel({ type: 'silla', col: 2, row: 0 }, furniture)).toBe('Mesa 1');
  });

  it('sin mesas una silla da "Silla N" por orden fila-columna', () => {
    const furniture = [
      { type: 'silla', col: 3, row: 0 },
      { type: 'silla', col: 1, row: 0 },
    ];
    expect(seatLabel({ type: 'silla', col: 3, row: 0 }, furniture)).toBe('Silla 2');
    expect(seatLabel({ type: 'silla', col: 1, row: 0 }, furniture)).toBe('Silla 1');
  });
});
