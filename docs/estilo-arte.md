# Estilo de arte

- Vista 3/4 sobre rejilla cuadrada (como los RPG clásicos): el suelo se ve desde arriba y las paredes y objetos enseñan su cara frontal y su parte superior. Encima, el cubismo puede fragmentar objetos y personas.
- Paredes: la del fondo de cada sala y las horizontales interiores se ven de frente (tablones, rodapié, estanterías y cuadros colgados); las laterales y la inferior, solo como canto superior.
- Muebles: tablero visto desde arriba más su frente con patas o puertas; personajes de frente, de espaldas y de perfil.
- Paleta cerrada en `arte/paleta.json`: ocres, maderas, sienas, oliva, grises azulados, colores de bebidas, comida y ropa, y un acento rojo.
- Facetado con 2–3 tonos por color, sin degradados. Contorno oscuro de 1 px.
- Tamaños: casillas 32×32, personajes 32×48, muebles en múltiplos de 32; objetos pequeños (vasos, tapas) 16×16.
- Aseprite: etiquetas por animación (`andar`, `sentarse`, `beber`), exportar sprite sheet PNG + JSON (Array, con Tags).
- Carga en Phaser con `this.load.aseprite()` y `this.anims.createFromAseprite()`.
- Recursos de terceros: anotar origen y licencia en `public/assets/CREDITS.md`.

## Referencias

- `Imagen Referencia/6657181722a0f4d8b6c011b61ce70534.gif` — perspectiva y composición: vista 3/4, paredes de tablones con estanterías, local por salas.
- `Imagen Referencia/perspectiva.gif` — ambiente y suelo de piedra (su vista isométrica no se usa).
