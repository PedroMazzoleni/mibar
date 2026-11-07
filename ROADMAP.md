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
- [ ] 1.3 Rejilla 16×16 y resaltado de la casilla bajo el ratón
- [ ] 1.4 Conversión clic → mundo → casilla
- [ ] 1.5 Cámara con arrastre y límites
- [ ] 1.6 Panel de depuración (FPS y casilla) que se oculta con una tecla
**Hecho cuando:** la rejilla se ve nítida y al hacer clic se muestra la casilla.

## Fase 2 — El local
- [ ] 2.1 Primer plano del bar en Tiled (suelo, paredes, barra, mesas, cocina, puerta, baño)
- [ ] 2.2 Cargar el mapa con capas de casillas y de objetos
- [ ] 2.3 Casillas transitables / no transitables
- [ ] 2.4 FurnitureSprite interactivo (barra, mesa, silla, grifo, cafetera, plancha, caja)
- [ ] 2.5 Tooltip con el nombre del mueble y cursor de mano
- [ ] 2.6 Orden de dibujo por profundidad
**Hecho cuando:** el bar se carga desde Tiled y cada mueble muestra su nombre.

## Fase 3 — Clientes
- [ ] 3.1 Pathfinding con EasyStar sobre la rejilla
- [ ] 3.2 Máquina de estados del cliente (entra → sitio → pedir → esperar → consumir → pagar → salir)
- [ ] 3.3 Paciencia y bocadillo de estado
- [ ] 3.4 Spawner según hora y reputación
- [ ] 3.5 Tipos de cliente en customers.json
- [ ] 3.6 Tests de la máquina de estados
**Hecho cuando:** los clientes entran, se sientan, esperan y se van si nadie les atiende.

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
- [ ] 5.7 Reputación
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
