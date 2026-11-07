---
name: orden
description: Ejecuta la siguiente tarea pendiente del ROADMAP.md con el equipo de agentes, una sola cada vez.
disable-model-invocation: true
---

Ejecuta UNA tarea del roadmap con este flujo (planificación → ejecución → verificación). No hagas nada fuera de él.

Los agentes se comunican a través de `.claude/tarea-actual.md`: el arquitecto define la tarea y cada agente lee ese archivo y añade su parte en la sección `## Bitácora`. Tú (la conversación principal) coordinas el orden y pasas solo mensajes cortos.

1. **Elegir.** Lee `ROADMAP.md`. Si el usuario indicó un ID (por ejemplo `/siguiente 1.3`), usa esa tarea; si no, la primera `- [ ]` en orden.
2. **Especificar.** Delega en `arquitecto-juego` con el ID y el texto de la tarea.
3. **Aprobar.** Muestra la especificación al usuario y espera su confirmación. Si pide cambios, ajústala tú sin volver a llamar al arquitecto. Si dice que no, para.
4. **Publicar.** Sobrescribe `.claude/tarea-actual.md` con la plantilla de abajo y la especificación aprobada.
5. **Implementar.** Delega en `desarrollador-phaser`: "Implementa `.claude/tarea-actual.md`".
6. **Verificar.** Delega en `test-automator`: "Verifica `.claude/tarea-actual.md`".
7. **Arreglar (solo si falla).** Delega en `debugger`: "Resuelve el último fallo de la bitácora de `.claude/tarea-actual.md`" y vuelve al paso 6. Máximo 2 vueltas; si sigue fallando, para y explica el problema al usuario.
8. **Revisar.** Delega en `code-reviewer`: "Revisa la tarea de `.claude/tarea-actual.md`". Si hay problemas, un único paso por `debugger` y vuelve al paso 6.
9. **Consultar al arquitecto (solo si hace falta).** Si algún agente anota en la bitácora una `DUDA:` de diseño, delega en `arquitecto-juego`: "Responde la duda de `.claude/tarea-actual.md`", añade su respuesta a la bitácora y repite el paso del agente que preguntó.
10. **Cerrar.** Marca la tarea como `[x]` en `ROADMAP.md` y añade en `## Registro` una línea: fecha · ID · resumen.
11. **Commit.** Propón un mensaje (`feat(fase-N): ...`) y pregunta si hacerlo.
12. **Parar.** Resume en 3 líneas lo hecho y di cuál es la siguiente tarea. NO la empieces. Recuerda que puede usar `/clear` antes de la siguiente.

## Plantilla de `.claude/tarea-actual.md`

```markdown
# Tarea <ID> — <título>

## Especificación (aprobada por el usuario)
<especificación del arquitecto>

## Bitácora
<!-- Cada agente añade UNA entrada corta al final: [agente] resultado. Usa DUDA: para preguntas de diseño. -->
```