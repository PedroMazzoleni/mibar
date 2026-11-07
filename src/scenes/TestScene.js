import Phaser from 'phaser';

// Escena provisional hasta la tarea 1.3
export default class TestScene extends Phaser.Scene {
  constructor() {
    super('Test');
  }

  create() {
    this.add.rectangle(160, 90, 32, 32, 0xc8553d);
    this.add.text(8, 8, 'Bar Cubista', { fontSize: '10px', color: '#f2e8cf' });
  }
}
