export const BASE_WIDTH = 640;
export const BASE_HEIGHT = 360;

export function calcularZoomEntero(anchoVentana, altoVentana) {
  const factor = Math.min(anchoVentana / BASE_WIDTH, altoVentana / BASE_HEIGHT);
  return Math.max(1, Math.floor(factor));
}

// Tamaño lógico del juego para llenar la ventana con zoom entero:
// al menos se ve BASE_WIDTH×BASE_HEIGHT y el sobrante (menos de un zoom) se recorta
export function calcularTamanoJuego(anchoVentana, altoVentana) {
  const zoom = calcularZoomEntero(anchoVentana, altoVentana);
  return {
    zoom,
    width: Math.max(BASE_WIDTH, Math.ceil(anchoVentana / zoom)),
    height: Math.max(BASE_HEIGHT, Math.ceil(altoVentana / zoom)),
  };
}
