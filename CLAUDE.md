# Bar Cubista — instrucciones del proyecto

Simulador 2D cenital de un bar español. Estética cubista + pixel art. Se juega con el ratón en el navegador.

## Stack
JavaScript (módulos ES) · Phaser · Vite · Dexie (IndexedDB) · EasyStar.js · Tiled · Vitest · ESLint + Prettier.
Resolución interna 320×180, `pixelArt: true`, casillas de 16×16.

## Reglas de arquitectura
- `src/logic/` es lógica pura: NUNCA importa Phaser. Se prueba con Vitest.
- `src/scenes/`, `src/objects/`, `src/ui/` dibujan el estado y convierten clics en acciones.
- Contenido (productos, recetas, clientes) en JSON dentro de `public/assets/data/`.
- Dinero siempre en céntimos (enteros).
- La interfaz se dibuja en Phaser (`HudScene`), no con HTML.

## Forma de trabajar
- `ROADMAP.md` es la única fuente de verdad del progreso.
- Se trabaja UNA tarea cada vez. No adelantar tareas de otras fases ni añadir funciones no pedidas.
- Cambios pequeños: tocar solo los archivos necesarios para la tarea.
- Antes de dar una tarea por hecha: `npm test`, `npm run lint` y `npm run build` deben pasar.
- Código y comentarios en español sencillo; nombres de variables y funciones en inglés.