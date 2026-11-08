import { clampTooltipPosition } from '../logic/furnitureNames.js';

const PADDING_X = 6;
const PADDING_Y = 3;

// Tooltip fijo en pantalla que sigue al puntero (coordenadas de pantalla)
export default class Tooltip {
  constructor(scene) {
    this.scene = scene;
    this.bg = scene.add.graphics();
    this.text = scene.add.text(PADDING_X, PADDING_Y, '', {
      fontSize: '16px',
      color: '#f4ead2',
      lineSpacing: 2,
    });
    this.container = scene.add
      .container(0, 0, [this.bg, this.text])
      .setScrollFactor(0)
      .setDepth(1001)
      .setVisible(false);
    this.w = 0;
    this.h = 0;
  }

  show(text, pointer) {
    this.text.setText(text);
    this.w = Math.ceil(this.text.width) + PADDING_X * 2;
    this.h = Math.ceil(this.text.height) + PADDING_Y * 2;
    this.bg.clear();
    this.bg.fillStyle(0x1e1a1d, 0.9);
    this.bg.fillRect(0, 0, this.w, this.h);
    this.bg.lineStyle(1, 0xdcae6a, 1);
    this.bg.strokeRect(0.5, 0.5, this.w - 1, this.h - 1);
    this.container.setVisible(true);
    this.move(pointer);
  }

  move(pointer) {
    if (!this.container.visible) return;
    const { width, height } = this.scene.scale;
    const { x, y } = clampTooltipPosition(pointer.x, pointer.y, this.w, this.h, width, height);
    this.container.setPosition(x, y);
  }

  hide() {
    this.container.setVisible(false);
  }
}
