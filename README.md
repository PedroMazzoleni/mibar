# mibar

> Nombre provisional.

Simulador 2D en vista isometrica en el que acabas de abrir un **bar clásico español** y tienes que sacarlo adelante día a día. Todo se juega con el ratón: tomas nota, preparas cañas y cafés, sirves tapas, cobras y vas mejorando el local.

La estética mezcla **cubismo y pixel art**, inspirada en los bodegones de Picasso y Juan Gris: el local se ve en vista isometrica, como en los RPG clásicos (suelo desde arriba, paredes y muebles de frente), y botellas, vasos y personas aparecen fragmentados y desde varios puntos de vista a la vez.

**Estado:** en desarrollo, Fase 0 (preparación del proyecto).

---

## Cómo se juega

Cada día de juego sigue el mismo ciclo:

1. **Mañana:** compras género a los proveedores (cerveza, café, huevos, patatas, aceitunas...).
2. **Servicio:** abres el bar y atiendes a los clientes por franjas horarias: desayunos, almuerzo, vermut, menú del día y cañas de la tarde. Si tardas, se impacientan y se van.
3. **Cierre:** haces caja, pagas los gastos y mejoras el local con lo que hayas ganado.

## Tecnologías

| Pieza                | Tecnología                                                   |
| -------------------- | ------------------------------------------------------------ |
| Lenguaje             | JavaScript (módulos ES)                                      |
| Motor 2D             | [Phaser](https://phaser.io/)                                 |
| Entorno y build      | [Vite](https://vitejs.dev/)                                  |
| Guardado de partidas | IndexedDB con [Dexie.js](https://dexie.org/)                 |
| Pathfinding          | [EasyStar.js](https://github.com/prettymuchbryce/easystarjs) |
| Mapas                | [Tiled](https://www.mapeditor.org/)                          |
| Pixel art            | [Aseprite](https://www.aseprite.org/)                        |
| Tests                | [Vitest](https://vitest.dev/)                                |
| Calidad de código    | ESLint + Prettier                                            |

## Requisitos

- [Node.js](https://nodejs.org/) LTS (incluye npm)
- Un navegador moderno (Chrome, Firefox, Edge o Safari)

## Instalación

```bash
git clone https://github.com/<tu-usuario>/bar-cubista.git
cd bar-cubista
npm install
npm run dev
```

El juego se abre en `http://localhost:5173`.

## Scripts

| Comando           | Qué hace                                      |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo con recarga automática |
| `npm run build`   | Genera la versión para publicar en `dist/`    |
| `npm run preview` | Sirve localmente la versión de `dist/`        |
| `npm test`        | Ejecuta los tests con Vitest                  |
| `npm run lint`    | Revisa el código con ESLint                   |
| `npm run format`  | Formatea el código con Prettier               |

## Estructura del proyecto

```
bar-cubista/
├── index.html
├── public/assets/
│   ├── sprites/  maps/  sounds/  fonts/
│   └── data/            → productos, recetas y tipos de cliente (JSON)
├── src/
│   ├── main.js          → configuración de Phaser
│   ├── scenes/          → escenas: menú, bar, mercado, resumen del día, HUD
│   ├── objects/         → sprites del juego (clientes, muebles, jugador)
│   ├── ui/              → botones, paneles, tooltips
│   ├── logic/           → lógica pura del juego (sin Phaser)
│   ├── systems/         → pathfinding y acciones del jugador
│   └── save/            → guardado de partidas
└── tests/               → tests de la lógica
```

La carpeta `src/logic` nunca importa Phaser. Así la economía, los clientes y el tiempo se pueden probar con Vitest sin abrir el navegador.

## Roadmap

- [ ] **Fase 0:** preparación del proyecto y publicación en GitHub Pages
- [ ] **Fase 1:** base del juego (escenas, render en pixel art, clic sobre casillas)
- [ ] **Fase 2:** el local (mapa de Tiled y muebles interactivos)
- [ ] **Fase 3:** clientes (movimiento y comportamiento)
- [ ] **Fase 4:** interacción y servicio → 🎯 **prototipo jugable**
- [ ] **Fase 5:** tiempo y economía
- [ ] **Fase 6:** guardado de partidas
- [ ] **Fase 7:** arte cubista y sonido → 🎯 **vertical slice**
- [ ] **Fase 8:** contenido y progresión
- [ ] **Fase 9:** pulido y publicación → 🎯 **versión 1.0**

## Arte

Los sprites se dibujan en Aseprite: casillas de 16×16 píxeles, personajes de 16×24 y una paleta reducida de tonos ocres, marrones, verdes oliva y grises. Cada sprite se exporta como PNG con su JSON de animaciones, y el archivo `.aseprite` original se guarda junto a él.

Si se usa algún recurso de terceros, su origen y licencia se indican en `public/assets/CREDITS.md`.

## Licencia

_Por definir._
