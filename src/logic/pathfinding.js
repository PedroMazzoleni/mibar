// Pathfinding sobre la rejilla de navegación con EasyStar (síncrono). Lógica pura, sin Phaser.
import EasyStar from 'easystarjs';
import { canMove } from './navGrid.js';

// Lado de la casilla destino desde el que llega el que camina (EasyStar usa la posición del origen)
const SIDES = [
  { dc: 1, dr: 0, side: EasyStar.RIGHT },
  { dc: -1, dr: 0, side: EasyStar.LEFT },
  { dc: 0, dr: 1, side: EasyStar.BOTTOM },
  { dc: 0, dr: -1, side: EasyStar.TOP },
];

// Ruta ortogonal de `from` a `to` (ambas incluidas) como [{ col, row }], o null si no hay ruta
export function findPath(nav, from, to) {
  const inside = (c) => c.col >= 0 && c.row >= 0 && c.col < nav.cols && c.row < nav.rows;
  if (!inside(from) || !inside(to)) return null;
  if (!nav.walkable[from.row][from.col] || !nav.walkable[to.row][to.col]) return null;
  if (from.col === to.col && from.row === to.row) return [{ col: from.col, row: from.row }];

  const easystar = new EasyStar.js();
  easystar.enableSync();
  easystar.setGrid(nav.walkable.map((r) => r.map((w) => (w ? 1 : 0))));
  easystar.setAcceptableTiles([1]);
  // Tabiques y puertas: cada casilla solo admite entrar desde los lados que canMove permite
  for (let row = 0; row < nav.rows; row++) {
    for (let col = 0; col < nav.cols; col++) {
      if (!nav.walkable[row][col]) continue;
      const allowed = SIDES.filter((s) =>
        canMove(nav, { col: col + s.dc, row: row + s.dr }, { col, row }),
      ).map((s) => s.side);
      easystar.setDirectionalCondition(col, row, allowed);
    }
  }

  let result = null;
  easystar.findPath(from.col, from.row, to.col, to.row, (path) => {
    result = path ? path.map((p) => ({ col: p.x, row: p.y })) : null;
  });
  easystar.calculate();
  return result;
}
