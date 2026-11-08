import { describe, it, expect } from 'vitest';
import {
  readProperties,
  findLayer,
  tileAt,
  readFurniture,
  readZones,
  gidsWithProperty,
} from '../src/logic/tiledMap.js';
import { miniMap } from './fixtures/miniMap.js';

describe('readProperties', () => {
  it('convierte la lista de Tiled en objeto', () =>
    expect(readProperties([{ name: 'ocupa', type: 'bool', value: false }])).toEqual({
      ocupa: false,
    }));
  it('sin propiedades → objeto vacío', () => expect(readProperties()).toEqual({}));
});

describe('findLayer y tileAt', () => {
  it('encuentra la capa por nombre o devuelve null', () => {
    expect(findLayer(miniMap, 'suelo').name).toBe('suelo');
    expect(findLayer(miniMap, 'no-existe')).toBeNull();
  });
  it('lee el gid de una casilla y 0 fuera de la capa', () => {
    const walls = findLayer(miniMap, 'paredes');
    expect(tileAt(walls, 1, 0)).toBe(3);
    expect(tileAt(walls, 1, 1)).toBe(0);
    expect(tileAt(walls, -1, 0)).toBe(0);
    expect(tileAt(walls, 4, 0)).toBe(0);
    expect(tileAt(null, 0, 0)).toBe(0);
  });
});

describe('readFurniture', () => {
  const [mesa, tragaperras] = readFurniture(miniMap);
  it('frame relativo al tileset y casilla desde la esquina inferior izquierda', () => {
    expect(mesa).toMatchObject({ id: 1, type: 'mesa', frame: 8, col: 2, row: 1, x: 64, y: 64 });
    expect(mesa.tileset).toBe('bar-tiles');
  });
  it('ocupa por defecto; ocupa:false en las mitades de arriba', () => {
    expect(mesa.occupies).toBe(true);
    expect(tragaperras.occupies).toBe(false);
  });
  it('sin capa de muebles → lista vacía', () => expect(readFurniture(miniMap, 'nada')).toEqual([]));
});

describe('readZones', () => {
  const { zones, points } = readZones(miniMap);
  it('zonas en casillas', () =>
    expect(zones[0]).toEqual({ name: 'baño', col: 0, row: 1, cols: 2, rows: 1 }));
  it('puntos aparte', () => expect(points.entrada).toEqual({ x: 48, y: 80 }));
});

describe('gidsWithProperty', () => {
  it('devuelve los gid de las casillas de puerta', () =>
    expect([...gidsWithProperty(miniMap, 'puerta')]).toEqual([3]));
});
