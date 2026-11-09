import Phaser from 'phaser';
import { createBarStatus, toggleOpen } from '../logic/barStatus.js';
import TopBar from '../ui/TopBar.js';

// Tecla de prueba que alterna ABIERTO/CERRADO (aún no hay reloj)
const TOGGLE_KEY = 'ONE';

// Interfaz fija sobre el bar. No crea objetos interactivos: no captura el ratón
export default class HudScene extends Phaser.Scene {
  constructor() {
    super('Hud');
  }

  create() {
    this.status = createBarStatus(false);
    this.topBar = new TopBar(this, this.scale.width, this.status);

    this.input.keyboard.addKey(TOGGLE_KEY).on('down', () => {
      this.status = toggleOpen(this.status);
      this.topBar.setOpen(this.status.open);
    });

    const onResize = (size) => this.topBar.resize(size.width);
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => this.scale.off('resize', onResize));
  }
}
