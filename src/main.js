import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import BarScene from './scenes/BarScene.js';
import { calcularTamanoJuego } from './logic/zoom.js';

// El lienzo ocupa toda la ventana: zoom entero y tamaño lógico ajustado a lo que cabe
const inicial = calcularTamanoJuego(window.innerWidth, window.innerHeight);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: inicial.width,
  height: inicial.height,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#1e1a1d',
  scale: {
    mode: Phaser.Scale.NONE,
    zoom: inicial.zoom,
  },
  scene: [BootScene, PreloadScene, BarScene],
});

function ajustarTamano() {
  const { zoom, width, height } = calcularTamanoJuego(window.innerWidth, window.innerHeight);
  game.scale.setZoom(zoom);
  game.scale.resize(width, height);
}

window.addEventListener('resize', ajustarTamano);
