import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildNavGrid, isWalkable, canMove } from '../src/logic/navGrid.js';
import { readFurniture, readZones } from '../src/logic/tiledMap.js';
import { INTERACTIVE_TYPES } from '../src/logic/furniture.js';
import { miniMap } from './fixtures/miniMap.js';

const at = (col, row) => ({ col, row });

describe('buildNavGrid (mapa mínimo)', () => {
  const nav = buildNavGrid(miniMap);
  it('tamaño del mapa', () => expect([nav.cols, nav.rows]).toEqual([4, 3]));
  it('sin suelo no se pisa', () => expect(isWalkable(nav, 3, 0)).toBe(false));
  it('las paredes van en los bordes: la casilla con puerta se pisa', () => {
    expect(isWalkable(nav, 1, 1)).toBe(true);
    expect(nav.door[1][1]).toBe('norte');
    expect(nav.door[2][3]).toBe('oeste');
    expect(nav.door[0][0]).toBeNull();
  });
  it('un mueble ocupa su casilla salvo con ocupa:false', () => {
    expect(isWalkable(nav, 0, 2)).toBe(false);
    expect(isWalkable(nav, 1, 2)).toBe(true);
  });
  it('fuera del mapa no es transitable', () => expect(isWalkable(nav, -1, 5)).toBe(false));
  it('la barra cuenta como sala', () => expect(nav.room[1][2]).toBe('sala'));
});

describe('canMove (mapa mínimo)', () => {
  const nav = buildNavGrid(miniMap);
  it('dentro de la misma sala', () => expect(canMove(nav, at(0, 1), at(1, 1))).toBe(true));
  it('barra y sala se comunican', () => expect(canMove(nav, at(1, 1), at(2, 1))).toBe(true));
  it('puerta en el borde norte, en los dos sentidos', () => {
    expect(canMove(nav, at(1, 0), at(1, 1))).toBe(true);
    expect(canMove(nav, at(1, 1), at(1, 0))).toBe(true);
  });
  it('tabique entre salas sin puerta', () => expect(canMove(nav, at(0, 0), at(0, 1))).toBe(false));
  it('puerta en el borde oeste', () => {
    expect(canMove(nav, at(2, 2), at(3, 2))).toBe(true);
    expect(canMove(nav, at(2, 1), at(3, 1))).toBe(false);
  });
  it('sin diagonales ni saltos', () => {
    expect(canMove(nav, at(0, 1), at(1, 2))).toBe(false);
    expect(canMove(nav, at(0, 1), at(2, 1))).toBe(false);
  });
  it('no se entra en casillas ocupadas', () =>
    expect(canMove(nav, at(0, 1), at(0, 2))).toBe(false));
});

describe('mapa real del bar', () => {
  const map = JSON.parse(readFileSync('public/assets/maps/bar.tmj', 'utf8'));
  const nav = buildNavGrid(map);
  const furniture = readFurniture(map);
  it('es un mapa isométrico de 32×16', () => {
    expect(map.orientation).toBe('isometric');
    expect([map.tilewidth, map.tileheight]).toEqual([32, 16]);
  });
  it('la entrada es transitable', () => {
    const { gc, gr } = readZones(map).points.entrada;
    expect(isWalkable(nav, Math.floor(gc), Math.floor(gr))).toBe(true);
  });
  it('la barra y las mesas no se pisan', () => {
    for (const f of furniture.filter((m) => ['barra', 'mesa'].includes(m.type)))
      expect(isWalkable(nav, f.col, f.row)).toBe(false);
  });
  it('baño y cocina no se comunican a través del tabique', () =>
    expect(canMove(nav, at(4, 4), at(5, 4))).toBe(false));
  it('las puertas del baño y la cocina dan a la sala', () => {
    expect(canMove(nav, at(1, 5), at(1, 6))).toBe(true);
    expect(canMove(nav, at(0, 5), at(0, 6))).toBe(false);
    expect(canMove(nav, at(7, 5), at(7, 6))).toBe(true);
  });
  it('hay al menos un mueble de cada tipo interactivo', () => {
    const types = new Set(furniture.map((f) => f.type));
    for (const t of INTERACTIVE_TYPES) expect(types.has(t)).toBe(true);
  });
});
