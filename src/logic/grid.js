// Rejilla del mapa: la proyección a pantalla está en iso.js
export function isInsideGrid(col, row, cols, rows) {
  return col >= 0 && row >= 0 && col < cols && row < rows;
}
