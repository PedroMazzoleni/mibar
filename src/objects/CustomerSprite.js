import Phaser from 'phaser';
import Mover from './Mover.js';

// Color del marcador según el estado del cliente (provisional, sin arte)
const STATE_COLORS = {
  entering: 0xf4ead2,
  walkingToSeat: 0xe0b84c,
  ordering: 0x4ca3e0,
  waiting: 0x8a5cd6,
  consuming: 0x5cb85c,
  paying: 0xe08a3c,
  leaving: 0x888888,
  gone: 0x000000,
};

// Cliente: marcador provisional que se mueve y se puede pulsar
export default class CustomerSprite extends Mover {
  constructor(scene, x, y, customerId) {
    super(scene, x, y);
    this.customerId = customerId;
    this.marker = scene.add.graphics();
    this.add(this.marker);
    // Zona de clic sobre el círculo (el origen de visualización del contenedor es 6,6)
    this.setSize(12, 12);
    this.setInteractive(new Phaser.Geom.Rectangle(0, -6, 12, 12), Phaser.Geom.Rectangle.Contains);
    this.showState('entering');
  }

  // Repinta el marcador con el color del estado
  showState(state) {
    if (state === this.shownState) return;
    this.shownState = state;
    this.marker.clear();
    this.marker.fillStyle(STATE_COLORS[state] ?? 0xffffff, 1).fillCircle(0, -4, 4);
    this.marker.lineStyle(1, 0x1e1a1d, 1).strokeCircle(0, -4, 4);
  }
}
