import { describe, it, expect } from 'vitest';
import {
  TILE_W,
  TILE_H,
  FRAME_H,
  WALL_HEIGHT,
  gridToScreen,
  screenToGrid,
  mapOrigin,
  mapPixelSize,
  tileCorners,
  depthOf,
} from '../src/logic/iso.js';

describe('constantes', () => {
  it('rombo 2:1 de 32×16 y frames de 48 de alto', () => {
    expect([TILE_W, TILE_H, FRAME_H]).toEqual([32, 16, 48]);
    expect(WALL_HEIGHT).toBe(32);
  });
});

describe('gridToScreen', () => {
  it('el origen es la esquina de arriba de la casilla (0,0)', () =>
    expect(gridToScreen(0, 0)).toEqual({ x: 0, y: 0 }));
  it('+columna baja a la derecha, +fila baja a la izquierda', () => {
    expect(gridToScreen(1, 0)).toEqual({ x: 16, y: 8 });
    expect(gridToScreen(0, 1)).toEqual({ x: -16, y: 8 });
  });
  it('admite decimales y origen', () =>
    expect(gridToScreen(1.5, 0.5, { x: 100, y: 10 })).toEqual({ x: 116, y: 26 }));
});

describe('screenToGrid', () => {
  const origin = { x: 160, y: 32 };
  it('el centro de cada casilla vuelve a su casilla', () => {
    for (const [col, row] of [
      [0, 0],
      [3, 1],
      [7, 9],
    ]) {
      const c = gridToScreen(col + 0.5, row + 0.5, origin);
      expect(screenToGrid(c.x, c.y, origin)).toEqual({ col, row });
    }
  });
  it('cerca de los vértices cae en la casilla correcta', () => {
    const top = gridToScreen(2, 2, origin);
    expect(screenToGrid(top.x, top.y + 1, origin)).toEqual({ col: 2, row: 2 });
    expect(screenToGrid(top.x, top.y - 1, origin)).toEqual({ col: 1, row: 1 });
    expect(screenToGrid(top.x + 3, top.y, origin)).toEqual({ col: 2, row: 1 });
    expect(screenToGrid(top.x - 3, top.y, origin)).toEqual({ col: 1, row: 2 });
  });
  it('fuera del mapa da negativos', () =>
    expect(screenToGrid(origin.x, origin.y - 10, origin)).toEqual({ col: -1, row: -1 }));
});

describe('mapOrigin y mapPixelSize', () => {
  it('deja el mapa en x ≥ 0 con margen arriba', () => {
    expect(mapOrigin(10)).toEqual({ x: 160, y: 32 });
    expect(mapOrigin(10, 0)).toEqual({ x: 160, y: 0 });
  });
  it('rectángulo que envuelve el rombo del mapa', () =>
    expect(mapPixelSize(16, 10)).toEqual({ width: 416, height: 240 }));
  it('la esquina izquierda de la última fila cae en x = 0', () => {
    const o = mapOrigin(10);
    expect(gridToScreen(0, 10, o).x).toBe(0);
    expect(gridToScreen(16, 0, o).x).toBe(mapPixelSize(16, 10).width);
  });
});

describe('tileCorners', () => {
  it('arriba, derecha, abajo, izquierda', () =>
    expect(tileCorners(0, 0, { x: 0, y: 0 })).toEqual([
      { x: 0, y: 0 },
      { x: 16, y: 8 },
      { x: 0, y: 16 },
      { x: -16, y: 8 },
    ]));
});

describe('depthOf', () => {
  it('más columna o fila → más delante', () => {
    expect(depthOf(2, 3)).toBeGreaterThan(depthOf(2, 2));
    expect(depthOf(3, 2)).toBe(depthOf(2, 3));
  });
});
