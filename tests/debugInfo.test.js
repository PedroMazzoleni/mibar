import { describe, it, expect } from 'vitest';
import { formatTile, formatDebugText } from '../src/logic/debugInfo.js';

describe('formatTile', () => {
  it('casilla → "col,row"', () => expect(formatTile({ col: 3, row: 7 })).toBe('3,7'));
  it('sin casilla → "-"', () => expect(formatTile(null)).toBe('-'));
});

describe('formatDebugText', () => {
  it('muestra FPS redondeados, casilla bajo el ratón y último clic', () => {
    expect(
      formatDebugText({ fps: 59.6, hover: { col: 1, row: 2 }, click: { col: 39, row: 23 } }),
    ).toBe('FPS 60\ncasilla 1,2\nclic 39,23\nmueble -');
  });
  it('sin casillas muestra guiones', () => {
    expect(formatDebugText({ fps: 30 })).toBe('FPS 30\ncasilla -\nclic -\nmueble -');
  });
  it('muestra el último mueble pulsado', () => {
    expect(formatDebugText({ fps: 60, furniture: 'grifo' })).toBe(
      'FPS 60\ncasilla -\nclic -\nmueble grifo',
    );
  });
});
