import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import TestScene from './scenes/TestScene.js';
import { BASE_WIDTH, BASE_HEIGHT, calcularZoomEntero } from './logic/zoom.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#3b2f2a',
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: calcularZoomEntero(window.innerWidth, window.innerHeight),
  },
  scene: [BootScene, PreloadScene, TestScene],
});

function ajustarZoom() {
  game.scale.setZoom(calcularZoomEntero(window.innerWidth, window.innerHeight));
  game.scale.refresh();
}

window.addEventListener('resize', ajustarZoom);
