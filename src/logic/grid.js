import { BASE_WIDTH, BASE_HEIGHT } from './zoom.js';

export const TILE_SIZE = 32;
export const GRID_COLS = Math.floor(BASE_WIDTH / TILE_SIZE);
export const GRID_ROWS = Math.floor(BASE_HEIGHT / TILE_SIZE);

// Coordenadas de mundo -> casilla (admite negativos, no limita rango)
export function worldToTile(x, y, tileSize = TILE_SIZE) {
  return { col: Math.floor(x / tileSize), row: Math.floor(y / tileSize) };
}

// Esquina superior izquierda de la casilla
export function tileToWorld(col, row, tileSize = TILE_SIZE) {
  return { x: col * tileSize, y: row * tileSize };
}

// Centro de la casilla
export function tileCenter(col, row, tileSize = TILE_SIZE) {
  return { x: col * tileSize + tileSize / 2, y: row * tileSize + tileSize / 2 };
}

export function isInsideGrid(col, row, cols = GRID_COLS, rows = GRID_ROWS) {
  return col >= 0 && row >= 0 && col < cols && row < rows;
}
