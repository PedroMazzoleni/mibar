import Phaser from 'phaser';

class TestScene extends Phaser.Scene {
  create() {
    this.add.rectangle(160, 90, 32, 32, 0xc8553d);
    this.add.text(8, 8, 'Bar Cubista', { fontSize: '10px', color: '#f2e8cf' });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 320,
  height: 180,
  pixelArt: true,
  backgroundColor: '#3b2f2a',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [TestScene],
});
