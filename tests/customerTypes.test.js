import { describe, it, expect } from 'vitest';
import customers from '../public/assets/data/customers.json';
import {
  validateCustomerTypes,
  getCustomerType,
  nextCustomerType,
} from '../src/logic/customerTypes.js';
import { createCustomer, CONSUME_MS, PAY_MS } from '../src/logic/customerFsm.js';

const entrance = { col: 0, row: 0 };

function tipo(overrides = {}) {
  return {
    id: 'test',
    name: 'Prueba',
    consumeMs: 1000,
    payMs: 500,
    patienceMs: 2000,
    tipChance: 0.5,
    ...overrides,
  };
}

describe('customers.json real', () => {
  it('pasa la validación y contiene exactamente regular y worker', () => {
    const types = validateCustomerTypes(customers);
    expect(types.map((t) => t.id).sort()).toEqual(['regular', 'worker']);
  });
});

describe('validateCustomerTypes', () => {
  it('acepta datos válidos y devuelve la lista de tipos', () => {
    const types = [tipo({ id: 'a' }), tipo({ id: 'b', tipChance: 0 })];
    expect(validateCustomerTypes({ types })).toBe(types);
  });

  it('rechaza una lista vacía o ausente', () => {
    expect(() => validateCustomerTypes({ types: [] })).toThrow();
    expect(() => validateCustomerTypes({})).toThrow();
    expect(() => validateCustomerTypes(null)).toThrow();
  });

  it.each(['id', 'name', 'consumeMs', 'payMs', 'patienceMs', 'tipChance'])(
    'rechaza un tipo sin el campo %s',
    (campo) => {
      const t = tipo();
      delete t[campo];
      expect(() => validateCustomerTypes({ types: [t] })).toThrow();
    },
  );

  it.each(['consumeMs', 'payMs', 'patienceMs'])('rechaza %s negativo o cero', (campo) => {
    expect(() => validateCustomerTypes({ types: [tipo({ [campo]: -1 })] })).toThrow();
    expect(() => validateCustomerTypes({ types: [tipo({ [campo]: 0 })] })).toThrow();
  });

  it.each(['consumeMs', 'payMs', 'patienceMs'])('rechaza %s no entero', (campo) => {
    expect(() => validateCustomerTypes({ types: [tipo({ [campo]: 1.5 })] })).toThrow();
    expect(() => validateCustomerTypes({ types: [tipo({ [campo]: '1000' })] })).toThrow();
  });

  it.each([-0.1, 1.1, 2, '0.5', NaN])('rechaza tipChance = %s', (valor) => {
    expect(() => validateCustomerTypes({ types: [tipo({ tipChance: valor })] })).toThrow();
  });

  it('acepta tipChance en los límites 0 y 1', () => {
    expect(() => validateCustomerTypes({ types: [tipo({ tipChance: 0 })] })).not.toThrow();
    expect(() => validateCustomerTypes({ types: [tipo({ tipChance: 1 })] })).not.toThrow();
  });

  it('rechaza ids repetidos', () => {
    expect(() => validateCustomerTypes({ types: [tipo({ id: 'x' }), tipo({ id: 'x' })] })).toThrow();
  });
});

describe('getCustomerType', () => {
  const types = [tipo({ id: 'a' }), tipo({ id: 'b' })];

  it('devuelve el tipo con ese id', () => {
    expect(getCustomerType(types, 'b')).toBe(types[1]);
  });

  it('devuelve undefined si no existe', () => {
    expect(getCustomerType(types, 'zzz')).toBeUndefined();
  });
});

describe('nextCustomerType', () => {
  const types = [tipo({ id: 'a' }), tipo({ id: 'b' }), tipo({ id: 'c' })];

  it('rota por los tipos en orden y da la vuelta', () => {
    const ids = [0, 1, 2, 3, 4, 5, 6].map((i) => nextCustomerType(types, i).id);
    expect(ids).toEqual(['a', 'b', 'c', 'a', 'b', 'c', 'a']);
  });

  it('con los tipos reales alterna regular y worker', () => {
    const real = validateCustomerTypes(customers);
    expect(nextCustomerType(real, 0).id).toBe('regular');
    expect(nextCustomerType(real, 1).id).toBe('worker');
    expect(nextCustomerType(real, 2).id).toBe('regular');
  });
});

describe('createCustomer con tipo', () => {
  it('usa los tiempos del tipo', () => {
    const type = tipo({ id: 'w', consumeMs: 3000, payMs: 800 });
    const c = createCustomer(1, entrance, type);
    expect(c.typeId).toBe('w');
    expect(c.timers.consuming).toBe(3000);
    expect(c.timers.paying).toBe(800);
  });

  it('con los tipos reales cada uno usa sus tiempos', () => {
    const real = validateCustomerTypes(customers);
    const regular = createCustomer(1, entrance, getCustomerType(real, 'regular'));
    const worker = createCustomer(2, entrance, getCustomerType(real, 'worker'));
    expect(regular.timers.consuming).not.toBe(worker.timers.consuming);
    expect(regular.timers.paying).not.toBe(worker.timers.paying);
  });
});

describe('createCustomer sin tipo', () => {
  it('usa CONSUME_MS y PAY_MS y typeId null', () => {
    const c = createCustomer(1, entrance);
    expect(c.typeId).toBeNull();
    expect(c.timers.consuming).toBe(CONSUME_MS);
    expect(c.timers.paying).toBe(PAY_MS);
  });
});
