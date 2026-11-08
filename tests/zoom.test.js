import { describe, it, expect } from 'vitest';
import { calcularZoomEntero, calcularTamanoJuego } from '../src/logic/zoom.js';

describe('calcularZoomEntero', () => {
  it('base -> 1', () => expect(calcularZoomEntero(640, 360)).toBe(1));
  it('1280x720 -> 2', () => expect(calcularZoomEntero(1280, 720)).toBe(2));
  it('1000x700 -> 1', () => expect(calcularZoomEntero(1000, 700)).toBe(1));
  it('1920x1080 -> 3', () => expect(calcularZoomEntero(1920, 1080)).toBe(3));
  it('menor que la base -> 1', () => expect(calcularZoomEntero(100, 50)).toBe(1));
});

describe('calcularTamanoJuego', () => {
  it('ventana exacta de la base → 640×360 a zoom 1', () =>
    expect(calcularTamanoJuego(640, 360)).toEqual({ zoom: 1, width: 640, height: 360 }));
  it('llena una ventana panorámica con zoom entero', () =>
    expect(calcularTamanoJuego(1568, 691)).toEqual({ zoom: 1, width: 1568, height: 691 }));
  it('1920×1200 → zoom 3 y redondea hacia arriba lo que sobra', () =>
    expect(calcularTamanoJuego(1920, 1200)).toEqual({ zoom: 3, width: 640, height: 400 }));
  it('1421×841 → zoom 2 cubriendo el píxel suelto', () =>
    expect(calcularTamanoJuego(1421, 841)).toEqual({ zoom: 2, width: 711, height: 421 }));
  it('nunca menos que la base', () =>
    expect(calcularTamanoJuego(100, 50)).toEqual({ zoom: 1, width: 640, height: 360 }));
});
