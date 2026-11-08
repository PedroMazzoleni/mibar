import Phaser from 'phaser';
import { clampScroll, dragScroll, screenToWorld } from '../logic/camera.js';
import { TILE_SIZE, worldToTile, tileToWorld, isInsideGrid } from '../logic/grid.js';
import { readFurniture } from '../logic/tiledMap.js';
import { buildNavGrid } from '../logic/navGrid.js';
import FurnitureSprite from '../objects/FurnitureSprite.js';
import DebugPanel from '../ui/DebugPanel.js';

// Píxeles mínimos de movimiento para considerar que es un arrastre y no un clic
const DRAG_THRESHOLD = 3;
// Tecla que muestra/oculta las casillas no transitables
const NAV_KEY = 'F4';

const DEPTH = { floor: 0, walls: 1, furniture: 2, wallTops: 3, overlay: 4, highlight: 5 };

// Escena del bar: mapa de Tiled con sus muebles, cámara arrastrable y rejilla de navegación
export default class BarScene extends Phaser.Scene {
  constructor() {
    super('Bar');
  }

  create() {
    const map = this.make.tilemap({ key: 'bar' });
    const tileset = map.addTilesetImage('bar-tiles', 'bar-tiles');
    map.createLayer('suelo', tileset).setDepth(DEPTH.floor);
    map.createLayer('paredes', tileset).setDepth(DEPTH.walls);
    map.createLayer('muros', tileset).setDepth(DEPTH.wallTops);

    // El JSON crudo es el que entiende la lógica pura
    const mapData = this.cache.tilemap.get('bar').data;
    this.furniture = readFurniture(mapData).map((f) =>
      new FurnitureSprite(this, f, 'bar-tiles').setDepth(DEPTH.furniture),
    );
    this.nav = buildNavGrid(mapData);

    this.cols = map.width;
    this.rows = map.height;
    this.worldW = map.widthInPixels;
    this.worldH = map.heightInPixels;

    this.navOverlay = this.drawNavOverlay().setDepth(DEPTH.overlay).setVisible(false);
    this.input.keyboard
      .addKey(NAV_KEY)
      .on('down', () => this.navOverlay.setVisible(!this.navOverlay.visible));

    // Resaltado de la casilla bajo el ratón (el mueble se ilumina por su cuenta)
    this.highlight = this.add
      .rectangle(0, 0, TILE_SIZE, TILE_SIZE, 0xc8553d, 0.35)
      .setOrigin(0, 0)
      .setDepth(DEPTH.highlight)
      .setVisible(false);
    this.hovered = null;

    // Panel de depuración (F3): visible al arrancar solo en desarrollo
    this.debug = new DebugPanel(this, { visible: import.meta.env.DEV });

    const cam = this.cameras.main;
    cam.setBackgroundColor('#1e1a1d');
    const s0 = clampScroll(
      cam.scrollX,
      cam.scrollY,
      this.worldW,
      this.worldH,
      cam.width,
      cam.height,
    );
    cam.setScroll(s0.x, s0.y);

    this.dragging = false;
    this.dragStart = null;
    this.setupInput(cam);

    // La vista cambia con la ventana: la cámara ocupa todo y se vuelve a limitar el scroll
    const onResize = (size) => {
      cam.setSize(size.width, size.height);
      this.clampCamera();
    };
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => this.scale.off('resize', onResize));
  }

  clampCamera() {
    const cam = this.cameras.main;
    const c = clampScroll(
      cam.scrollX,
      cam.scrollY,
      this.worldW,
      this.worldH,
      cam.width,
      cam.height,
    );
    cam.setScroll(c.x, c.y);
  }

  setupInput(cam) {
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
    this.input.on('pointerup', (pointer, over) => {
      // Clic sin arrastre: casilla pulsada y, si lo hay, el mueble de encima
      if (this.dragStart && !this.dragging) {
        this.debug.setClick(this.tileAt(pointer));
        const target = over.find((o) => o instanceof FurnitureSprite);
        if (target) this.onFurnitureClick(target);
      }
      this.resetDrag();
    });
    this.input.on('gameobjectover', (pointer, obj) => {
      if (obj instanceof FurnitureSprite) this.setHovered(obj);
    });
    this.input.on('gameobjectout', (pointer, obj) => {
      if (obj === this.hovered) this.setHovered(null);
    });
    this.input.on('gameout', () => {
      this.resetDrag();
      this.highlight.setVisible(false);
      this.setHovered(null);
      this.debug.setHover(null);
    });
  }

  update() {
    this.debug.update();
  }

  onFurnitureClick(sprite) {
    this.debug.setFurniture(sprite.furnitureType);
    this.events.emit('furniture-click', sprite.furniture);
  }

  setHovered(sprite) {
    this.hovered?.setHovered(false);
    this.hovered = sprite;
    sprite?.setHovered(true);
  }

  // Casillas no transitables en rojo translúcido (F4)
  drawNavOverlay() {
    const g = this.add.graphics();
    g.fillStyle(0xc8553d, 0.35);
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.nav.walkable[row][col]) continue;
        const { x, y } = tileToWorld(col, row);
        g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }
    return g;
  }

  resetDrag() {
    this.dragging = false;
    this.dragStart = null;
  }

  // Casilla bajo el puntero, o null si cae fuera del mapa
  tileAt(pointer) {
    // Conversión a mano con el scroll ya actualizado: ni pointer.worldX/Y ni getWorldPoint
    // (matriz de la cámara, se recalcula en preRender) reflejan el scroll asignado en este frame
    const cam = this.cameras.main;
    const world = screenToWorld(cam.scrollX, cam.scrollY, pointer.x, pointer.y, cam.zoom);
    const { col, row } = worldToTile(world.x, world.y);
    return isInsideGrid(col, row, this.cols, this.rows) ? { col, row } : null;
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
