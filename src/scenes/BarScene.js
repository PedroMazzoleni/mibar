import Phaser from 'phaser';
import { clampScroll, dragScroll, screenToWorld } from '../logic/camera.js';
import { isInsideGrid } from '../logic/grid.js';
import {
  gridToScreen,
  screenToGrid,
  screenToGridF,
  mapOrigin,
  mapPixelSize,
  tileCorners,
  depthOf,
  moverDepthSub,
} from '../logic/iso.js';
import { layoutTopBar } from '../logic/barStatus.js';
import { findLayer, readFurniture } from '../logic/tiledMap.js';
import { getFurnitureLabel } from '../logic/furnitureNames.js';
import { buildNavGrid } from '../logic/navGrid.js';
import Mover from '../objects/Mover.js';
import CustomerSprite from '../objects/CustomerSprite.js';
import CustomerSystem from '../systems/customerSystem.js';
import FurnitureSprite from '../objects/FurnitureSprite.js';
import Tooltip from '../ui/Tooltip.js';
import DebugPanel from '../ui/DebugPanel.js';

// Píxeles mínimos de movimiento para considerar que es un arrastre y no un clic
const DRAG_THRESHOLD = 3;
// Tecla que muestra/oculta las casillas no transitables
const NAV_KEY = 'F4';

// Profundidad: el suelo debajo de todo; paredes, muebles y zócalos ordenados por columna + fila.
// Dentro de una casilla, la pared del fondo va detrás del mueble y el zócalo de delante, encima.
// El rombo bajo el ratón se pinta sobre el suelo; las casillas de F4, por encima de todo el bar.
const DEPTH = { floor: 0, highlight: 1, overlay: 900 };
const DEPTH_BASE = 10;
const DEPTH_STEP = 10;
const SUB = { paredes: 0, furniture: 2, mover: 3, zocalos: 5 };
// Tecla del banco de pruebas de profundidad (solo DEV)
const MOVER_TEST_KEY = 'F5';
// Tecla que crea un cliente de prueba (solo DEV)
const CUSTOMER_TEST_KEY = 'F6';
const TILE_LAYERS = ['suelo', 'paredes', 'zocalos'];

const depthIn = (col, row, sub) => DEPTH_BASE + depthOf(col, row) * DEPTH_STEP + sub;

// Profundidad de algo que se mueve: se calcula con los pies (x, y en mundo), no con una casilla
const depthForMover = (x, y, origin) => {
  const { gc, gr } = screenToGridF(x, y, origin);
  return depthIn(Math.floor(gc), Math.floor(gr), moverDepthSub(gc, gr));
};

// Escena del bar: mapa isométrico de Tiled con sus muebles, cámara arrastrable y navegación
export default class BarScene extends Phaser.Scene {
  constructor() {
    super('Bar');
  }

  create() {
    // El JSON crudo de Tiled es el que entiende la lógica pura
    const mapData = this.cache.json.get('bar-map');
    this.cols = mapData.width;
    this.rows = mapData.height;
    this.origin = mapOrigin(this.rows);
    const size = mapPixelSize(this.cols, this.rows);
    this.worldW = size.width;
    this.worldH = size.height;

    this.drawTileLayers(mapData);
    // Los muebles que comparten casilla (grifo sobre la barra) siguen el orden del mapa
    this.furniture = readFurniture(mapData).map((f, i) => {
      const { x, y } = this.bottomCorner(f.col, f.row);
      return new FurnitureSprite(this, f, 'bar-tiles', x, y).setDepth(
        depthIn(f.col, f.row, SUB.furniture + i / 1000),
      );
    });
    this.nav = buildNavGrid(mapData);

    this.navOverlay = this.drawNavOverlay().setDepth(DEPTH.overlay).setVisible(false);
    this.input.keyboard
      .addKey(NAV_KEY)
      .on('down', () => this.navOverlay.setVisible(!this.navOverlay.visible));

    // Objetos que se mueven: se reordenan por profundidad en cada frame
    this.movers = [];
    if (import.meta.env.DEV) this.setupMoverTest();
    this.customerSystem = new CustomerSystem(this, mapData);
    if (import.meta.env.DEV) {
      this.input.keyboard.addKey(CUSTOMER_TEST_KEY).on('down', () => {
        this.customerSystem.spawnCustomer(this.scene.get('Hud').status);
      });
    }

    // Rombo de la casilla bajo el ratón (el mueble se ilumina por su cuenta)
    this.highlight = this.add.graphics().setDepth(DEPTH.highlight).setVisible(false);
    this.hovered = null;

    // Tooltip con el nombre del mueble y cursor de mano
    this.tooltip = new Tooltip(this);
    this.names = this.cache.json.get('furniture-names') ?? {};

    // Panel de depuración (F3): visible al arrancar solo en desarrollo
    this.debug = new DebugPanel(this, { visible: import.meta.env.DEV });
    // HUD en paralelo, por encima del bar
    this.scene.launch('Hud');

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
      if (this.isOverTopBar(pointer)) return;
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
      // Sobre la barra superior no hay resaltado, hover ni tooltip
      if (this.isOverTopBar(pointer)) {
        this.setHovered(null);
        this.refreshHoverUi(pointer);
        this.updateHighlight(pointer);
        return;
      }
      this.refreshHoverUi(pointer);
      this.updateHighlight(pointer);
    });
    this.input.on('pointerup', (pointer, over) => {
      // Un clic sobre la barra superior no activa casillas ni muebles
      if (this.isOverTopBar(pointer)) {
        this.resetDrag();
        return;
      }
      // Clic sin arrastre: casilla pulsada y, si lo hay, el mueble de encima
      if (this.dragStart && !this.dragging) {
        this.debug.setClick(this.tileAt(pointer));
        const customer = over.find((o) => o instanceof CustomerSprite);
        const target = over.find((o) => o instanceof FurnitureSprite);
        if (customer) this.customerSystem.onCustomerClick(customer);
        else if (target) this.onFurnitureClick(target);
      }
      this.resetDrag();
      // Al soltar sobre un mueble, el tooltip vuelve a mostrarse
      this.refreshHoverUi(pointer);
    });
    this.input.on('gameobjectover', (pointer, obj) => {
      if (obj instanceof FurnitureSprite && !this.isOverTopBar(pointer)) {
        this.setHovered(obj);
        this.refreshHoverUi(pointer);
      }
    });
    this.input.on('gameobjectout', (pointer, obj) => {
      if (obj === this.hovered) {
        this.setHovered(null);
        this.refreshHoverUi(pointer);
      }
    });
    this.input.on('gameout', () => {
      this.resetDrag();
      this.highlight.setVisible(false);
      this.setHovered(null);
      this.refreshHoverUi(this.input.activePointer);
      this.debug.setHover(null);
    });
  }

  // El puntero está sobre la barra superior (la dibuja HudScene)
  isOverTopBar(pointer) {
    return pointer.y < layoutTopBar(this.scale.width).totalHeight;
  }

  update(_time, delta) {
    this.customerSystem.update(delta);
    this.debug.setCustomers(this.customerSystem.debugText());
    this.debug.update();
    this.updateMoverDepth();
  }

  // Recalcula la profundidad de cada mover según dónde tiene los pies
  updateMoverDepth() {
    for (const m of this.movers) m.setDepth(depthForMover(m.x, m.y, this.origin));
  }

  // Banco de pruebas (F5, solo DEV): un marcador con los pies en el puntero
  setupMoverTest() {
    const marker = new Mover(this, 0, 0);
    marker.setVisible(false);
    this.movers.push(marker);
    this.moverTestOn = false;
    this.input.keyboard.addKey(MOVER_TEST_KEY).on('down', () => {
      this.moverTestOn = !this.moverTestOn;
      marker.setVisible(this.moverTestOn);
    });
    this.input.on('pointermove', (pointer) => {
      if (!this.moverTestOn) return;
      const cam = this.cameras.main;
      const w = screenToWorld(cam.scrollX, cam.scrollY, pointer.x, pointer.y, cam.zoom);
      marker.setPosition(w.x, w.y);
    });
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

  // Tooltip y cursor de mano: solo sobre un mueble interactivo y sin arrastrar la cámara
  refreshHoverUi(pointer) {
    if (this.hovered && !this.dragging) {
      const label = getFurnitureLabel(this.hovered.furnitureType, this.names);
      if (label !== this.shownLabel) {
        this.shownLabel = label;
        this.tooltip.show(label, pointer);
      } else {
        this.tooltip.move(pointer);
      }
      this.input.setDefaultCursor('pointer');
    } else {
      this.shownLabel = null;
      this.tooltip.hide();
      this.input.setDefaultCursor('');
    }
  }

  // Esquina inferior del rombo de una casilla: ahí se apoyan los frames del tileset
  bottomCorner(col, row) {
    return gridToScreen(col + 1, row + 1, this.origin);
  }

  // Capas de casillas como imágenes sueltas para ordenarlas por profundidad con los muebles
  drawTileLayers(mapData) {
    for (const name of TILE_LAYERS) {
      const layer = findLayer(mapData, name);
      if (!layer) continue;
      layer.data.forEach((gid, i) => {
        if (!gid) return;
        const col = i % layer.width;
        const row = Math.floor(i / layer.width);
        const { x, y } = this.bottomCorner(col, row);
        const depth = name === 'suelo' ? DEPTH.floor : depthIn(col, row, SUB[name]);
        this.add
          .image(x, y, 'bar-tiles', gid - 1)
          .setOrigin(0.5, 1)
          .setDepth(depth);
      });
    }
  }

  fillTile(g, col, row) {
    g.fillPoints(tileCorners(col, row, this.origin), true);
  }

  // Casillas no transitables en rojo translúcido (F4)
  drawNavOverlay() {
    const g = this.add.graphics();
    g.fillStyle(0xc8553d, 0.35);
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        // Lo de fuera del local (sin sala) no se marca
        if (!this.nav.walkable[row][col] && this.nav.room[row][col]) this.fillTile(g, col, row);
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
    const { col, row } = screenToGrid(world.x, world.y, this.origin);
    return isInsideGrid(col, row, this.cols, this.rows) ? { col, row } : null;
  }

  updateHighlight(pointer) {
    const tile = this.isOverTopBar(pointer) ? null : this.tileAt(pointer);
    this.debug.setHover(tile);
    if (!tile) {
      this.highlight.setVisible(false);
      return;
    }
    this.highlight.clear().fillStyle(0xc8553d, 0.35);
    this.fillTile(this.highlight, tile.col, tile.row);
    this.highlight.setVisible(true);
  }
}
