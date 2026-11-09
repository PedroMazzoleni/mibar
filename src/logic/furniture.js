// Muebles con los que se puede interactuar (el valor de `type` en el mapa de Tiled)
export const INTERACTIVE_TYPES = [
  'barra',
  'mesa',
  'silla',
  'taburete',
  'grifo',
  'cafetera',
  'plancha',
  'caja',
  'freidora',
];

export function isInteractive(type) {
  return INTERACTIVE_TYPES.includes(type);
}
