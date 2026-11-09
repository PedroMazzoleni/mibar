import { describe, it, expect } from 'vitest';
import { findPath } from '../src/logic/pathfinding.js';
import { buildNavGrid } from '../src/logic/navGrid.js';
import { miniMap } from './fixtures/miniMap.js';

const at = (col, row) => ({ col, row });

// Rejilla abierta de una sola sala para probar rutas
function openNav(cols, rows, blocked = []) {
  const walkable = Array.from({ length: rows }, () => Array(cols).fill(true));
  for (const b of blocked) walkable[b.row][b.col] = false;
  const grid = (v) => Array.from({ length: rows }, () => Array(cols).fill(v));
  return { cols, rows, walkable, door: grid(null), room: grid('sala') };
}

describe('findPath', () => {
  it('ruta simple en línea recta, con origen y destino', () => {
    const path = findPath(openNav(4, 1), at(0, 0), at(3, 0));
    expect(path).toEqual([at(0, 0), at(1, 0), at(2, 0), at(3, 0)]);
  });
  it('rodea un obstáculo', () => {
    const nav = openNav(3, 3, [at(1, 0), at(1, 1)]);
    const path = findPath(nav, at(0, 0), at(2, 0));
    expect(path[0]).toEqual(at(0, 0));
    expect(path.at(-1)).toEqual(at(2, 0));
    expect(path.some((p) => p.col === 1 && p.row < 2)).toBe(false);
    expect(path).toContainEqual(at(1, 2));
  });
  it('solo pasos ortogonales', () => {
    const path = findPath(openNav(4, 4), at(0, 0), at(3, 3));
    for (let i = 1; i < path.length; i++) {
      expect(
        Math.abs(path[i].col - path[i - 1].col) + Math.abs(path[i].row - path[i - 1].row),
      ).toBe(1);
    }
  });
  it('no atraviesa un tabique sin puerta', () => {
    const nav = buildNavGrid(miniMap);
    // baño (0,0) y sala (0,1) no tienen puerta entre sí, pero sí por (1,0)-(1,1)
    const path = findPath(nav, at(0, 0), at(0, 1));
    expect(path).toEqual([at(0, 0), at(1, 0), at(1, 1), at(0, 1)]);
  });
  it('pasa por la puerta', () => {
    const nav = buildNavGrid(miniMap);
    const path = findPath(nav, at(1, 1), at(1, 0));
    expect(path).toEqual([at(1, 1), at(1, 0)]);
  });
  it('null si es inalcanzable', () => {
    const nav = openNav(3, 1, [at(1, 0)]);
    expect(findPath(nav, at(0, 0), at(2, 0))).toBeNull();
  });
  it('null si el destino no se pisa', () => {
    expect(findPath(openNav(3, 1, [at(2, 0)]), at(0, 0), at(2, 0))).toBeNull();
  });
});
