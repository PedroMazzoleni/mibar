# Estilo de arte

- Vista cenital para el espacio; objetos y personas con perspectivas mezcladas (cubismo).
- Paleta de 16–24 colores: ocres, marrones, sienas, verde oliva, grises azulados y un acento.
- Facetado con 2–3 tonos por color, sin degradados. Contorno oscuro de 1 px.
- Tamaños: casillas 32×32, personajes 32×48, muebles en múltiplos de 32; objetos pequeños (vasos, tapas) 16×16.
- Aseprite: etiquetas por animación (`andar`, `sentarse`, `beber`), exportar sprite sheet PNG + JSON (Array, con Tags).
- Carga en Phaser con `this.load.aseprite()` y `this.anims.createFromAseprite()`.
- Recursos de terceros: anotar origen y licencia en `public/assets/CREDITS.md`.
