# Roadmap — Bar Cubista

Marca con [x] solo cuando la tarea pase tests, lint y build. Una tarea cada vez, en orden.

## Fase 0 — Preparación del proyecto

- [x] 0.1 Crear proyecto con Vite (plantilla vanilla)
- [x] 0.2 Instalar Phaser, Dexie, EasyStar, Vitest, ESLint y Prettier con su configuración y scripts
- [x] 0.3 Limpiar la plantilla y mostrar una escena de prueba de Phaser a 320×180 con pixelArt
- [x] 0.4 Crear la estructura de carpetas (scenes, objects, ui, logic, systems, save, tests, public/assets)
- [x] 0.5 Configurar `base` de Vite y GitHub Action para publicar en GitHub Pages
      **Hecho cuando:** `npm run dev` muestra el lienzo y está publicado en GitHub Pages.

## Fase 1 — Base del juego

- [x] 1.1 Configuración de Phaser: escalado FIT con zoom entero
- [x] 1.2 Escenas Boot y Preload con barra de carga
- [x] 1.3 Rejilla 16×16 y resaltado de la casilla bajo el ratón
- [x] 1.4 Conversión clic → mundo → casilla
- [x] 1.5 Cámara con arrastre y límites
- [x] 1.6 Panel de depuración (FPS y casilla) que se oculta con una tecla
      **Hecho cuando:** la rejilla se ve nítida y al hacer clic se muestra la casilla.

## Fase 2 — El local

- [x] 2.1 Primer plano del bar en Tiled (suelo, paredes, barra, mesas, cocina, puerta, baño)
- [x] 2.2 Cargar el mapa con capas de casillas y de objetos
- [x] 2.3 Casillas transitables / no transitables
- [x] 2.4 FurnitureSprite interactivo (barra, mesa, silla, grifo, cafetera, plancha, caja)
- [x] 2.iso Migración a isométrica
  - [x] a) Cambiar la resolución base a 480×270 en la configuración de Phaser
  - [x] b) src/logic/iso.js con gridToScreen y screenToGrid + tests
  - [x] c) Suelo en rombos y clic que resalte la casilla (hecho directamente en BarScene, sin escena de prueba aparte)
  - [x] d) Adaptar a isométrico lo hecho en 2.1–2.4:
        · logic: zoom.js (base 480×270), grid.js (proyección cuadrada → iso.js), tiledMap.js (coordenadas de objetos y zonas de un mapa iso de Tiled), navGrid.js (paredes en los bordes de las casillas y puertas en el borde norte/oeste)
        · escenas y objetos: BarScene (colocación, resaltado y F4 en rombos, casilla bajo el ratón), FurnitureSprite (anclaje con gridToScreen), PreloadScene (frames de 32×48)
        · mapa y arte: bar.tmj como mapa isométrico de Tiled (32×16), tileset entero redibujado en 32×48 a partir del 2D (suelo con luz, paredes del fondo, barra, mesas, sillas, taburetes, cocina, baño, máquinas), generador del mapa en tools/ y vista previa de mapas de sprites.html
  - [x] e) Orden de dibujo con setDepth por (columna + fila) y paredes solo del fondo (norte y oeste; delante, solo un zócalo bajo)
- [x] 2.5 Tooltip con el nombre del mueble y cursor de mano (sobre el mapa isométrico)
- [x] 2.6 Orden de dibujo por profundidad isométrica también para personajes y objetos que se mueven
      **Hecho cuando:** el bar se carga desde un mapa isométrico de Tiled y cada mueble muestra su nombre.

## Fase 3 — Clientes
- [x] 3.01 Una barra arriba que inidique cuando esta cerrado y abierto y que ocupe como todo el div de arriba como si fuera una cabezera pero con el centro mas desstracado
- [x] 3.1 Pathfinding con EasyStar sobre la rejilla
- [x] 3.2 Máquina de estados del cliente (entra → sitio → pedir → esperar → consumir → pagar → salir)
- [x] 3.4 Spawner según hora (sin reputación)
- [ ] 3.5 Tipos de cliente en customers.json
- [ ] 3.6 Tests de la máquina de estados
      **Hecho cuando:** los clientes entran solos según la hora, se sientan, piden, consumen, pagan y se van.

## Fase 4 — Interacción y servicio

- [ ] 4.1 Clic en cliente → panel con su pedido
- [ ] 4.2 Comandas y cola visible en HudScene
- [ ] 4.3 Preparar en la estación correcta con barra de progreso
- [ ] 4.4 Llevar el pedido con el avatar y entregar en la mesa
- [ ] 4.5 Cobrar en la caja o al cliente
- [ ] 4.6 Productos y recetas iniciales en JSON
      **Hecho cuando (prototipo jugable):** un servicio completo con figuras geométricas.

## Fase 5 — Tiempo y economía

- [ ] 5.1 gameClock con franjas horarias
- [ ] 5.2 Velocidad x1/x2/x4 y pausa
- [ ] 5.3 Inventario con stock y caducidad
- [ ] 5.4 MarketScene para comprar género
- [ ] 5.5 Precios editables y efecto en la demanda
- [ ] 5.6 Gastos fijos y DaySummaryScene
- [ ] 5.7 Reputación (y su efecto en el spawner de clientes)
- [ ] 5.7b Paciencia y bocadillo de estado (pospuesta desde 3.3)
- [ ] 5.8 Tests de la economía
      **Hecho cuando:** se juegan varios días y se puede ganar o perder dinero.

## Fase 6 — Guardado

- [ ] 6.1 db.js con Dexie
- [ ] 6.2 Serializar y restaurar gameState
- [ ] 6.3 Guardado automático y manual
- [ ] 6.4 Pantalla de cargar partida con ranuras
- [ ] 6.5 Exportar / importar partida en .json
      **Hecho cuando:** al reabrir el enlace la partida sigue igual.

## Fase 7 — Arte cubista y sonido

- [ ] 7.1 Paleta y guía de estilo en Aseprite
- [ ] 7.2 Sprites del local y animaciones de clientes
- [ ] 7.3 Fuente pixel y UI facetada
- [ ] 7.4 Efectos de sonido y ambiente (desbloqueo con el primer clic)
- [ ] 7.5 Partículas (vapor, espuma, monedas)
      **Hecho cuando (vertical slice):** un día completo se ve y se oye como el juego final.

## Fase 8 — Contenido y progresión

- [ ] 8.1 Mejoras del local
- [ ] 8.2 Camareros con IA propia
- [ ] 8.3 Parroquianos con memoria
- [ ] 8.4 Eventos (fútbol, fiestas, inspección, apagón)
- [ ] 8.5 Carta ampliada y menú del día
- [ ] 8.6 Objetivos semanales y logros
      **Hecho cuando:** hay motivos para jugar una semana entera.

## Fase 9 — Pulido y publicación

- [ ] 9.1 Menú principal, opciones y tutorial
- [ ] 9.2 Equilibrado
- [ ] 9.3 Pruebas en navegadores y 60 FPS estables
- [ ] 9.4 Página de presentación con capturas
- [ ] 9.5 Publicar en itch.io (opcional)
      **Hecho cuando (1.0):** se juega entero desde un enlace.

## Registro

<!-- Una línea por tarea terminada: fecha · ID · resumen -->

- 2026-11-07 · 0.4 · Carpetas src/{scenes,objects,ui,logic,systems,save} y public/assets con .gitkeep; borrados restos de la plantilla de Vite
- 2026-11-07 · 0.5 · vite.config.js con base /mibar/ y workflow .github/workflows/deploy.yml para GitHub Pages (pendiente de verificar en Pages)
- 2026-11-07 · 1.1 · src/logic/zoom.js (calcularZoomEntero) + main.js en Scale.NONE con zoom entero recalculado al redimensionar, roundPixels y CSS pixelated a pantalla completa
- 2026-11-07 · 1.2 · BootScene, PreloadScene (barra de carga con Graphics) y TestScene en src/scenes; main.js con las tres escenas; eslint con globals de Node para tools/**
- 2026-11-07 · 1.3+1.4 · src/logic/grid.js (worldToTile, tileToWorld, tileCenter, isInsideGrid) con tests; TestScene con rejilla 16×16 y resaltado de la casilla bajo el ratón vía pointer.worldX/worldY
- 2026-11-08 · 1.5 · src/logic/camera.js (clampScroll, dragScroll, screenToWorld) con tests; TestScene con mundo de prueba 40×24 arrastrable, umbral de 3 px y resaltado sin desfase
- 2026-11-08 · 1.6 · src/logic/debugInfo.js (formatDebugText) con tests y src/ui/DebugPanel.js: FPS, casilla bajo el ratón y último clic; F3 lo oculta (visible al arrancar solo en dev)
- 2026-11-08 · 2.1 · public/assets/maps/bar.tmj (30×18, capas suelo, paredes, muebles y zonas) y tileset borrador arte/sprites/bar-tiles.json → public/assets/sprites/bar-tiles.png
- 2026-11-08 · 2.2 · BarScene (sustituye a TestScene) carga bar.tmj: capas suelo, paredes y muros + muebles como sprites; src/logic/tiledMap.js (capas, muebles, zonas, puertas) con tests
- 2026-11-08 · 2.3 · src/logic/navGrid.js: casillas transitables (suelo, sin pared salvo puertas, sin mueble que ocupe) y canMove con puertas en vertical y tabiques entre salas; F4 muestra lo no transitable
- 2026-11-08 · 2.4 · src/objects/FurnitureSprite.js con detección al píxel para barra, mesa, silla, taburete, grifo, cafetera, plancha y caja (src/logic/furniture.js); brillo al pasar el ratón y el clic llega a la escena y al panel F3
- 2026-11-08 · 2.5 · Tooltip (src/ui/Tooltip.js) con nombres de public/assets/data/furniture-names.json y posición limitada a la pantalla (src/logic/furnitureNames.js); cursor de mano solo sobre muebles interactivos; se oculta al arrastrar
- 2026-11-08 · 2.iso · Migración a isométrica: base 480×270; src/logic/iso.js (gridToScreen, screenToGrid, mapOrigin, depthOf) con tests; tiledMap y navGrid para mapa iso de Tiled (paredes en los bordes, puertas norte/oeste); tools/generar-bar-iso.js crea bar.tmj (16×10, 32×16) y el tileset de 32×48 desde arte/referencia/bar-tiles-2d.json; BarScene dibuja por columna + fila con rombo bajo el ratón y F4 en rombos; vista previa de mapas en iso
- 2026-11-09 · 2.6 · Profundidad de lo que se mueve: src/logic/iso.js (screenToGridF, depthOfPoint, moverDepthSub: casilla entera con subnivel 3–3.9, entre mueble y zócalo); src/objects/Mover.js; BarScene recalcula la profundidad cada frame; marcador de prueba con F5 en dev
- 2026-11-09 · 2.7 · Barra superior gris a todo el ancho con centro destacado y estado ABIERTO/CERRADO: src/logic/barStatus.js (createBarStatus, toggleOpen, getStatusLabel, layoutTopBar), src/ui/TopBar.js, src/scenes/HudScene.js; tecla 1 alterna el estado; ratón sobre la barra no llega al bar; DebugPanel bajo la barra
- 2026-11-09 · 2.7b · Barra superior en estilo pixel art (contorno, brillo, sombra y placa central en relieve), estado en rojo/verde con LED parpadeante y más margen; DebugPanel bajo la altura total de la barra
- 2026-11-09 · 3.1 · src/logic/pathfinding.js: findPath con EasyStar síncrono sobre navGrid (respeta tabiques y puertas, solo ortogonal) con tests
- 2026-11-09 · 3.2 · Máquina de estados del cliente: src/logic/customerFsm.js (estados, pickSeat con casilla de acceso, advance, tick, canEnter), src/systems/customerSystem.js, src/objects/CustomerSprite.js; F6 crea un cliente solo con el bar abierto; clic = pedido tomado / servido; DebugPanel muestra el estado
- 2026-11-09 · 3.4 · Spawner por franjas horarias provisionales (src/logic/spawner.js: hourSlot, spawnIntervalMs, advanceSpawner; solo con bar abierto y sitio libre, máx. 12 clientes); hora ficticia en la barra superior (src/logic/gameTime.js, 1 min de juego cada 15 s) con menú de velocidad x5/x10/x50/x100 al pulsar la hora; F7 adelanta 1 hora en dev; paciencia pospuesta a 5.7b y reputación a 5.7
