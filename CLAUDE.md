# Bar Cubista

Simulador 2D en vista 3/4 (rejilla cuadrada, paredes y muebles de frente) de un bar español, estética cubista + pixel art, jugable con el ratón en el navegador.
Este archivo es un **mapa**, no una enciclopedia: el detalle está en `docs/` y se lee solo cuando hace falta.

## Mapa

- `ROADMAP.md` — tareas por fase; única fuente de verdad del progreso.
- `docs/arquitectura.md` — carpetas, capas y reglas de código. Leer antes de crear archivos nuevos.
- `docs/estilo-arte.md` — paleta, tamaños de sprites y exportación desde Aseprite. Leer solo en tareas de arte.
- `.claude/agents/` — equipo de agentes. `.claude/skills/siguiente/` — flujo de una tarea.

## Stack

JavaScript (módulos ES) · Phaser · Vite · Dexie · EasyStar.js · Tiled · Vitest · ESLint + Prettier.

## Reglas que nunca se rompen

- `src/logic/` nunca importa Phaser.
- Dinero en céntimos (enteros).
- Una tarea cada vez; no adelantar trabajo de otras fases.
- Antes de cerrar una tarea: `npx vitest run`, `npm run lint` y `npm run build` en verde.
- No ejecutar git destructivo (`push --force`, `reset --hard`, borrar ramas) sin que el usuario lo pida.

## Comandos

`npm run dev` · `npx vitest run` · `npm run lint` · `npm run build` · `npm run format`

## Comunicación entre agentes

`.claude/tarea-actual.md` es la pizarra de la tarea en curso: especificación aprobada + bitácora donde cada agente anota su resultado o una `DUDA:`. Se sobrescribe en cada tarea y no se sube a git.
