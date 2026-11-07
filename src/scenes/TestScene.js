import Phaser from 'phaser';
import { clampScroll, dragScroll, screenToWorld } from '../logic/camera.js';
import {
  TILE_SIZE,
  worldToTile,
  tileToWorld,
  isInsideGrid,
} from '../logic/grid.js';
import DebugPanel from '../ui/DebugPanel.js';

// Mundo de prueba provisional (hasta el mapa Tiled de la Fase 2)
const TEST_COLS = 40;
const TEST_ROWS = 24;
// Píxeles mínimos de movimiento para considerar que es un arrastre y no un clic
const DRAG_THRESHOLD = 3;

// Escena de pruebas: rejilla de casillas (TILE_SIZE) y resaltado de la casilla bajo el ratón
export default class TestScene extends Phaser.Scene {
  constructor() {
    super('Test');
  }

  create() {
    const width = TEST_COLS * TILE_SIZE;
    const height = TEST_ROWS * TILE_SIZE;

    // Rejilla con líneas de 1 px en coordenadas enteras
    const grid = this.add.graphics().setDepth(0);
    grid.lineStyle(1, 0xdcae6a, 0.25);
    for (let c = 0; c <= TEST_COLS; c++) {
      grid.lineBetween(c * TILE_SIZE + 0.5, 0, c * TILE_SIZE + 0.5, height);
    }
    for (let r = 0; r <= TEST_ROWS; r++) {
      grid.lineBetween(0, r * TILE_SIZE + 0.5, width, r * TILE_SIZE + 0.5);
    }

    // Resaltado de casilla
    this.highlight = this.add
      .rectangle(0, 0, TILE_SIZE, TILE_SIZE, 0xc8553d, 0.5)
      .setOrigin(0, 0)
      .setDepth(1)
      .setVisible(false);

    // Panel de depuración (F3): visible al arrancar solo en desarrollo
    this.debug = new DebugPanel(this, { visible: import.meta.env.DEV });

    this.worldW = width;
    this.worldH = height;
    this.dragging = false;
    this.dragStart = null;

    // Centra/limita la vista desde el inicio
    const cam = this.cameras.main;
    const s0 = clampScroll(cam.scrollX, cam.scrollY, width, height, cam.width, cam.height);
    cam.setScroll(s0.x, s0.y);

    this.input.on('pointerdown', (pointer) => {
      this.dragStart = {
        scroll: { x: cam.scrollX, y: cam.scrollY },
        pointer: { x: pointer.x, y: pointer.y },
      };
      this.dragging = false;
      this.updateHighlight(pointer);
    });
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown && this.dragStart) {
        const dx = pointer.x - this.dragStart.pointer.x;
        const dy = pointer.y - this.dragStart.pointer.y;
        if (!this.dragging && Math.hypot(dx, dy) >= DRAG_THRESHOLD) this.dragging = true;
        if (this.dragging) {
          const raw = dragScroll(
            this.dragStart.scroll,
            this.dragStart.pointer,
            { x: pointer.x, y: pointer.y },
            cam.zoom,
          );
          const c = clampScroll(raw.x, raw.y, this.worldW, this.worldH, cam.width, cam.height);
          cam.scrollX = c.x;
          cam.scrollY = c.y;
        }
      }
      this.updateHighlight(pointer);
    });
    this.input.on('pointerup', (pointer) => {
      // Clic sin arrastre: el panel muestra la casilla pulsada
      if (this.dragStart && !this.dragging) this.debug.setClick(this.tileAt(pointer));
      this.resetDrag();
    });
    this.input.on('gameout', () => {
      this.resetDrag();
      this.highlight.setVisible(false);
      this.debug.setHover(null);
    });
  }

  update() {
    this.debug.update();
  }

  resetDrag() {
    this.dragging = false;
    this.dragStart = null;
  }

  // Casilla bajo el puntero, o null si cae fuera del mundo
  tileAt(pointer) {
    // Conversión a mano con el scroll ya actualizado: ni pointer.worldX/Y ni getWorldPoint
    // (matriz de la cámara, se recalcula en preRender) reflejan el scroll asignado en este frame
    const cam = this.cameras.main;
    const world = screenToWorld(cam.scrollX, cam.scrollY, pointer.x, pointer.y, cam.zoom);
    const { col, row } = worldToTile(world.x, world.y);
    return isInsideGrid(col, row, TEST_COLS, TEST_ROWS) ? { col, row } : null;
  }

  updateHighlight(pointer) {
    const tile = this.tileAt(pointer);
    this.debug.setHover(tile);
    if (!tile) {
      this.highlight.setVisible(false);
      return;
    }
    const { x, y } = tileToWorld(tile.col, tile.row);
    this.highlight.setPosition(x, y).setVisible(true);
  }
}
