import { describe, it, expect } from 'vitest';
import { calcularZoomEntero } from '../src/logic/zoom.js';

describe('calcularZoomEntero', () => {
  it('base -> 1', () => expect(calcularZoomEntero(640, 360)).toBe(1));
  it('1280x720 -> 2', () => expect(calcularZoomEntero(1280, 720)).toBe(2));
  it('1000x700 -> 1', () => expect(calcularZoomEntero(1000, 700)).toBe(1));
  it('1920x1080 -> 3', () => expect(calcularZoomEntero(1920, 1080)).toBe(3));
  it('menor que la base -> 1', () => expect(calcularZoomEntero(100, 50)).toBe(1));
});
