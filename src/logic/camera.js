// Limita el scroll al mundo; si el mundo es menor que la vista en un eje, lo centra
function clampAxis(scroll, world, view) {
  if (world < view) return Math.round((world - view) / 2);
  return Math.round(Math.min(Math.max(scroll, 0), world - view));
}

export function clampScroll(scrollX, scrollY, worldW, worldH, viewW, viewH) {
  return {
    x: clampAxis(scrollX, worldW, viewW),
    y: clampAxis(scrollY, worldH, viewH),
  };
}

// Punto de mundo bajo un puntero (coordenadas de juego) dado el scroll y el zoom de la cámara
export function screenToWorld(scrollX, scrollY, px, py, zoom) {
  return { x: scrollX + px / zoom, y: scrollY + py / zoom };
}

// Scroll resultante de arrastrar el puntero (sin limitar)
export function dragScroll(startScroll, startPointer, currentPointer, zoom) {
  return {
    x: startScroll.x - (currentPointer.x - startPointer.x) / zoom,
    y: startScroll.y - (currentPointer.y - startPointer.y) / zoom,
  };
}
