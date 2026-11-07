import { describe, it, expect } from 'vitest';
import { calcularZoomEntero } from '../src/logic/zoom.js';

describe('calcularZoomEntero', () => {
  it('base -> 1', () => expect(calcularZoomEntero(320, 180)).toBe(1));
  it('1280x720 -> 4', () => expect(calcularZoomEntero(1280, 720)).toBe(4));
  it('1000x700 -> 3', () => expect(calcularZoomEntero(1000, 700)).toBe(3));
  it('1920x1080 -> 6', () => expect(calcularZoomEntero(1920, 1080)).toBe(6));
  it('menor que la base -> 1', () => expect(calcularZoomEntero(100, 50)).toBe(1));
});
