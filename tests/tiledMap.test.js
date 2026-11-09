import { describe, it, expect } from 'vitest';
import {
  readProperties,
  findLayer,
  tileAt,
  objectToGrid,
  readFurniture,
  readZones,
  gidProperty,
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
    expect(tileAt(walls, 1, 1)).toBe(3);
    expect(tileAt(walls, 0, 0)).toBe(0);
    expect(tileAt(walls, -1, 0)).toBe(0);
    expect(tileAt(walls, 4, 0)).toBe(0);
    expect(tileAt(null, 0, 0)).toBe(0);
  });
});

describe('objectToGrid', () => {
  it('divide entre tileheight en los dos ejes', () =>
    expect(objectToGrid(miniMap, 24, 40)).toEqual({ gc: 1.5, gr: 2.5 }));
});

describe('readFurniture', () => {
  const [mesa, tragaperras] = readFurniture(miniMap);
  it('frame relativo al tileset y casilla desde la esquina inferior del rombo', () => {
    expect(mesa).toMatchObject({ id: 1, type: 'mesa', frame: 8, col: 0, row: 2 });
    expect(mesa.tileset).toBe('bar-tiles');
    expect(tragaperras).toMatchObject({ col: 1, row: 2 });
  });
  it('ocupa por defecto; ocupa:false cuando el mapa lo dice', () => {
    expect(mesa.occupies).toBe(true);
    expect(tragaperras.occupies).toBe(false);
  });
  it('sin capa de muebles → lista vacía', () => expect(readFurniture(miniMap, 'nada')).toEqual([]));
});

describe('readZones', () => {
  const { zones, points } = readZones(miniMap);
  it('zonas en casillas', () => {
    expect(zones[0]).toEqual({ name: 'baño', col: 0, row: 0, cols: 3, rows: 1 });
    expect(zones[3]).toEqual({ name: 'cocina', col: 3, row: 1, cols: 1, rows: 2 });
  });
  it('puntos como punto de rejilla', () => expect(points.entrada).toEqual({ gc: 1.5, gr: 2.5 }));
});

describe('gidProperty', () => {
  it('devuelve el valor de la propiedad por gid', () =>
    expect([...gidProperty(miniMap, 'puerta')]).toEqual([
      [3, 'norte'],
      [4, 'oeste'],
    ]));
});
