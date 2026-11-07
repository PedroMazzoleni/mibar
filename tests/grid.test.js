import { describe, it, expect } from 'vitest';
import {
  TILE_SIZE,
  GRID_COLS,
  GRID_ROWS,
  worldToTile,
  tileToWorld,
  tileCenter,
  isInsideGrid,
} from '../src/logic/grid.js';

describe('constantes de rejilla', () => {
  it('TILE_SIZE es 32', () => expect(TILE_SIZE).toBe(32));
  it('GRID_COLS es 20 y GRID_ROWS es 11', () => {
    expect(GRID_COLS).toBe(20);
    expect(GRID_ROWS).toBe(11);
  });
});

describe('worldToTile', () => {
  it('(0,0) -> (0,0)', () => expect(worldToTile(0, 0)).toEqual({ col: 0, row: 0 }));
  it('(31.9,31.9) -> (0,0)', () => expect(worldToTile(31.9, 31.9)).toEqual({ col: 0, row: 0 }));
  it('(32,32) -> (1,1)', () => expect(worldToTile(32, 32)).toEqual({ col: 1, row: 1 }));
  it('(639,351) -> (19,10)', () => expect(worldToTile(639, 351)).toEqual({ col: 19, row: 10 }));
  it('(639,359) -> (19,11), fuera de la rejilla', () => {
    const { col, row } = worldToTile(639, 359);
    expect({ col, row }).toEqual({ col: 19, row: 11 });
    expect(isInsideGrid(col, row, GRID_COLS, GRID_ROWS)).toBe(false);
  });
  it('negativos: (-0.1,-0.1) -> (-1,-1)', () =>
    expect(worldToTile(-0.1, -0.1)).toEqual({ col: -1, row: -1 }));
  it('negativos: (-32,-32) -> (-1,-1)', () =>
    expect(worldToTile(-32, -32)).toEqual({ col: -1, row: -1 }));
  it('tileSize distinto de 32 (x=9,y=10, tileSize 8 -> (1,1))', () =>
    expect(worldToTile(9, 10, 8)).toEqual({ col: 1, row: 1 }));
  it('tileSize distinto de 32 (x=7.9, tileSize 8 -> col 0)', () =>
    expect(worldToTile(7.9, 0, 8)).toEqual({ col: 0, row: 0 }));
});

describe('tileToWorld', () => {
  it('(0,0) -> (0,0)', () => expect(tileToWorld(0, 0)).toEqual({ x: 0, y: 0 }));
  it('(2,3) -> (64,96)', () => expect(tileToWorld(2, 3)).toEqual({ x: 64, y: 96 }));
  it('tileSize distinto de 32: (2,3,8) -> (16,24)', () =>
    expect(tileToWorld(2, 3, 8)).toEqual({ x: 16, y: 24 }));
});

describe('tileCenter', () => {
  it('(0,0) -> (16,16)', () => expect(tileCenter(0, 0)).toEqual({ x: 16, y: 16 }));
  it('(2,3) -> (80,112)', () => expect(tileCenter(2, 3)).toEqual({ x: 80, y: 112 }));
  it('tileSize distinto de 32: (2,3,8) -> (20,28)', () =>
    expect(tileCenter(2, 3, 8)).toEqual({ x: 20, y: 28 }));
});

describe('ida y vuelta', () => {
  it('worldToTile(tileToWorld(c,r)) === (c,r)', () => {
    for (let c = 0; c < GRID_COLS; c++) {
      for (let r = 0; r < GRID_ROWS; r++) {
        const { x, y } = tileToWorld(c, r);
        expect(worldToTile(x, y)).toEqual({ col: c, row: r });
      }
    }
  });

  it('tileCenter cae dentro de su casilla', () => {
    for (let c = 0; c < GRID_COLS; c++) {
      for (let r = 0; r < GRID_ROWS; r++) {
        const { x, y } = tileCenter(c, r);
        expect(worldToTile(x, y)).toEqual({ col: c, row: r });
      }
    }
  });

  it('tileSize distinto de 32: ida y vuelta y centro', () => {
    const { x, y } = tileToWorld(5, 4, 8);
    expect(worldToTile(x, y, 8)).toEqual({ col: 5, row: 4 });
    const c = tileCenter(5, 4, 8);
    expect(worldToTile(c.x, c.y, 8)).toEqual({ col: 5, row: 4 });
  });
});

describe('isInsideGrid', () => {
  it('(0,0) dentro', () => expect(isInsideGrid(0, 0, GRID_COLS, GRID_ROWS)).toBe(true));
  it('(cols-1,rows-1) dentro', () =>
    expect(isInsideGrid(GRID_COLS - 1, GRID_ROWS - 1, GRID_COLS, GRID_ROWS)).toBe(true));
  it('(-1,0) fuera', () => expect(isInsideGrid(-1, 0, GRID_COLS, GRID_ROWS)).toBe(false));
  it('(cols,0) fuera', () => expect(isInsideGrid(GRID_COLS, 0, GRID_COLS, GRID_ROWS)).toBe(false));
  it('(0,-1) fuera', () => expect(isInsideGrid(0, -1, GRID_COLS, GRID_ROWS)).toBe(false));
  it('(0,rows) fuera', () => expect(isInsideGrid(0, GRID_ROWS, GRID_COLS, GRID_ROWS)).toBe(false));
});
