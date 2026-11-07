---
name: orden
description: Ejecuta la siguiente tarea pendiente del ROADMAP.md con el equipo de agentes, una sola cada vez.
disable-model-invocation: true
---

Ejecuta UNA tarea del roadmap con este flujo (patrón planificación → ejecución → verificación). No hagas nada fuera de él.

1. **Elegir.** Lee `ROADMAP.md`. Si el usuario indicó un ID (por ejemplo `/siguiente 1.3`), usa esa tarea; si no, la primera `- [ ]` en orden.
2. **Especificar.** Delega en `arquitecto-juego` con el ID y el texto de la tarea.
3. **Aprobar.** Muestra la especificación al usuario y espera su confirmación. Si pide cambios, ajústala tú sin volver a llamar al arquitecto. Si dice que no, para.
4. **Implementar.** Delega en `desarrollador-phaser` con la especificación aprobada.
5. **Verificar.** Delega en `test-automator` con la especificación (para saber qué tests escribir).
6. **Arreglar (solo si falla).** Pasa SOLO el error resumido a `debugger` y vuelve al paso 5. Máximo 2 vueltas; si sigue fallando, para y explica el problema al usuario.
7. **Revisar.** Delega en `code-reviewer`. Si devuelve problemas, un único paso por `debugger` y vuelve al paso 5.
8. **Cerrar.** Marca la tarea como `[x]` en `ROADMAP.md` y añade en `## Registro` una línea: fecha · ID · resumen.
9. **Commit.** Propón un mensaje (`feat(fase-N): ...`) y pregunta si hacerlo.
10. **Parar.** Resume en 3 líneas lo hecho y di cuál es la siguiente tarea. NO la empieces. Recuerda al usuario que puede usar `/clear` antes de la siguiente.