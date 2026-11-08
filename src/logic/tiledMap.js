// Lectura pura del JSON de Tiled (.tmj): capas, muebles, zonas y casillas de puerta
import { TILE_SIZE } from './grid.js';

// Propiedades de Tiled ([{ name, type, value }]) como objeto plano
export function readProperties(props = []) {
  return Object.fromEntries(props.map(({ name, value }) => [name, value]));
}

export function findLayer(map, name) {
  return map.layers.find((layer) => layer.name === name) ?? null;
}

// gid de la casilla (col, row) de una capa de casillas; 0 si está vacía o fuera
export function tileAt(layer, col, row) {
  if (!layer || col < 0 || row < 0 || col >= layer.width || row >= layer.height) return 0;
  return layer.data[row * layer.width + col];
}

// Tileset al que pertenece un gid (el de firstgid más alto que no lo supere)
function tilesetOf(map, gid) {
  return map.tilesets
    .filter((ts) => ts.firstgid <= gid)
    .reduce((best, ts) => (!best || ts.firstgid > best.firstgid ? ts : best), null);
}

// Muebles de la capa de objetos: frame dentro del tileset y casilla que pisan.
// Tiled ancla los objetos-casilla por la esquina inferior izquierda.
export function readFurniture(map, layerName = 'muebles', tileSize = TILE_SIZE) {
  const layer = findLayer(map, layerName);
  if (!layer) return [];
  return layer.objects
    .filter((o) => o.gid)
    .map((o) => {
      const tileset = tilesetOf(map, o.gid);
      const props = readProperties(o.properties);
      return {
        id: o.id,
        type: o.type,
        name: o.name,
        tileset: tileset?.name ?? null,
        frame: o.gid - (tileset?.firstgid ?? 1),
        x: o.x,
        y: o.y,
        col: Math.floor(o.x / tileSize),
        row: Math.round(o.y / tileSize) - 1,
        occupies: props.ocupa !== false,
      };
    });
}

// Zonas rectangulares en casillas y puntos sueltos (p. ej. la entrada)
export function readZones(map, layerName = 'zonas', tileSize = TILE_SIZE) {
  const layer = findLayer(map, layerName);
  const zones = [];
  const points = {};
  for (const o of layer?.objects ?? []) {
    if (o.point) {
      points[o.name] = { x: o.x, y: o.y };
      continue;
    }
    zones.push({
      name: o.name,
      col: Math.round(o.x / tileSize),
      row: Math.round(o.y / tileSize),
      cols: Math.round(o.width / tileSize),
      rows: Math.round(o.height / tileSize),
    });
  }
  return { zones, points };
}

// gids cuyas casillas tienen la propiedad booleana indicada (p. ej. 'puerta')
export function gidsWithProperty(map, property) {
  const gids = new Set();
  for (const ts of map.tilesets) {
    for (const tile of ts.tiles ?? []) {
      if (readProperties(tile.properties)[property] === true) gids.add(ts.firstgid + tile.id);
    }
  }
  return gids;
}
