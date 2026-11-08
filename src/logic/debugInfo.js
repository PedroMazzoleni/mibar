// Texto del panel de depuración. hover/click son { col, row } o null; furniture, el tipo del último mueble pulsado.
export function formatTile(tile) {
  return tile ? `${tile.col},${tile.row}` : '-';
}

export function formatDebugText({ fps, hover = null, click = null, furniture = null }) {
  return [
    `FPS ${Math.round(fps)}`,
    `casilla ${formatTile(hover)}`,
    `clic ${formatTile(click)}`,
    `mueble ${furniture ?? '-'}`,
  ].join('\n');
}
