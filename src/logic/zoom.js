export const BASE_WIDTH = 320;
export const BASE_HEIGHT = 180;

export function calcularZoomEntero(anchoVentana, altoVentana) {
  const factor = Math.min(anchoVentana / BASE_WIDTH, altoVentana / BASE_HEIGHT);
  return Math.max(1, Math.floor(factor));
}
