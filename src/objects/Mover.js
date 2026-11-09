import Phaser from 'phaser';

// Contenedor mínimo de algo que se mueve: (x, y) son los pies; el dibujo queda encima de ellos.
// Marcador provisional: círculo de 8×8 (sin arte nuevo) y sin IA.
export default class Mover extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    const g = scene.add.graphics();
    g.fillStyle(0xc8553d, 1).fillCircle(0, -4, 4);
    g.lineStyle(1, 0x1e1a1d, 1).strokeCircle(0, -4, 4);
    this.add(g);
    scene.add.existing(this);
  }
}
