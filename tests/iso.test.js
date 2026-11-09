import { describe, it, expect } from 'vitest';
import {
  TILE_W,
  TILE_H,
  FRAME_H,
  WALL_HEIGHT,
  gridToScreen,
  screenToGrid,
  screenToGridF,
  mapOrigin,
  mapPixelSize,
  tileCorners,
  depthOf,
  depthOfPoint,
  moverDepthSub,
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

describe('screenToGridF', () => {
  const origin = { x: 160, y: 32 };
  it('ida y vuelta con gridToScreen, incluidos decimales', () => {
    for (const [gc, gr] of [
      [0, 0],
      [2.5, 3],
      [0.25, 7.75],
      [-1.5, 4.2],
      [12.125, 0.5],
    ]) {
      const s = gridToScreen(gc, gr, origin);
      const back = screenToGridF(s.x, s.y, origin);
      expect(back.gc).toBeCloseTo(gc, 10);
      expect(back.gr).toBeCloseTo(gr, 10);
    }
  });
  it('ida y vuelta en sentido contrario: pantalla → rejilla → pantalla', () => {
    const p = { x: 211.5, y: 97.25 };
    const g = screenToGridF(p.x, p.y, origin);
    const s = gridToScreen(g.gc, g.gr, origin);
    expect(s.x).toBeCloseTo(p.x, 10);
    expect(s.y).toBeCloseTo(p.y, 10);
  });
  it('los enteros caen en las esquinas de la casilla', () => {
    const top = gridToScreen(2, 2, origin);
    expect(screenToGridF(top.x, top.y, origin)).toEqual({ gc: 2, gr: 2 });
  });
});

describe('screenToGrid y screenToGridF coherentes', () => {
  const origin = { x: 160, y: 32 };
  it('screenToGrid es el suelo de screenToGridF', () => {
    for (const [x, y] of [
      [160, 40],
      [200, 90],
      [120, 60],
      [150, 10],
    ]) {
      const f = screenToGridF(x, y, origin);
      expect(screenToGrid(x, y, origin)).toEqual({
        col: Math.floor(f.gc),
        row: Math.floor(f.gr),
      });
    }
  });
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

describe('depthOfPoint', () => {
  it('depthOfPoint(2.5, 3) = 5.5', () => expect(depthOfPoint(2.5, 3)).toBe(5.5));
  it('con enteros coincide con depthOf', () => {
    for (let col = -2; col <= 6; col++) {
      for (let row = -2; row <= 6; row++) {
        expect(depthOfPoint(col, row)).toBe(depthOf(col, row));
      }
    }
  });
  it('un punto más abajo en pantalla (misma x) tiene profundidad mayor', () => {
    const origin = { x: 160, y: 32 };
    const x = 200;
    const high = screenToGridF(x, 60, origin);
    const low = screenToGridF(x, 61, origin);
    expect(depthOfPoint(low.gc, low.gr)).toBeGreaterThan(depthOfPoint(high.gc, high.gr));
  });
  it('desplazar (16, 8) px en pantalla sube la profundidad en 1', () => {
    const origin = { x: 0, y: 0 };
    const a = screenToGridF(0, 40, origin);
    const b = screenToGridF(16, 48, origin);
    expect(depthOfPoint(b.gc, b.gr) - depthOfPoint(a.gc, a.gr)).toBeCloseTo(1, 10);
  });
});

// Fórmula de BarScene (depthForMover) reproducida aquí sin importar Phaser:
// depthForMover(gc, gr) = depthIn(floor gc, floor gr, moverDepthSub(gc, gr)).
// Valores de BarScene.js: DEPTH_BASE = 10, DEPTH_STEP = 10, SUB = { furniture: 2, zocalos: 5 }.
const DEPTH_BASE = 10;
const DEPTH_STEP = 10;
const SUB = { furniture: 2, zocalos: 5 };
const depthIn = (col, row, sub) => DEPTH_BASE + depthOf(col, row) * DEPTH_STEP + sub;
const depthForMoverGrid = (gc, gr) =>
  depthIn(Math.floor(gc), Math.floor(gr), moverDepthSub(gc, gr));

// Casillas de muestra, incluidas negativas
const CELLS = [
  [0, 0],
  [2, 3],
  [7, 1],
  [4, 2],
  [3, 3],
  [-2, -1],
];
// Fracciones dentro de la casilla; 0.99 deja gc + gr cerca de c + r + 2
const FRACS = [0, 0.01, 0.2, 0.5, 0.8, 0.99];

describe('moverDepthSub', () => {
  it('siempre en [3, 3.9) dentro de la casilla', () => {
    for (const [c, r] of CELLS) {
      for (const a of FRACS) {
        for (const b of FRACS) {
          const s = moverDepthSub(c + a, r + b);
          expect(s).toBeGreaterThanOrEqual(3);
          expect(s).toBeLessThan(3.9);
        }
      }
    }
  });
  it('crece al avanzar hacia la esquina de abajo de la casilla', () => {
    expect(moverDepthSub(2.1, 3.1)).toBeLessThan(moverDepthSub(2.5, 3.5));
    expect(moverDepthSub(2.5, 3.5)).toBeLessThan(moverDepthSub(2.99, 3.99));
  });
});

describe('orden de dibujo del mover frente a muebles y zócalos', () => {
  it('para todo punto de (c,r) el mover queda estrictamente entre mueble (+2) y zócalo (+5) de su casilla', () => {
    for (const [c, r] of CELLS) {
      const furn = depthIn(c, r, SUB.furniture);
      const zoc = depthIn(c, r, SUB.zocalos);
      for (const a of FRACS) {
        for (const b of FRACS) {
          const m = depthForMoverGrid(c + a, r + b);
          expect(m).toBeGreaterThan(furn);
          expect(m).toBeLessThan(zoc);
        }
      }
    }
  });
  it('gc + gr cerca de c + r + 2 sigue entre mueble y zócalo de (c,r)', () => {
    for (const [c, r] of CELLS) {
      const m = depthForMoverGrid(c + 0.99, r + 0.99);
      expect(m).toBeGreaterThan(depthIn(c, r, SUB.furniture));
      expect(m).toBeLessThan(depthIn(c, r, SUB.zocalos));
    }
  });
  it('para todo punto de (c,r) el mover queda por debajo del mueble de (c+1,r) y de (c,r+1)', () => {
    for (const [c, r] of CELLS) {
      const furnRight = depthIn(c + 1, r, SUB.furniture);
      const furnDown = depthIn(c, r + 1, SUB.furniture);
      for (const a of FRACS) {
        for (const b of FRACS) {
          const m = depthForMoverGrid(c + a, r + b);
          expect(m).toBeLessThan(furnRight);
          expect(m).toBeLessThan(furnDown);
        }
      }
    }
  });
  it('en el centro de (c,r) va encima del mueble de (c-1,r) y debajo del de (c+1,r+1)', () => {
    const c = 3;
    const r = 3;
    const m = depthForMoverGrid(c + 0.5, r + 0.5);
    expect(m).toBeGreaterThan(depthIn(c - 1, r, SUB.furniture));
    expect(m).toBeLessThan(depthIn(c + 1, r + 1, SUB.furniture));
  });
  it('en la misma casilla, pies más abajo en pantalla → profundidad mayor', () => {
    const origin = { x: 160, y: 32 };
    for (const [c, r] of CELLS) {
      const center = gridToScreen(c + 0.5, r + 0.5, origin);
      let prev = null;
      for (let dy = -6; dy <= 6; dy++) {
        const g = screenToGridF(center.x, center.y + dy, origin);
        // Mismo x, distinto y: se mantiene dentro de la casilla
        expect(Math.floor(g.gc)).toBe(c);
        expect(Math.floor(g.gr)).toBe(r);
        const d = depthForMoverGrid(g.gc, g.gr);
        if (prev !== null) expect(d).toBeGreaterThan(prev);
        prev = d;
      }
    }
  });
});
