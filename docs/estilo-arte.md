# Estilo de arte — mibar

Fuente única de reglas de arte del proyecto. CLAUDE.md, la skill `/sprite` y el agente `tilero` remiten aquí: si una regla cambia, se cambia solo en este archivo.

## 1. Principios

- **Pixel art isométrico 2:1** en un bar de tapas español: terrazo, zinc, azulejo, madera, bombillas cálidas.
- **Toque cubista:** la perspectiva isométrica es una perspectiva "falsa" y se puede romper a propósito en detalles concretos (un cuadro, un cartel, un cliente especial). La base siempre es isométrica limpia; la ruptura es la excepción y se decide a mano, nunca por accidente.
- **Paleta corta y coherente:** pocos tonos bien elegidos antes que degradados.
- **Legibilidad a escala x1:** si un objeto no se reconoce a su tamaño real, se simplifica.

## 2. Proyección y medidas

| Elemento | Medida |
|---|---|
| Resolución interna | 480×270, escalado entero (x4 en 1080p), sin suavizado |
| Casilla de suelo | rombo de 32×16 px |
| Líneas | escalones de 2 px horizontales por 1 vertical; nada de líneas 1:1 en diagonales del suelo |
| Personajes | 16×24 px |
| Anclaje | centro inferior del rombo de la casilla que ocupa el objeto |

- **Muebles:** dos caras visibles (izquierda y derecha) más la tapa. Deben quedar dentro de la huella de sus casillas; un mueble de 2×1 ocupa exactamente dos rombos.
- **Altura:** se mide en múltiplos de 8 px para que los objetos apilados encajen.
- **Paredes:** solo se dibujan las dos del fondo. Las delanteras no existen, para no tapar el bar.
- **Profundidad:** lo que está más abajo en pantalla se dibuja encima (`setDepth` según la y de pantalla). El arte no debe depender de un orden de dibujo distinto.
- **Coordenadas:** la lógica trabaja en casillas (x, y). La conversión a pantalla vive en `src/logic/iso.js` (`gridToScreen` / `screenToGrid`), y el arte se coloca siempre a través de ella.

## 3. Luz y sombreado

- **Luz desde arriba-izquierda**, siempre.
- **Tapa:** el tono más claro. **Cara izquierda:** tono medio. **Cara derecha:** el más oscuro.
- **Sombra proyectada:** hacia abajo-derecha, con el color de humo/sombra `h`, sin degradado.
- **Contorno:** oscuro y del color de la propia pieza (no negro puro), salvo en el hierro forjado `k`.
- **Brillos:** 1–2 píxeles como máximo en metal y cristal (`i` en el inox, `m` en las bombillas).

## 4. Paleta

- **Fuente de verdad:** `arte/paleta.json`. Ningún script ni sprite define colores fuera de ella.
- **Máximo 64 colores.** Cada color tiene un único carácter, porque los sprites de texto usan un carácter por píxel.
- **No se modifica ni se reordena ningún carácter existente.** Los colores nuevos se añaden al final con un carácter libre.
- Antes de añadir un color, comprueba que no sea casi idéntico a uno existente.
- **Roles acordados:**
  - `r` para interfaz y acentos, `x` para comida (son rojos parecidos y se mantienen separados por uso).
  - Motas del terrazo: cremas `8`/`9` y marrones o sienas `2`–`4` sobre `t`/`u`, sin colores propios.
  - `h` para humo y sombras; `m` para la luz de las bombillas.
- La descripción de cada carácter vive en el propio `paleta.json`. Este documento no la duplica.

## 5. Fuentes de arte

| Fuente | Para qué | Quién |
|---|---|---|
| Sprites de texto | objetos pequeños, iconos, UI, comida | skill `/sprite` |
| PixelLab | suelos, paredes, muebles y piezas grandes | agente `tilero` |
| Aseprite | pulido final de cualquiera de los dos | Pedro |

Todo lo que entra en el juego, venga de donde venga, cumple las secciones 2 a 4.

## 6. Sprites de texto

- Cada sprite es una cuadrícula de caracteres de `paleta.json`, con un carácter por píxel y `.` para transparente.
- Se crean y retocan con `/sprite`.
- `npm run sprites` los exporta a PNG con `tools/exportar-sprites.js`.
- `arte/vista-previa.js` genera `sprites.html` para revisarlos.
- Los objetos pequeños (vasos, platos, botellas) apenas notan la perspectiva: basta con un ligero escalonado 2:1 en la base.

## 7. Assets de PixelLab

**Flujo:**

```
arte/pixellab/pendientes/<asset>/   →  revisión en sprites.html
arte/pixellab/aprobados/<asset>.png →  ajuste a paleta  →  juego
```

**Prompt base.** Todo prompt empieza por esta frase y después describe el objeto:

> isometric 2:1 pixel art, 32px tile grid, light from top-left, cozy Spanish tapas bar, subtle cubist touch, limited palette, clean dark outlines, transparent background

**Reglas:**

- Máximo 4 variantes por asset y petición.
- Cada carpeta de pendientes lleva un `meta.json` con el prompt, la herramienta, el tamaño y la fecha.
- `tilero` comprueba las dimensiones, el encaje con el rombo de 32×16 y el anclaje, y lo anota. No recorta a ciegas.
- **Ajuste a paleta obligatorio:** todo asset aprobado se cuantiza a `paleta.json` antes de entrar al juego, sin excepciones. Si el ajuste estropea el sombreado, se corrige en Aseprite o se regenera; no se añaden colores para salvar un asset.
- Nada que siga en `pendientes/` se implementa.

## 8. Revisión en sprites.html

- La sección **Pendientes de revisión** muestra cada variante a x1 y x4 sobre un suelo isométrico de prueba, con su nombre y un aviso si se sale de la paleta.
- Al ajustar a paleta, se muestran el antes y el después lado a lado.
- Órdenes de revisión: "aprueba `<asset>` vN", "repite `<asset>` + cambio", "descarta `<asset>`".

## 9. Pulido en Aseprite

- Trabaja siempre en **modo indexado** con la paleta del proyecto, exportada a `.gpl` desde `paleta.json`.
- No se introducen colores fuera de la paleta. Si hace falta uno nuevo, primero se añade a `paleta.json` siguiendo la sección 4.

## 10. Nombres y carpetas

- **kebab-case** en inglés o español, pero el mismo nombre en la carpeta, el PNG y la clave de Phaser (por ejemplo, `barra-zinc`).
- Las variantes llevan sufijo solo mientras están pendientes (`v1`, `v2`); el aprobado no lo lleva.
- Los assets finales van a la carpeta de assets que define `docs/arquitectura.md`. No se crean estructuras paralelas.

## 11. Lista de comprobación antes de aprobar

- [ ] Se reconoce a x1.
- [ ] El rombo de suelo cuadra con 32×16 y las diagonales son 2:1.
- [ ] La luz viene de arriba-izquierda (tapa > izquierda > derecha).
- [ ] Todos los colores están en `paleta.json` (o el ajuste no estropea el sombreado).
- [ ] El anclaje está en el centro inferior del rombo y cabe en su huella.
- [ ] El nombre está en kebab-case y es coherente en todas partes.