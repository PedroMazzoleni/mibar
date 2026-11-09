import { describe, it, expect } from 'vitest';
import { calcularZoomEntero, calcularTamanoJuego } from '../src/logic/zoom.js';

describe('calcularZoomEntero', () => {
  it('base 480x270 -> 1', () => expect(calcularZoomEntero(480, 270)).toBe(1));
  it('960x540 -> 2', () => expect(calcularZoomEntero(960, 540)).toBe(2));
  it('1000x700 -> 2', () => expect(calcularZoomEntero(1000, 700)).toBe(2));
  it('1920x1080 -> 4', () => expect(calcularZoomEntero(1920, 1080)).toBe(4));
  it('menor que la base -> 1', () => expect(calcularZoomEntero(100, 50)).toBe(1));
});

describe('calcularTamanoJuego', () => {
  it('ventana exacta de la base → 480×270 a zoom 1', () =>
    expect(calcularTamanoJuego(480, 270)).toEqual({ zoom: 1, width: 480, height: 270 }));
  it('llena una ventana panorámica con zoom entero', () =>
    expect(calcularTamanoJuego(1568, 691)).toEqual({ zoom: 2, width: 784, height: 346 }));
  it('1920×1200 → zoom 4 y redondea hacia arriba lo que sobra', () =>
    expect(calcularTamanoJuego(1920, 1200)).toEqual({ zoom: 4, width: 480, height: 300 }));
  it('1421×841 → zoom 2 cubriendo el píxel suelto', () =>
    expect(calcularTamanoJuego(1421, 841)).toEqual({ zoom: 2, width: 711, height: 421 }));
  it('nunca menos que la base', () =>
    expect(calcularTamanoJuego(100, 50)).toEqual({ zoom: 1, width: 480, height: 270 }));
});
