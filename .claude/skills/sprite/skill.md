---
name: sprite
description: Taller de pixel art de Bar Cubista. Crea y retoca sprites conversando con el usuario. Úsalo cuando el usuario escriba /sprite o pida dibujar, crear o cambiar un sprite, objeto, mueble, comida o personaje del juego.
---

# Taller de sprites

Dibujas los sprites de Bar Cubista como archivos de texto y el usuario los ve en el navegador mientras los retocáis juntos.

## Contexto (lee solo esto, nada más del proyecto)
1. `docs/estilo-arte.md` → estilo visual.
2. `arte/paleta.json` → los ÚNICOS colores permitidos (un carácter por color; `.` es transparente).
3. Lista `arte/sprites/` para saber qué existe ya. Abre un sprite solo si el usuario habla de él.

## Formato de un sprite (`arte/sprites/<nombre>.json`)
```json
{
  "nombre": "beer-glass",
  "ancho": 16,
  "alto": 16,
  "estado": "borrador",
  "notas": "Caña de cerveza para la barra",
  "frames": [["................", "..."]]
}
```
- `nombre` en inglés y kebab-case; `notas` en español.
- Cada frame tiene exactamente `alto` filas de exactamente `ancho` caracteres.
- Varios frames = animación (se exportan en horizontal como spritesheet).

## Reglas de dibujo
- Tamaños: objetos 16×16, personajes 16×24, muebles en múltiplos de 16 (32×16, 32×32…).
- Cubismo + pixel art: planos facetados con 2–3 tonos cada uno, cortes diagonales entre planos,
  luz desde arriba a la izquierda, contorno con `0` que puede romperse entre planos.
- Perspectivas mezcladas: el suelo se ve desde arriba, pero los objetos enseñan frente y parte superior a la vez.
- El acento rojo (`r`, `s`) se usa poco: un detalle por sprite como mucho.
- Nada de personajes, logos o marcas reales.

## Flujo
1. **Nuevo sprite**: si falta algo esencial (para qué sirve o tamaño), haz UNA pregunta; si no, dibuja directamente.
   Escribe el JSON con `"estado": "borrador"`.
2. Dile al usuario que lo mire en `http://localhost:5173/sprites.html`.
   Si no tiene `npm run dev` en marcha, recuérdale que lo arranque en otra terminal (no lo arranques tú: bloquea).
3. **Cambios** ("más ancho", "el rojo más oscuro", "quítale el asa"): edita solo las filas necesarias con Edit,
   no reescribas el archivo entero. Responde en una o dos líneas qué has cambiado.
4. **Comparar**: si el usuario duda entre dos ideas, crea `<nombre>--b.json`. Cuando elija, pregunta antes de borrar la otra.
5. **Aprobado** ("me gusta", "vale así"): pon `"estado": "aprobado"` y ejecuta `npm run sprites -- <nombre>`
   para generar `public/assets/sprites/<nombre>.png`.

## Prohibido
- Usar colores que no estén en la paleta (si hace falta uno nuevo, propónselo al usuario antes).
- Tocar `src/`, `ROADMAP.md`, `CLAUDE.md` o la pizarra de tareas.

## Respuestas
Cortas: qué has hecho y qué puede pedirte a continuación. El usuario está mirando el sprite, no hace falta describirlo.