import Phaser from 'phaser';
import { BASE_WIDTH, BASE_HEIGHT } from '../logic/zoom.js';

const BAR_WIDTH = 160;
const BAR_HEIGHT = 12;
const MIN_DELAY_MS = 300;

// Escena de precarga: dibuja la barra de carga solo con Graphics
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const x = Math.round((BASE_WIDTH - BAR_WIDTH) / 2);
    const y = Math.round((BASE_HEIGHT - BAR_HEIGHT) / 2);

    this.add
      .text(BASE_WIDTH / 2, y - 12, 'Cargando...', { fontSize: '10px', color: '#f2e8cf' })
      .setOrigin(0.5);

    // Marco
    const frame = this.add.graphics();
    frame.lineStyle(1, 0xf2e8cf, 1);
    frame.strokeRect(x - 2, y - 2, BAR_WIDTH + 4, BAR_HEIGHT + 4);

    // Relleno que crece con el progreso
    const bar = this.add.graphics();
    this.load.on('progress', (value) => {
      bar.clear();
      bar.fillStyle(0xc8553d, 1);
      bar.fillRect(x, y, Math.round(BAR_WIDTH * value), BAR_HEIGHT);
    });

    // Aquí se encolarán los assets existentes en public/assets/ (ahora no hay ninguno necesario)
  }

  create() {
    // Retardo mínimo para que la barra no parpadee
    this.time.delayedCall(MIN_DELAY_MS, () => this.scene.start('Test'));
  }
}
