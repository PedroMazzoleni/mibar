# Arquitectura

```
public/assets/
├── sprites/ maps/ sounds/ fonts/
└── data/            → products.json, recipes.json, customers.json
src/
├── main.js          → configuración de Phaser (480×270, pixelArt, zoom entero a pantalla completa)
├── scenes/          → Boot, Preload, MainMenu, Bar, Market, DaySummary, Hud
├── objects/         → CustomerSprite, FurnitureSprite, PlayerSprite
├── ui/              → Button, Panel, Tooltip, OrderTicket
├── logic/           → lógica pura (economy, customers, orders, time, events, gameState.js)
├── systems/         → pathfinding (EasyStar), actions (clic → acción)
└── save/            → db.js (Dexie), saveGame.js
tests/               → Vitest sobre src/logic
```

## Capas

- **logic**: recibe datos y devuelve datos. Sin Phaser, sin DOM. Todo se prueba con Vitest.
- **scenes / objects / ui**: leen `gameState` y lo dibujan. Los clics generan acciones (`takeOrder`, `serveOrder`), no modifican el estado directamente.
- **save**: único sitio que toca IndexedDB.

## Convenciones

- Nombres de archivos, funciones y variables en inglés; comentarios en español.
- Clases de escena en PascalCase (`BarScene.js`); módulos de lógica en camelCase (`cashRegister.js`).
- Contenido del juego (precios, recetas, tipos de cliente) en JSON, nunca escrito en el código.
- Interfaz dibujada en Phaser (`HudScene`), no con HTML.
- Mapa isométrico de Tiled: rombos de 32×16 y frames de tileset de 32×48. La proyección casilla ↔ pantalla está en `src/logic/iso.js` (`gridToScreen`, `screenToGrid`); coordenadas de dibujo redondeadas a enteros.
- El mapa del bar se genera con `tools/generar-bar-iso.js` (a partir de `arte/referencia/bar-tiles-2d.json`).
