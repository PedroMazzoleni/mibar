import { SPEEDS, DEFAULT_SPEED } from '../logic/gameTime.js';
import { getStatusLabel, layoutTopBar } from '../logic/barStatus.js';

// Colores de arte/paleta.json
const INK = 0x1e1a1d; // 0
const DARK = 0x2f3a48; // d
const BAR_COLOR = 0x4f6070; // e
const MID = 0x7f909c; // f
const LIGHT = 0xb3c0c6; // g
const RED = 0xc8553d; // r
const GREEN = 0x3e8e7e; // W

const BLINK_MS = 500;
const LED_SIZE = 3;
const LED_GAP = 6;
const ROW_H = 18;
const MENU_W = 52;

// Barra superior fija en pantalla con el estado ABIERTO/CERRADO en el centro
export default class TopBar {
  constructor(scene, width, status) {
    this.scene = scene;
    this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(2000);
    this.led = scene.add.graphics().setScrollFactor(0).setDepth(2001);
    // Mismo estilo que DebugPanel para que el texto sea nítido (provisional)
    this.text = scene.add
      .text(0, 0, '', { fontSize: '16px', color: '#ffffff' })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(2001);
    // Hora ficticia a la derecha de la placa central (provisional hasta 5.1)
    this.timeText = scene.add
      .text(0, 0, '', { fontSize: '16px', color: '#b3c0c6' })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(2001);
    this.timeLabel = '';
    this.speed = DEFAULT_SPEED;
    this.menuOpen = false;
    // Menú de velocidad (pixel art gris, oculto hasta pulsar la hora)
    this.menuGfx = scene.add.graphics().setScrollFactor(0).setDepth(2002).setVisible(false);
    this.menuTexts = SPEEDS.map((v) =>
      scene.add
        .text(0, 0, `x${v}`, { fontSize: '16px', color: '#b3c0c6' })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(2003)
        .setVisible(false),
    );
    this.status = status;
    this.ledVisible = true;
    // Parpadeo suave del LED para indicar que el valor es variable
    this.blink = scene.time.addEvent({
      delay: BLINK_MS,
      loop: true,
      callback: () => {
        this.ledVisible = !this.ledVisible;
        this.drawLed();
      },
    });
    this.resize(width);
  }

  setOpen(open) {
    this.status = { open };
    this.refreshText();
    this.drawLed();
  }

  setTime(label, speed = DEFAULT_SPEED) {
    const full = `${label} x${speed}`;
    if (full === this.timeLabel && speed === this.speed) return;
    this.timeLabel = full;
    this.speed = speed;
    this.timeText.setText(full);
    if (this.menuOpen) this.drawMenu();
  }

  // Rectángulo de la hora (con margen) para el clic
  hitClock(x, y) {
    const t = this.timeText;
    return x >= t.x - 2 && x <= t.x + t.width + 2 && y >= 0 && y < this.barH;
  }

  // Velocidad de la opción bajo el puntero, o null (solo con el menú abierto)
  hitMenu(x, y) {
    if (!this.menuOpen) return null;
    const mx = this.timeText.x;
    if (x < mx || x > mx + MENU_W) return null;
    const i = Math.floor((y - this.barH - 2) / ROW_H);
    return i >= 0 && i < SPEEDS.length ? SPEEDS[i] : null;
  }

  openMenu() {
    this.menuOpen = true;
    this.drawMenu();
  }

  closeMenu() {
    this.menuOpen = false;
    this.menuGfx.clear().setVisible(false);
    this.menuTexts.forEach((t) => t.setVisible(false));
  }

  drawMenu() {
    const g = this.menuGfx.clear().setVisible(true);
    const x = this.timeText.x;
    const y = this.barH;
    const h = SPEEDS.length * ROW_H + 4;
    g.fillStyle(INK, 1).fillRect(x, y, MENU_W, h);
    g.fillStyle(DARK, 1).fillRect(x + 1, y, MENU_W - 2, h - 1);
    g.fillStyle(MID, 1).fillRect(x + 1, y, MENU_W - 2, 1);
    g.fillStyle(INK, 1).fillRect(x + 1, y + h - 2, MENU_W - 2, 1);
    SPEEDS.forEach((v, i) => {
      const ry = y + 2 + i * ROW_H;
      if (v === this.speed) g.fillStyle(BAR_COLOR, 1).fillRect(x + 2, ry, MENU_W - 4, ROW_H);
      const t = this.menuTexts[i];
      t.setPosition(x + 6, ry + ROW_H / 2).setVisible(true);
      t.setColor(v === this.speed ? '#3e8e7e' : '#b3c0c6');
    });
  }

  refreshText() {
    const color = this.status.open ? GREEN : RED;
    this.text.setText(getStatusLabel(this.status));
    this.text.setColor(`#${color.toString(16).padStart(6, '0')}`);
    // Punto + hueco + texto centrados como un bloque dentro de la placa
    const blockW = LED_SIZE + LED_GAP + this.text.width;
    const startX = Math.round(this.width / 2 - blockW / 2);
    this.ledX = startX;
    this.text.setPosition(startX + LED_SIZE + LED_GAP, Math.round(this.plateH / 2));
  }

  drawLed() {
    this.led.clear();
    if (!this.ledVisible) return;
    const color = this.status.open ? GREEN : RED;
    const y = Math.round(this.plateH / 2) - 1;
    this.led.fillStyle(color, 1).fillRect(this.ledX, y, LED_SIZE, LED_SIZE);
    // Brillo de 1 px arriba-izquierda
    this.led.fillStyle(LIGHT, 1).fillRect(this.ledX, y, 1, 1);
  }

  resize(width) {
    const { barHeight, plateHeight, centerX, centerW } = layoutTopBar(width);
    this.width = width;
    this.barH = barHeight;
    this.plateH = plateHeight;
    const g = this.gfx;
    g.clear();
    // Barra: contorno oscuro, brillo arriba y sombra abajo
    g.fillStyle(BAR_COLOR, 1).fillRect(0, 0, width, barHeight);
    g.fillStyle(MID, 1).fillRect(0, 0, width, 1);
    g.fillStyle(LIGHT, 1).fillRect(0, 1, width, 1);
    g.fillStyle(DARK, 1).fillRect(0, barHeight - 2, width, 1);
    g.fillStyle(INK, 1).fillRect(0, barHeight - 1, width, 1);
    // Placa central en relieve: contorno, bisel claro arriba-izquierda y oscuro abajo-derecha
    const x = Math.round(centerX);
    g.fillStyle(INK, 1).fillRect(x, 0, centerW, plateHeight);
    g.fillStyle(DARK, 1).fillRect(x + 1, 0, centerW - 2, plateHeight - 1);
    g.fillStyle(MID, 1).fillRect(x + 1, 0, centerW - 2, 1);
    g.fillStyle(MID, 1).fillRect(x + 1, 0, 1, plateHeight - 2);
    g.fillStyle(INK, 1).fillRect(x + centerW - 2, 1, 1, plateHeight - 2);
    g.fillStyle(INK, 1).fillRect(x + 1, plateHeight - 2, centerW - 2, 1);
    this.refreshText();
    this.drawLed();
    this.timeText.setPosition(Math.round(centerX + centerW + 8), Math.round(barHeight / 2));
    if (this.menuOpen) this.drawMenu();
  }
}
