import Phaser from 'phaser';
import { createBarStatus, toggleOpen } from '../logic/barStatus.js';
import {
  createGameTime,
  advanceGameTime,
  addHours,
  setSpeed,
  simDelta,
  getHour,
  formatTime,
} from '../logic/gameTime.js';
import TopBar from '../ui/TopBar.js';

// Tecla de prueba que alterna ABIERTO/CERRADO (la apertura automática por horario llegará con el reloj de 5.1)
const TOGGLE_KEY = 'ONE';
// Tecla solo en dev que adelanta la hora 1 hora
const TIME_KEY = 'F7';

// Interfaz fija sobre el bar. Sin objetos interactivos de Phaser: los clics se comprueban a mano
// y BarScene ignora el puntero sobre la hora y el menú (blocksPointer)
export default class HudScene extends Phaser.Scene {
  constructor() {
    super('Hud');
  }

  create() {
    this.status = createBarStatus(false);
    this.topBar = new TopBar(this, this.scale.width, this.status);
    // Hora ficticia PROVISIONAL (hasta 5.1): avanza siempre, abierto o cerrado
    this.time = createGameTime();
    this.refreshTime();
    if (import.meta.env.DEV) {
      this.input.keyboard.addKey(TIME_KEY).on('down', () => {
        this.time = addHours(this.time, 1);
        this.refreshTime();
      });
    }

    // dt de simulación del frame (real × velocidad); lo lee BarScene
    this.simDt = 0;
    this.cursorOverClock = false;
    this.input.on('pointerdown', (pointer) => this.onPointerDown(pointer));

    this.input.keyboard.addKey(TOGGLE_KEY).on('down', () => {
      this.status = toggleOpen(this.status);
      this.topBar.setOpen(this.status.open);
    });

    const onResize = (size) => this.topBar.resize(size.width);
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => this.scale.off('resize', onResize));
  }

  update(_time, delta) {
    this.simDt = simDelta(this.time, delta);
    this.time = advanceGameTime(this.time, this.simDt);
    this.refreshTime();
    // Cursor de mano sobre la hora y las opciones (tras el update de BarScene, así prevalece)
    const p = this.input.activePointer;
    const over = this.topBar.hitClock(p.x, p.y) || this.topBar.hitMenu(p.x, p.y) !== null;
    if (over) this.input.setDefaultCursor('pointer');
    else if (this.cursorOverClock) this.input.setDefaultCursor('');
    this.cursorOverClock = over;
  }

  // Clic en la hora abre/cierra el menú; en una opción cambia la velocidad; fuera, lo cierra
  onPointerDown(pointer) {
    const bar = this.topBar;
    if (bar.menuOpen) {
      const speed = bar.hitMenu(pointer.x, pointer.y);
      if (speed !== null) this.time = setSpeed(this.time, speed);
      bar.closeMenu();
      this.refreshTime();
    } else if (bar.hitClock(pointer.x, pointer.y)) {
      bar.openMenu();
    }
  }

  // El puntero está sobre la hora o el menú: el bar no debe reaccionar
  blocksPointer(pointer) {
    return (
      this.topBar.hitClock(pointer.x, pointer.y) ||
      this.topBar.hitMenu(pointer.x, pointer.y) !== null
    );
  }

  refreshTime() {
    this.hour = getHour(this.time);
    this.topBar.setTime(formatTime(this.time), this.time.speed);
  }
}
