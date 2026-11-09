// Rejilla de navegación: qué casillas se pisan y entre cuáles se puede pasar.
// En isométrico las paredes van en los bordes de las casillas: entre dos salas distintas hay
// tabique salvo donde la capa `paredes` marca una puerta en el borde norte u oeste de la casilla.
import { findLayer, tileAt, readFurniture, readZones, gidProperty } from './tiledMap.js';

// Zonas que forman la misma sala (sin tabique entre ellas)
export const ROOM_ALIASES = { barra: 'sala' };

const roomOf = (zoneName) => ROOM_ALIASES[zoneName] ?? zoneName;
const grid = (cols, rows, value) => Array.from({ length: rows }, () => Array(cols).fill(value));

// { cols, rows, walkable[row][col], door[row][col] ('norte' | 'oeste' | null), room[row][col] }
export function buildNavGrid(map) {
  const cols = map.width;
  const rows = map.height;
  const floor = findLayer(map, 'suelo');
  const walls = findLayer(map, 'paredes');
  const doors = gidProperty(map, 'puerta');

  const walkable = grid(cols, rows, false);
  const door = grid(cols, rows, null);
  const room = grid(cols, rows, null);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      walkable[row][col] = tileAt(floor, col, row) > 0;
      door[row][col] = doors.get(tileAt(walls, col, row)) ?? null;
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

// ¿Hay puerta en el borde que separa dos casillas vecinas?
function doorBetween(nav, from, to) {
  if (from.col === to.col) {
    const south = from.row > to.row ? from : to;
    return nav.door[south.row][south.col] === 'norte';
  }
  const east = from.col > to.col ? from : to;
  return nav.door[east.row][east.col] === 'oeste';
}

// Paso ortogonal (en la rejilla) de una casilla a otra vecina
export function canMove(nav, from, to) {
  const dc = to.col - from.col;
  const dr = to.row - from.row;
  if (Math.abs(dc) + Math.abs(dr) !== 1) return false;
  if (!isWalkable(nav, from.col, from.row) || !isWalkable(nav, to.col, to.row)) return false;
  const a = nav.room[from.row][from.col];
  const b = nav.room[to.row][to.col];
  // Entre salas distintas hay tabique, salvo por una puerta
  if (a && b && a !== b) return doorBetween(nav, from, to);
  return true;
}
