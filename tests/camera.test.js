import { describe, it, expect } from 'vitest';
import { clampScroll, dragScroll, screenToWorld } from '../src/logic/camera.js';

describe('screenToWorld', () => {
  it('suma el scroll al puntero con zoom 1', () => {
    expect(screenToWorld(100, 50, 10, 20, 1)).toEqual({ x: 110, y: 70 });
  });

  it('divide el puntero entre el zoom', () => {
    expect(screenToWorld(100, 50, 30, 60, 2)).toEqual({ x: 115, y: 80 });
  });

  it('con scroll 0 y puntero 0 devuelve el origen', () => {
    expect(screenToWorld(0, 0, 0, 0, 1)).toEqual({ x: 0, y: 0 });
  });
});

describe('clampScroll', () => {
  it('no cambia un scroll dentro de rango', () => {
    expect(clampScroll(100, 50, 640, 384, 320, 180)).toEqual({ x: 100, y: 50 });
  });

  it('los negativos pasan a 0', () => {
    expect(clampScroll(-20, -5, 640, 384, 320, 180)).toEqual({ x: 0, y: 0 });
  });

  it('limita al máximo worldW - viewW / worldH - viewH', () => {
    expect(clampScroll(9999, 9999, 640, 384, 320, 180)).toEqual({ x: 320, y: 204 });
  });

  it('centra si el mundo es menor que la vista', () => {
    expect(clampScroll(50, 50, 200, 100, 320, 180)).toEqual({ x: -60, y: -40 });
  });

  it('redondea a entero', () => {
    expect(clampScroll(10.4, 20.6, 640, 384, 320, 180)).toEqual({ x: 10, y: 21 });
  });
});

describe('dragScroll', () => {
  it('puntero a la derecha reduce el scroll (zoom 1)', () => {
    expect(dragScroll({ x: 100, y: 100 }, { x: 50, y: 50 }, { x: 60, y: 70 }, 1)).toEqual({
      x: 90,
      y: 80,
    });
  });

  it('divide entre el zoom (zoom 3)', () => {
    expect(dragScroll({ x: 100, y: 100 }, { x: 50, y: 50 }, { x: 80, y: 50 }, 3)).toEqual({
      x: 90,
      y: 100,
    });
  });

  it('sin movimiento devuelve el scroll inicial', () => {
    expect(dragScroll({ x: 7, y: 9 }, { x: 5, y: 5 }, { x: 5, y: 5 }, 2)).toEqual({ x: 7, y: 9 });
  });
});
