import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildNavGrid, isWalkable, canMove } from '../src/logic/navGrid.js';
import { readFurniture, readZones } from '../src/logic/tiledMap.js';
import { worldToTile } from '../src/logic/grid.js';
import { INTERACTIVE_TYPES } from '../src/logic/furniture.js';
import { miniMap } from './fixtures/miniMap.js';

const at = (col, row) => ({ col, row });

describe('buildNavGrid (mapa mínimo)', () => {
  const nav = buildNavGrid(miniMap);
  it('tamaño del mapa', () => expect([nav.cols, nav.rows]).toEqual([4, 3]));
  it('paredes y casillas sin suelo no se pisan', () => {
    expect(isWalkable(nav, 0, 0)).toBe(false);
    expect(isWalkable(nav, 3, 0)).toBe(false);
  });
  it('la puerta se pisa aunque esté en la capa de paredes', () => {
    expect(isWalkable(nav, 1, 0)).toBe(true);
    expect(nav.door[0][1]).toBe(true);
  });
  it('un mueble ocupa su casilla salvo con ocupa:false', () => {
    expect(isWalkable(nav, 2, 1)).toBe(false);
    expect(isWalkable(nav, 0, 1)).toBe(true);
  });
  it('fuera del mapa no es transitable', () => expect(isWalkable(nav, -1, 5)).toBe(false));
  it('la barra cuenta como sala', () => expect(nav.room[1][3]).toBe('sala'));
});

describe('canMove (mapa mínimo)', () => {
  const nav = buildNavGrid(miniMap);
  it('dentro de la misma sala', () => expect(canMove(nav, at(0, 1), at(1, 1))).toBe(true));
  it('la puerta se cruza en vertical', () => expect(canMove(nav, at(1, 0), at(1, 1))).toBe(true));
  it('la puerta no se cruza de lado', () => {
    // Casilla vecina transitable de mentira para probar solo la regla de la puerta
    const lateral = buildNavGrid(miniMap);
    lateral.walkable[0][0] = true;
    expect(canMove(lateral, at(1, 0), at(0, 0))).toBe(false);
  });
  it('hay tabique entre salas distintas', () =>
    expect(canMove(nav, at(1, 1), at(1, 2))).toBe(false));
  it('barra y sala se comunican', () => expect(canMove(nav, at(3, 1), at(3, 2))).toBe(true));
  it('sin diagonales ni saltos', () => {
    expect(canMove(nav, at(0, 2), at(1, 1))).toBe(false);
    expect(canMove(nav, at(0, 2), at(2, 2))).toBe(false);
  });
  it('no se entra en casillas ocupadas', () =>
    expect(canMove(nav, at(1, 1), at(2, 1))).toBe(false));
});

describe('mapa real del bar', () => {
  const map = JSON.parse(readFileSync('public/assets/maps/bar.tmj', 'utf8'));
  const nav = buildNavGrid(map);
  const furniture = readFurniture(map);
  it('la entrada es transitable', () => {
    const { x, y } = readZones(map).points.entrada;
    const { col, row } = worldToTile(x, y);
    expect(isWalkable(nav, col, row)).toBe(true);
  });
  it('la barra y las mesas no se pisan', () => {
    for (const f of furniture.filter((m) => ['barra', 'mesa'].includes(m.type)))
      expect(isWalkable(nav, f.col, f.row)).toBe(false);
  });
  it('baño y cocina no se comunican a través del tabique', () => {
    expect(canMove(nav, at(4, 3), at(5, 3))).toBe(false);
  });
  it('las puertas interiores llevan del baño y la cocina a la sala', () => {
    expect(canMove(nav, at(2, 4), at(2, 5))).toBe(true);
    expect(canMove(nav, at(2, 5), at(2, 6))).toBe(true);
    expect(canMove(nav, at(8, 4), at(8, 5))).toBe(true);
    expect(canMove(nav, at(8, 5), at(8, 6))).toBe(true);
  });
  it('hay al menos un mueble de cada tipo interactivo', () => {
    const types = new Set(furniture.map((f) => f.type));
    for (const t of INTERACTIVE_TYPES) expect(types.has(t)).toBe(true);
  });
});
