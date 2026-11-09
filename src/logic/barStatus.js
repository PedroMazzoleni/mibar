// Estado del bar (abierto/cerrado) y maquetación de la barra superior. Lógica pura, sin Phaser.

const BAR_HEIGHT = 20;
const PLATE_HEIGHT = 24;
const CENTER_WIDTH = 120;

// Estado inicial: por defecto el bar empieza cerrado
export function createBarStatus(open = false) {
  return { open: Boolean(open) };
}

// Devuelve un estado nuevo con el valor contrario, sin mutar el original
export function toggleOpen(status) {
  return { ...status, open: !status.open };
}

export function getStatusLabel(status) {
  return status.open ? 'ABIERTO' : 'CERRADO';
}

// Barra a todo el ancho y placa central centrada (nunca más ancha que la barra)
export function layoutTopBar(width) {
  const centerW = Math.min(CENTER_WIDTH, width);
  return {
    barHeight: BAR_HEIGHT,
    plateHeight: PLATE_HEIGHT,
    // Altura real ocupada por la barra (la mayor de barra y placa)
    totalHeight: Math.max(BAR_HEIGHT, PLATE_HEIGHT),
    centerX: (width - centerW) / 2,
    centerW,
  };
}
