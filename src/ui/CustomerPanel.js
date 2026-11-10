// Colores de arte/paleta.json
const INK = 0x1e1a1d;
const DARK = 0x2f3a48;
const BAR_COLOR = 0x4f6070;
const MID = 0x7f909c;

const W = 140;
const H = 64;
const MARGIN = 6;
const CLOSE = 10;
const BTN_W = 84;
const BTN_H = 14;
const STYLE = { fontFamily: 'monospace', fontSize: '8px', color: '#f4ead2' };

// Panel del cliente en el HudScene: tipo, estado, pedido, X de cerrar y botón provisional
// "Avanzar estado". Sin objetos interactivos: los clics se comprueban a mano (hit/click).
export default class CustomerPanel {
  constructor(scene, width, height) {
    this.scene = scene;
    this.customerId = null;
    this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(2100).setVisible(false);
    const mk = (style = STYLE) =>
      scene.add.text(0, 0, '', style).setScrollFactor(0).setDepth(2101).setVisible(false);
    this.title = mk({ ...STYLE, color: '#dcae6a' });
    this.state = mk();
    this.order = mk();
    this.closeText = mk();
    this.btnText = mk();
    this.closeText.setText('X');
    this.btnText.setText('Avanzar estado');
    this.texts = [this.title, this.state, this.order, this.closeText, this.btnText];
    this.resize(width, height);
  }

  get visible() {
    return this.customerId !== null;
  }

  resize(_width, height) {
    this.x = MARGIN;
    this.y = height - H - MARGIN;
    if (this.visible) this.layout();
  }

  open(id) {
    this.customerId = id;
    this.gfx.setVisible(true);
    this.texts.forEach((t) => t.setVisible(true));
    this.layout();
  }

  close() {
    this.customerId = null;
    this.gfx.clear().setVisible(false);
    this.texts.forEach((t) => t.setVisible(false));
  }

  // Actualiza los textos {title, stateLabel, orderLabel}
  setInfo(info) {
    this.title.setText(info.title);
    this.state.setText(info.stateLabel);
    this.order.setText(info.orderLabel);
  }

  btnRect() {
    return { x: this.x + 6, y: this.y + H - BTN_H - 6, w: BTN_W, h: BTN_H };
  }

  closeRect() {
    return { x: this.x + W - CLOSE - 3, y: this.y + 3, w: CLOSE, h: CLOSE };
  }

  layout() {
    const { x, y } = this;
    const g = this.gfx.clear();
    g.fillStyle(INK, 1).fillRect(x, y, W, H);
    g.fillStyle(DARK, 1).fillRect(x + 1, y + 1, W - 2, H - 2);
    g.fillStyle(MID, 1).fillRect(x + 1, y + 1, W - 2, 1);
    const c = this.closeRect();
    g.fillStyle(INK, 1).fillRect(c.x, c.y, c.w, c.h);
    g.fillStyle(BAR_COLOR, 1).fillRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    const b = this.btnRect();
    g.fillStyle(INK, 1).fillRect(b.x, b.y, b.w, b.h);
    g.fillStyle(BAR_COLOR, 1).fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
    g.fillStyle(MID, 1).fillRect(b.x + 1, b.y + 1, b.w - 2, 1);
    this.title.setPosition(x + 6, y + 5);
    this.state.setPosition(x + 6, y + 18);
    this.order.setPosition(x + 6, y + 29);
    this.closeText.setPosition(c.x + 3, c.y + 1);
    this.btnText.setPosition(b.x + 6, b.y + 3);
  }

  // El punto cae dentro del panel (abierto)
  hit(px, py) {
    return this.visible && px >= this.x && px <= this.x + W && py >= this.y && py <= this.y + H;
  }

  // Devuelve 'close', 'advance' o null según dónde se haya pulsado
  click(px, py) {
    if (!this.visible) return null;
    const inside = (r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    if (inside(this.closeRect())) return 'close';
    if (inside(this.btnRect())) return 'advance';
    return null;
  }
}
