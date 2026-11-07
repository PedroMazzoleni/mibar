import Phaser from 'phaser';
import {
  TILE_SIZE,
  GRID_COLS,
  GRID_ROWS,
  worldToTile,
  tileToWorld,
  isInsideGrid,
} from '../logic/grid.js';

// Escena de pruebas: rejilla 16x16 y resaltado de la casilla bajo el ratón
export default class TestScene extends Phaser.Scene {
  constructor() {
    super('Test');
  }

  create() {
    const width = GRID_COLS * TILE_SIZE;
    const height = GRID_ROWS * TILE_SIZE;

    // Rejilla con líneas de 1 px en coordenadas enteras
    const grid = this.add.graphics().setDepth(0);
    grid.lineStyle(1, 0xdcae6a, 0.25);
    for (let c = 0; c <= GRID_COLS; c++) {
      grid.lineBetween(c * TILE_SIZE + 0.5, 0, c * TILE_SIZE + 0.5, height);
    }
    for (let r = 0; r <= GRID_ROWS; r++) {
      grid.lineBetween(0, r * TILE_SIZE + 0.5, width, r * TILE_SIZE + 0.5);
    }

    // Resaltado de casilla
    this.highlight = this.add
      .rectangle(0, 0, TILE_SIZE, TILE_SIZE, 0xc8553d, 0.5)
      .setOrigin(0, 0)
      .setDepth(1)
      .setVisible(false);

    // Texto temporal col,row
    this.label = this.add.text(4, 4, '', { fontSize: '8px', color: '#f4ead2' }).setDepth(2);

    this.input.on('pointermove', this.updateHighlight, this);
    this.input.on('pointerdown', this.updateHighlight, this);
    this.input.on('gameout', () => {
      this.highlight.setVisible(false);
      this.label.setText('');
    });
  }

  updateHighlight(pointer) {
    const { col, row } = worldToTile(pointer.worldX, pointer.worldY);
    if (!isInsideGrid(col, row, GRID_COLS, GRID_ROWS)) {
      this.highlight.setVisible(false);
      this.label.setText('');
      return;
    }
    const { x, y } = tileToWorld(col, row);
    this.highlight.setPosition(x, y).setVisible(true);
    this.label.setText(`${col},${row}`);
  }
}
