import Phaser from 'phaser';

// Escena de arranque: ajustes mínimos y paso a la precarga
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1e1a1d');
    this.scene.start('Preload');
  }
}
