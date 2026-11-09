// Proyección isométrica 2:1 (rombos de TILE_W × TILE_H).
// Un punto de rejilla (gc, gr) admite decimales: la casilla (col, row) va de (col, row) a (col+1, row+1);
// su esquina de arriba es el punto (col, row) y la de abajo, (col+1, row+1).
export const TILE_W = 32;
export const TILE_H = 16;
// Frames del tileset: rombo en las 16 filas de abajo y 32 px de altura por encima
export const FRAME_W = 32;
export const FRAME_H = 48;
// Altura que pueden subir paredes y muebles por encima del suelo
export const WALL_HEIGHT = FRAME_H - TILE_H;

// Punto de rejilla → pantalla (mundo)
export function gridToScreen(gc, gr, origin = { x: 0, y: 0 }) {
  return {
    x: origin.x + ((gc - gr) * TILE_W) / 2,
    y: origin.y + ((gc + gr) * TILE_H) / 2,
  };
}

// Pantalla (mundo) → casilla que contiene el punto (admite negativos, no limita rango)
export function screenToGrid(x, y, origin = { x: 0, y: 0 }) {
  const dx = (x - origin.x) / (TILE_W / 2);
  const dy = (y - origin.y) / (TILE_H / 2);
  return { col: Math.floor((dy + dx) / 2), row: Math.floor((dy - dx) / 2) };
}

// Origen para que el mapa entero quede en x ≥ 0 y con margen arriba para lo que sobresale
export function mapOrigin(rows, marginTop = WALL_HEIGHT) {
  return { x: (rows * TILE_W) / 2, y: marginTop };
}

// Rectángulo que ocupa el mapa en pantalla
export function mapPixelSize(cols, rows, marginTop = WALL_HEIGHT) {
  return {
    width: ((cols + rows) * TILE_W) / 2,
    height: ((cols + rows) * TILE_H) / 2 + marginTop,
  };
}

// Esquinas del rombo de una casilla: arriba, derecha, abajo, izquierda
export function tileCorners(col, row, origin) {
  return [
    gridToScreen(col, row, origin),
    gridToScreen(col + 1, row, origin),
    gridToScreen(col + 1, row + 1, origin),
    gridToScreen(col, row + 1, origin),
  ];
}

// Orden de dibujo: lo que está más abajo en pantalla (más columna + fila) va delante
export function depthOf(col, row) {
  return col + row;
}
