// Rejilla de navegación: qué casillas se pisan y entre cuáles se puede pasar
import { findLayer, tileAt, readFurniture, readZones, gidsWithProperty } from './tiledMap.js';

// Zonas que forman la misma sala (sin tabique entre ellas)
export const ROOM_ALIASES = { barra: 'sala' };

const roomOf = (zoneName) => ROOM_ALIASES[zoneName] ?? zoneName;
const grid = (cols, rows, value) => Array.from({ length: rows }, () => Array(cols).fill(value));

// { cols, rows, walkable[row][col], door[row][col], room[row][col] (nombre o null) }
export function buildNavGrid(map) {
  const cols = map.width;
  const rows = map.height;
  const floor = findLayer(map, 'suelo');
  const walls = findLayer(map, 'paredes');
  const doorGids = gidsWithProperty(map, 'puerta');

  const walkable = grid(cols, rows, false);
  const door = grid(cols, rows, false);
  const room = grid(cols, rows, null);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const wall = tileAt(walls, col, row);
      door[row][col] = doorGids.has(wall);
      walkable[row][col] = tileAt(floor, col, row) > 0 && (wall === 0 || door[row][col]);
    }
  }
  for (const f of readFurniture(map)) {
    if (f.occupies && walkable[f.row]?.[f.col] !== undefined) walkable[f.row][f.col] = false;
  }
  for (const z of readZones(map).zones) {
    for (let row = z.row; row < z.row + z.rows; row++) {
      for (let col = z.col; col < z.col + z.cols; col++) {
        if (room[row]?.[col] !== undefined) room[row][col] = roomOf(z.name);
      }
    }
  }
  return { cols, rows, walkable, door, room };
}

export function isWalkable(nav, col, row) {
  return nav.walkable[row]?.[col] === true;
}

// Paso ortogonal de una casilla a otra vecina
export function canMove(nav, from, to) {
  const dc = to.col - from.col;
  const dr = to.row - from.row;
  if (Math.abs(dc) + Math.abs(dr) !== 1) return false;
  if (!isWalkable(nav, from.col, from.row) || !isWalkable(nav, to.col, to.row)) return false;
  // Las puertas están en la pared: se cruzan de arriba abajo, nunca de lado
  if ((nav.door[from.row][from.col] || nav.door[to.row][to.col]) && dc !== 0) return false;
  // Entre salas distintas hay tabique
  const a = nav.room[from.row][from.col];
  const b = nav.room[to.row][to.col];
  return !(a && b && a !== b);
}
