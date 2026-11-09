import { formatDebugText } from '../logic/debugInfo.js';

// Tecla que muestra/oculta el panel
const TOGGLE_KEY = 'F3';
const PADDING = 6;

// Panel de depuración fijo en pantalla: FPS, casilla bajo el ratón y último clic
export default class DebugPanel {
  constructor(scene, { visible = true } = {}) {
    this.scene = scene;
    this.hover = null;
    this.click = null;
    this.furniture = null;

    this.bg = scene.add.rectangle(0, 0, 1, 1, 0x1e1a1d, 0.7).setOrigin(0, 0);
    this.text = scene.add.text(PADDING, PADDING, '', {
      fontSize: '16px',
      color: '#f4ead2',
      lineSpacing: 2,
    });
    this.container = scene.add
      .container(4, 20, [this.bg, this.text])
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(visible);

    // addKey captura la tecla: F3 no abre la búsqueda del navegador
    scene.input.keyboard.addKey(TOGGLE_KEY).on('down', () => this.toggle());
  }

  toggle() {
    this.container.setVisible(!this.container.visible);
  }

  setHover(tile) {
    this.hover = tile;
  }

  setClick(tile) {
    this.click = tile;
  }

  setFurniture(type) {
    this.furniture = type;
  }

  // Llamar en update() de la escena
  update() {
    if (!this.container.visible) return;
    const content = formatDebugText({
      fps: this.scene.game.loop.actualFps,
      hover: this.hover,
      click: this.click,
      furniture: this.furniture,
    });
    // Redibujar el texto solo si cambia
    if (content === this.text.text) return;
    this.text.setText(content);
    this.bg.setSize(
      Math.ceil(this.text.width) + PADDING * 2,
      Math.ceil(this.text.height) + PADDING * 2,
    );
  }
}
