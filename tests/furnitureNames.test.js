import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { getFurnitureLabel, clampTooltipPosition } from '../src/logic/furnitureNames.js';
import { INTERACTIVE_TYPES } from '../src/logic/furniture.js';

const names = JSON.parse(readFileSync('public/assets/data/furniture-names.json', 'utf8'));

describe('getFurnitureLabel', () => {
  it('devuelve el nombre del JSON', () => {
    expect(getFurnitureLabel('grifo', names)).toBe('Grifo de cerveza');
  });

  it('usa el tipo con mayúscula inicial si falta', () => {
    expect(getFurnitureLabel('estanteria', names)).toBe('Estanteria');
  });

  it('no falla con un JSON vacío', () => {
    expect(getFurnitureLabel('mesa', {})).toBe('Mesa');
    expect(getFurnitureLabel('mesa', undefined)).toBe('Mesa');
  });

  it('los 9 tipos interactivos tienen nombre', () => {
    expect(INTERACTIVE_TYPES).toHaveLength(9);
    for (const type of INTERACTIVE_TYPES) {
      expect(typeof names[type]).toBe('string');
      expect(names[type].length).toBeGreaterThan(0);
    }
  });
});

describe('clampTooltipPosition', () => {
  it('caso normal: a la derecha y debajo', () => {
    expect(clampTooltipPosition(100, 100, 80, 20, 640, 360)).toEqual({ x: 112, y: 112 });
  });

  it('borde derecho: pasa a la izquierda', () => {
    expect(clampTooltipPosition(600, 100, 80, 20, 640, 360)).toEqual({ x: 508, y: 112 });
  });

  it('borde inferior: pasa arriba', () => {
    expect(clampTooltipPosition(100, 350, 80, 20, 640, 360)).toEqual({ x: 112, y: 318 });
  });

  it('esquina inferior derecha', () => {
    expect(clampTooltipPosition(630, 355, 80, 20, 640, 360)).toEqual({ x: 538, y: 323 });
  });

  it('tooltip mayor que la vista: (0, 0)', () => {
    expect(clampTooltipPosition(50, 50, 700, 400, 640, 360)).toEqual({ x: 0, y: 0 });
  });
});
