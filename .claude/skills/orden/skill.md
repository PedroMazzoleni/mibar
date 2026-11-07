---
name: orden
description: Ejecuta la siguiente tarea del ROADMAP con el equipo de agentes (planificar, implementar, probar, revisar y hacer commit local).
disable-model-invocation: true
argument-hint: "[ID de tarea opcional, ej. 1.3]"
---

# /siguiente

Llevas una tarea del roadmap de principio a fin con el equipo de agentes.
Solo paras para pedir permiso en un punto: la aprobación de la especificación.

## Flujo
1. **Elegir tarea**: si hay argumento (`$ARGUMENTS`), esa tarea; si no, la primera `[ ]` de `ROADMAP.md`.
2. **Especificar**: llama a @arquitecto-juego. Enseña la especificación al usuario y ESPERA su aprobación.
   Si pide cambios, vuelve al arquitecto con ellos.
3. **Publicar la pizarra** `.claude/tarea-actual.md` (sobrescribe la anterior):
   ```
   # Tarea <ID>
   ## Especificación (aprobada)
   <especificación>
   ## Bitácora
   ```
4. **Implementar**: @desarrollador-phaser.
   Si deja una `DUDA:`, la responde @arquitecto-juego. Si la respuesta cambia el alcance, pregunta al usuario.
   Después, el desarrollador continúa.
5. **Probar**: @test-automator.
   Si da `FALLO`: @debugger y otra vez @test-automator, como máximo 2 veces.
   Si sigue fallando, PARA y cuéntale al usuario qué falla.
6. **Revisar**: @code-reviewer.
   Si da `PROBLEMAS`: un único arreglo con @desarrollador-phaser, luego @test-automator y @code-reviewer otra vez.
   Si sigue con problemas, PARA y cuéntaselos al usuario.
7. **Cerrar la tarea**: marca `[x]` en `ROADMAP.md` y añade en `## Registro` una línea `- <fecha> <ID> <resumen corto>`.
8. **Commit local**: llama a @git-publicador en modo commit con el mensaje `feat(fase-N): <resumen>`
   (o `fix`/`docs`/`chore` si encaja mejor). Hazlo sin preguntar al usuario. No hagas push.
9. **Resumen y PARAR**: en pocas líneas, di al usuario:
   - qué tarea se ha hecho y qué puede comprobar (la línea de Aceptación),
   - los sprites nuevos, si hay (se ven en `http://localhost:5173/sprites.html`),
   - el hash del commit,
   - que puede decir "sube" para hacer push a GitHub, y que conviene hacer `/clear` antes de la siguiente tarea.
   No empieces otra tarea.

## Reglas
- Cada agente contesta con una palabra de estado y una línea; el detalle va en la bitácora.
- No ejecutes `/init` (sobrescribiría `CLAUDE.md`).
- Si el usuario dice "sube" después de una tarea, llama a @git-publicador en modo push.