import { describe, it, expect } from 'vitest';
import {
  createBarStatus,
  toggleOpen,
  getStatusLabel,
  layoutTopBar,
} from '../src/logic/barStatus.js';

describe('createBarStatus', () => {
  it('empieza cerrado por defecto', () => {
    expect(createBarStatus()).toEqual({ open: false });
  });
  it('acepta abierto explícitamente', () => {
    expect(createBarStatus(true)).toEqual({ open: true });
  });
});

describe('toggleOpen', () => {
  it('alterna de cerrado a abierto y otra vez a cerrado', () => {
    const abierto = toggleOpen(createBarStatus());
    expect(abierto.open).toBe(true);
    expect(toggleOpen(abierto).open).toBe(false);
  });
  it('no muta el estado original', () => {
    const original = createBarStatus();
    const copia = { ...original };
    const nuevo = toggleOpen(original);
    expect(original).toEqual(copia);
    expect(nuevo).not.toBe(original);
  });
});

describe('getStatusLabel', () => {
  it('cerrado -> CERRADO', () => expect(getStatusLabel({ open: false })).toBe('CERRADO'));
  it('abierto -> ABIERTO', () => expect(getStatusLabel({ open: true })).toBe('ABIERTO'));
});

describe('layoutTopBar', () => {
  for (const width of [480, 640, 1920]) {
    describe(`ancho ${width}`, () => {
      const layout = layoutTopBar(width);
      it('el tramo central está centrado', () => {
        expect(layout.centerX + layout.centerW / 2).toBe(width / 2);
      });
      it('el tramo central está dentro del ancho', () => {
        expect(layout.centerX).toBeGreaterThanOrEqual(0);
        expect(layout.centerX + layout.centerW).toBeLessThanOrEqual(width);
      });
      it('la barra tiene alto de 20 px', () => {
        expect(layout.barHeight).toBe(20);
      });
      it('la placa central no es más baja que la barra', () => {
        expect(layout.plateHeight).toBeGreaterThanOrEqual(layout.barHeight);
      });
      it('totalHeight es el máximo de barra y placa', () => {
        expect(layout.totalHeight).toBe(Math.max(layout.barHeight, layout.plateHeight));
      });
    });
  }
});
