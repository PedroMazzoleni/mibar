import { describe, it, expect } from 'vitest';
import { isInsideGrid } from '../src/logic/grid.js';

describe('isInsideGrid', () => {
  it('dentro', () => expect(isInsideGrid(0, 0, 16, 10)).toBe(true));
  it('última casilla', () => expect(isInsideGrid(15, 9, 16, 10)).toBe(true));
  it('fuera por la derecha o por abajo', () => {
    expect(isInsideGrid(16, 0, 16, 10)).toBe(false);
    expect(isInsideGrid(0, 10, 16, 10)).toBe(false);
  });
  it('negativos', () => expect(isInsideGrid(-1, 0, 16, 10)).toBe(false));
});
