import Phaser from 'phaser';

// Colores de arte/paleta.json
const INK = 0x1e1a1d;
const CREAM = 0xf4ead2;
const TEXT_STYLE = { fontFamily: 'monospace', fontSize: '8px', color: '#1e1a1d' };
const TAIL = 4;

// Bocadillo con el pedido. (x, y) es el punto al que apunta la colita (abajo, centrado).
// Dibujo provisional con Graphics y texto; el pulido llegará en 7.3.
export default class OrderBubble extends Phaser.GameObjects.Container {
  constructor(scene, x, y, text) {
    super(scene, x, y);
    const label = scene.add.text(0, 0, text, TEXT_STYLE).setOrigin(0.5, 0.5);
    const w = Math.ceil(label.width) + 6;
    const h = Math.ceil(label.height) + 2;
    const g = scene.add.graphics();
    g.fillStyle(CREAM, 1).fillRect(-w / 2, -TAIL - h, w, h);
    g.lineStyle(1, INK, 1).strokeRect(-w / 2 + 0.5, -TAIL - h + 0.5, w - 1, h - 1);
    g.fillStyle(CREAM, 1).fillTriangle(-2, -TAIL - 0.5, 2, -TAIL - 0.5, 0, 0);
    g.lineStyle(1, INK, 1).lineBetween(-2, -TAIL, 0, 0).lineBetween(2, -TAIL, 0, 0);
    label.setPosition(0, -TAIL - h / 2);
    this.add([g, label]);
    this.bubbleW = w;
    this.bubbleH = h;
    scene.add.existing(this);
  }

  // Fijo en pantalla (para el vuelo hacia la cola en el HudScene)
  setFixed() {
    this.setScrollFactor(0);
    this.list.forEach((c) => c.setScrollFactor(0));
    return this;
  }
}
