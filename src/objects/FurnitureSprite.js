import Phaser from 'phaser';
import { isInteractive } from '../logic/furniture.js';

const HOVER_GLOW = 0x3c2c14;

// Mueble del mapa: imagen del tileset anclada abajo a la izquierda, como en Tiled.
// Los interactivos responden al ratón solo en sus píxeles visibles.
export default class FurnitureSprite extends Phaser.GameObjects.Image {
  constructor(scene, furniture, texture) {
    super(scene, furniture.x, furniture.y, texture, furniture.frame);
    this.furniture = furniture;
    this.setOrigin(0, 1);
    scene.add.existing(this);
    if (isInteractive(furniture.type)) this.setInteractive({ pixelPerfect: true });
  }

  // Brillo cálido sumado al mueble mientras el ratón está encima
  setHovered(hovered) {
    if (hovered) this.setTintMode(Phaser.TintModes.ADD).setTint(HOVER_GLOW);
    else this.clearTint();
    return this;
  }

  // `type` ya lo usa Phaser ('Image')
  get furnitureType() {
    return this.furniture.type;
  }
}
