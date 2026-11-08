import Phaser from 'phaser';
import { TILE_SIZE } from '../logic/grid.js';

const BAR_WIDTH = 320;
const BAR_HEIGHT = 24;
const MIN_DELAY_MS = 300;

// Escena de precarga: dibuja la barra de carga solo con Graphics
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const { width, height } = this.scale;
    const x = Math.round((width - BAR_WIDTH) / 2);
    const y = Math.round((height - BAR_HEIGHT) / 2);

    this.add
      .text(width / 2, y - 24, 'Cargando...', { fontSize: '20px', color: '#f2e8cf' })
      .setOrigin(0.5);

    // Marco
    const frame = this.add.graphics();
    frame.lineStyle(2, 0xf2e8cf, 1);
    frame.strokeRect(x - 4, y - 4, BAR_WIDTH + 8, BAR_HEIGHT + 8);

    // Relleno que crece con el progreso
    const bar = this.add.graphics();
    this.load.on('progress', (value) => {
      bar.clear();
      bar.fillStyle(0xc8553d, 1);
      bar.fillRect(x, y, Math.round(BAR_WIDTH * value), BAR_HEIGHT);
    });

    // Mapa del bar y su tileset (también como spritesheet para los muebles).
    // BASE_URL: '/' en desarrollo y '/mibar/' en el build de GitHub Pages
    this.load.setPath(import.meta.env.BASE_URL);
    this.load.json('furniture-names', 'assets/data/furniture-names.json');
    this.load.tilemapTiledJSON('bar', 'assets/maps/bar.tmj');
    this.load.spritesheet('bar-tiles', 'assets/sprites/bar-tiles.png', {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });
  }

  create() {
    // Retardo mínimo para que la barra no parpadee
    this.time.delayedCall(MIN_DELAY_MS, () => this.scene.start('Bar'));
  }
}
