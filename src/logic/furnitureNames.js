// Nombre legible de un mueble; si falta en el JSON, el tipo con la primera letra en mayúscula
export function getFurnitureLabel(type, names) {
  const name = names?.[type];
  if (typeof name === 'string' && name) return name;
  const text = String(type ?? '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Posición del tooltip: a la derecha y debajo del puntero; si no cabe, a la izquierda / arriba.
// Siempre limitada a [0, vista - tamaño]
export function clampTooltipPosition(px, py, w, h, viewW, viewH, offset = 12) {
  let x = px + offset;
  if (x + w > viewW) x = px - offset - w;
  let y = py + offset;
  if (y + h > viewH) y = py - offset - h;
  return {
    x: Math.max(0, Math.min(x, viewW - w)),
    y: Math.max(0, Math.min(y, viewH - h)),
  };
}
