import Phaser from 'phaser';

// Escena de arranque: ajustes mínimos y paso a la precarga
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.cameras.main.setBackgroundColor('#3b2f2a');
    this.scene.start('Preload');
  }
}
