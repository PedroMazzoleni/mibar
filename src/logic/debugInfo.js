// Texto del panel de depuración. hover/click son { col, row } o null.
export function formatTile(tile) {
  return tile ? `${tile.col},${tile.row}` : '-';
}

export function formatDebugText({ fps, hover = null, click = null }) {
  return [`FPS ${Math.round(fps)}`, `casilla ${formatTile(hover)}`, `clic ${formatTile(click)}`].join(
    '\n',
  );
}
