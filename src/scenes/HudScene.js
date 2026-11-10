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
import { layoutTopBar } from '../logic/barStatus.js';
import TopBar from '../ui/TopBar.js';
import CustomerPanel from '../ui/CustomerPanel.js';
import OrderQueuePanel from '../ui/OrderQueuePanel.js';

// Tecla de prueba que alterna ABIERTO/CERRADO (la apertura automática por horario llegará con el reloj de 5.1)
const TOGGLE_KEY = 'ONE';
// Tecla solo en dev que adelanta la hora 1 hora
const TIME_KEY = 'F7';
// Tecla que cierra el panel del cliente
const CLOSE_KEY = 'ESC';

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

    // Panel del cliente y cola de comandas
    const { width, height } = this.scale;
    this.customerPanel = new CustomerPanel(this, width, height);
    this.queuePanel = new OrderQueuePanel(this, width, layoutTopBar(width).totalHeight);
    this.input.keyboard.addKey(CLOSE_KEY).on('down', () => this.customerPanel.close());
    // Eventos de BarScene: clic en cliente y cambios en la cola
    const bar = this.scene.get('Bar');
    const onClick = ({ id }) => this.openCustomer(id);
    const onTicket = ({ ticket, queue, from }) =>
      this.queuePanel.addArrival(ticket, queue, from.x, from.y);
    const onQueue = ({ queue }) => this.queuePanel.setQueue(queue);
    bar.events.on('customer-click', onClick);
    bar.events.on('ticket-added', onTicket);
    bar.events.on('queue-changed', onQueue);

    const onResize = (size) => {
      this.topBar.resize(size.width);
      this.customerPanel.resize(size.width, size.height);
      this.queuePanel.top = layoutTopBar(size.width).totalHeight;
      this.queuePanel.resize(size.width);
    };
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => {
      this.scale.off('resize', onResize);
      bar.events.off('customer-click', onClick);
      bar.events.off('ticket-added', onTicket);
      bar.events.off('queue-changed', onQueue);
    });
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
    this.refreshCustomerPanel();
  }

  openCustomer(id) {
    this.customerPanel.open(id);
    this.refreshCustomerPanel();
  }

  // Mantiene el panel al día; se cierra si el cliente ya no está
  refreshCustomerPanel() {
    const panel = this.customerPanel;
    if (!panel.visible) return;
    const info = this.scene.get('Bar').customerSystem.describe(panel.customerId);
    if (info) panel.setInfo(info);
    else panel.close();
  }

  // Clic en la hora abre/cierra el menú; en una opción cambia la velocidad; fuera, lo cierra
  onPointerDown(pointer) {
    const bar = this.topBar;
    const action = this.customerPanel.click(pointer.x, pointer.y);
    if (action === 'close') this.customerPanel.close();
    else if (action === 'advance') {
      this.scene.get('Bar').customerSystem.advanceCustomer(this.customerPanel.customerId);
      this.refreshCustomerPanel();
    }
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
      this.customerPanel.hit(pointer.x, pointer.y) ||
      this.queuePanel.hit(pointer.x, pointer.y) ||
      this.topBar.hitClock(pointer.x, pointer.y) ||
      this.topBar.hitMenu(pointer.x, pointer.y) !== null
    );
  }

  refreshTime() {
    this.hour = getHour(this.time);
    this.topBar.setTime(formatTime(this.time), this.time.speed);
  }
}
