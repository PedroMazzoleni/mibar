import { describe, it, expect } from 'vitest';
import {
  createQueue,
  addTicket,
  removeByCustomer,
  visibleTickets,
  slotIndex,
} from '../src/logic/orderQueue.js';
import { createCustomer, advance } from '../src/logic/customerFsm.js';
import { createTicket } from '../src/logic/orders.js';

const entrance = { col: 0, row: 0 };

function ticket(customerId, text = 'x1 Caña') {
  return { customerId, text, seatLabel: 'Mesa 1' };
}

// Congela el objeto y sus anidados
function deepFreeze(o) {
  Object.values(o).forEach((v) => v && typeof v === 'object' && deepFreeze(v));
  return Object.freeze(o);
}

function queueOf(...ids) {
  return ids.reduce((q, id) => addTicket(q, ticket(id)), createQueue());
}

describe('createQueue', () => {
  it('empieza vacía con el siguiente seq en 1', () => {
    expect(createQueue()).toEqual({ tickets: [], nextSeq: 1 });
  });
});

describe('addTicket', () => {
  it('conserva el orden de llegada y asigna seq creciente', () => {
    const q = queueOf(3, 1, 2);
    expect(q.tickets.map((t) => t.customerId)).toEqual([3, 1, 2]);
    expect(q.tickets.map((t) => t.seq)).toEqual([1, 2, 3]);
    expect(q.nextSeq).toBe(4);
  });

  it('no muta la cola original', () => {
    const before = queueOf(1);
    const snapshot = JSON.parse(JSON.stringify(before));
    deepFreeze(before);
    const after = addTicket(before, ticket(2));
    expect(before).toEqual(snapshot);
    expect(after.tickets).toHaveLength(2);
    expect(after).not.toBe(before);
  });

  it('guarda los datos de la comanda', () => {
    const t = createTicket({ id: 9, order: { id: 'cana', name: 'Caña' } }, 'Taburete 3');
    const q = addTicket(createQueue(), t);
    expect(q.tickets[0]).toMatchObject({ customerId: 9, text: 'x1 Caña', seatLabel: 'Taburete 3' });
  });
});

describe('removeByCustomer', () => {
  it('retira la comanda del medio', () => {
    const q = removeByCustomer(queueOf(1, 2, 3), 2);
    expect(q.tickets.map((t) => t.customerId)).toEqual([1, 3]);
  });

  it('retira la comanda del principio', () => {
    const q = removeByCustomer(queueOf(1, 2, 3), 1);
    expect(q.tickets.map((t) => t.customerId)).toEqual([2, 3]);
  });

  it('retira la del final', () => {
    const q = removeByCustomer(queueOf(1, 2, 3), 3);
    expect(q.tickets.map((t) => t.customerId)).toEqual([1, 2]);
  });

  it('con un id inexistente la cola queda igual', () => {
    const before = queueOf(1, 2);
    const after = removeByCustomer(before, 99);
    expect(after.tickets).toEqual(before.tickets);
    expect(after.nextSeq).toBe(before.nextSeq);
  });

  it('no muta la cola original', () => {
    const before = deepFreeze(queueOf(1, 2, 3));
    const after = removeByCustomer(before, 2);
    expect(before.tickets).toHaveLength(3);
    expect(after.tickets).toHaveLength(2);
  });
});

describe('visibleTickets', () => {
  it('cuando caben todas no deja ocultas', () => {
    const { shown, hidden } = visibleTickets(queueOf(1, 2, 3), 6);
    expect(shown.map((t) => t.customerId)).toEqual([1, 2, 3]);
    expect(hidden).toBe(0);
  });

  it('cuando sobran devuelve las primeras y cuántas no caben', () => {
    const { shown, hidden } = visibleTickets(queueOf(1, 2, 3, 4, 5, 6, 7, 8), 6);
    expect(shown.map((t) => t.customerId)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(hidden).toBe(2);
  });

  it('exactamente max comandas no deja ocultas', () => {
    const { shown, hidden } = visibleTickets(queueOf(1, 2, 3, 4, 5, 6), 6);
    expect(shown).toHaveLength(6);
    expect(hidden).toBe(0);
  });

  it('con la cola vacía no muestra nada y no oculta nada', () => {
    expect(visibleTickets(createQueue(), 6)).toEqual({ shown: [], hidden: 0 });
  });
});

describe('slotIndex', () => {
  it('da la posición en la cola', () => {
    const q = queueOf(4, 5, 6);
    expect(slotIndex(q, 4)).toBe(0);
    expect(slotIndex(q, 6)).toBe(2);
  });

  it('devuelve -1 si el cliente no tiene comanda', () => {
    expect(slotIndex(queueOf(1), 99)).toBe(-1);
    expect(slotIndex(createQueue(), 1)).toBe(-1);
  });

  it('se reordena al retirar una comanda', () => {
    const q = removeByCustomer(queueOf(1, 2, 3), 1);
    expect(slotIndex(q, 2)).toBe(0);
    expect(slotIndex(q, 3)).toBe(1);
    expect(slotIndex(q, 1)).toBe(-1);
  });
});

describe('cliente que se va sin servir', () => {
  it('su comanda desaparece de la cola y las demás conservan el orden', () => {
    let customer = createCustomer(1, entrance, null, { id: 'cana', name: 'Caña' });
    customer = advance({ ...customer, state: 'ordering' }, 'orderTaken');
    let q = addTicket(createQueue(), createTicket(customer, 'Mesa 1'));
    q = addTicket(q, createTicket({ id: 2, order: { id: 'vino', name: 'Vino' } }, 'Mesa 2'));

    // El cliente 1 se marcha sin que le sirvan: el sistema retira su comanda
    q = removeByCustomer(q, customer.id);

    expect(q.tickets.map((t) => t.customerId)).toEqual([2]);
    expect(slotIndex(q, 1)).toBe(-1);
    expect(slotIndex(q, 2)).toBe(0);
  });
});
