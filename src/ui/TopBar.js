import { getStatusLabel, layoutTopBar } from '../logic/barStatus.js';

// Grises de arte/paleta.json: barra y tramo central más claro
const BAR_COLOR = 0x4f6070;
const CENTER_COLOR = 0x7f909c;

// Barra superior fija en pantalla con el estado ABIERTO/CERRADO en el centro
export default class TopBar {
  constructor(scene, width, status) {
    this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(2000);
    // Mismo estilo que DebugPanel para que el texto sea nítido (provisional)
    this.text = scene.add
      .text(0, 0, '', { fontSize: '16px', color: '#f4ead2' })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(2001);
    this.status = status;
    this.resize(width);
  }

  setOpen(open) {
    this.status = { open };
    this.text.setText(getStatusLabel(this.status));
  }

  resize(width) {
    const { barHeight, centerX, centerW } = layoutTopBar(width);
    this.gfx.clear();
    this.gfx.fillStyle(BAR_COLOR, 1).fillRect(0, 0, width, barHeight);
    this.gfx.fillStyle(CENTER_COLOR, 1).fillRect(centerX, 0, centerW, barHeight);
    this.text.setPosition(width / 2, barHeight / 2);
    this.text.setText(getStatusLabel(this.status));
  }
}
