# Context for Cloze — Guía de usuario (Español)

🇬🇧 [English](https://github.com/hugomarins/remnote-context-for-cloze/blob/main/README.md) | 🇨🇳 [中文](https://github.com/hugomarins/remnote-context-for-cloze/blob/main/README_ZH.md) | 🇧🇷 [Português Brasileiro](https://github.com/hugomarins/remnote-context-for-cloze/blob/main/README_PT-BR.md)

Haz que tus repasos sean más claros mostrando dónde se sitúa la tarjeta actual dentro de tu árbol de conocimiento. Este plugin dibuja un “árbol de contexto” compacto debajo de la tarjeta en la cola de repaso, para que puedas orientarte, asociar y recordar — sin modificar el contenido de la tarjeta ni su programación.

## Funciones
- Context for Cloze (núcleo)
  - Añade el power‑up “Context for Cloze” (código: `contextForCloze`) a un Rem. Todos sus descendientes, cuando se repasen como tarjetas, mostrarán debajo un árbol de contexto con raíz en ese Rem.
  - Fase de pregunta: se muestra el contexto evitando cualquier filtración de las respuestas de los clozes.
  - Fase de respuesta: el contexto permanece; el cloze revelado se indica con un subrayado azul y un resaltado azul claro para facilitar la comparación.
- Context Hide Others (`contextHideAllTestOne`) — se aplica a **un solo Rem**, no a un subárbol.
  - Por defecto, el árbol de contexto oculta únicamente el hueco que se te está preguntando; cualquier *otra* línea con cloze aparece con su respuesta revelada. Etiqueta una tarjeta de cloze con este power‑up cuando no quieras que el repaso **de esa tarjeta** sea arruinado por sus hermanos — mientras esa tarjeta está en repaso, todas las demás respuestas de cloze se ocultan (se muestran como `…`).
  - Aplícalo al Rem de la tarjeta de cloze que recibiría el spoiler (la hoja), **no** al ancla ni al padre. Consulta [Context Hide Others](#context-hide-others--proteger-un-cloze-de-sus-hermanos) más abajo.
- Cómo añadir power‑ups a los Rems
  - Comandos:
    - Add Context for Cloze (código rápido `cfc`)
    - Context: Hide Other Answers for This Rem (código rápido `cfchide`)
  - Funcionan con selección múltiple.

![Cambiando el modo de cloze con el botón de ojo y fijándolo con el botón de etiqueta](https://raw.githubusercontent.com/hugomarins/remnote-context-for-cloze/main/img/context-for-cloze-mode-switch.gif)

## Compatibilidad con los power‑ups de visualización en la cola (plugin oficial “Hide in Queue” y plugin “Incremental Everything”)
El árbol de contexto refleja los power‑ups de visualización en la cola del plugin oficial “Hide in Queue” de RemNote **y** del plugin Incremental Everything. Este plugin no registra ninguno de ellos — solo lee sus etiquetas cuando existen, de modo que nada se ve afectado si un power‑up no está instalado.

Etiquetados en el propio elemento:
- Hide in Queue (`hideInQueue`)
  - Muestra el texto de marcador “Hidden in queue” para ese elemento en el árbol de contexto (solo en la fase de pregunta; en la fase de respuesta el elemento se muestra con normalidad).
- Remove from Queue (`removeFromQueue`)
  - Elimina por completo el elemento del árbol de contexto (en ambas fases).
- No Hierarchy (`noHierarchy`)
  - Cuando está presente en la tarjeta actual, el área de contexto muestra únicamente “esta línea” (sin ancestros, hermanos ni descendientes), igual que el comportamiento nativo de RemNote.

Etiquetados en la tarjeta, pero dirigidos a un ancestro (Incremental Everything):
- Hide Parent (`hideParent`) / Hide Grandparent (`hideGrandparent`)
  - Muestra el marcador “Hidden in queue” en la línea del padre / abuelo de la tarjeta (solo en la fase de pregunta).
- Remove Parent (`removeParent`) / Remove Grandparent (`removeGrandparent`)
  - Elimina por completo del árbol de contexto la línea del padre / abuelo de la tarjeta (en ambas fases); sus hijos restantes se mantienen, sin sangría.

La línea de la propia tarjeta actual se muestra siempre, con independencia de cualquiera de estas etiquetas.

## Plegado por defecto — despliega lo que necesites
El árbol de contexto comienza **plegado**. Solo está abierta la rama que conduce hasta la tarjeta en repaso, de modo que la línea evaluada siempre está visible mientras que los descendientes más profundos — que a menudo revelan la respuesta o la sugieren demasiado — permanecen ocultos.

- Una línea con hijos ocultos muestra una **flecha ▸** en lugar de una viñeta; haz clic en ella (o enfócala y pulsa Enter/Espacio) para desplegar esa rama. La flecha apunta hacia abajo cuando la rama está abierta.
- Una línea sin hijos ocultos conserva su viñeta.
- El despliegue es por tarjeta: se reinicia al pasar a la siguiente.
- ¿Prefieres el árbol siempre desplegado de antes? Desactiva **Start Collapsed** en los ajustes.

## Los botones de ojo y de etiqueta — cambiar el modo de cloze durante el repaso
El árbol muestra los clozes de las demás líneas en uno de dos modos: **revelado** (subrayado azul, el modo por defecto) u **oculto** (`…`, el modo por defecto para una tarjeta etiquetada con `Context Hide Others`). Un **botón 👁 en la esquina superior derecha del área de contexto** alterna entre ambos para la tarjeta que tienes delante.

- Ojo **abierto** = las demás respuestas están reveladas. Haz clic para ocultarlas.
- Ojo **tachado** = las demás respuestas están ocultas como `…`. Haz clic para revelarlas.
- Úsalo *antes* de leer el árbol cuando las respuestas reveladas filtren una pista que prefieres ganarte — sin necesidad de etiquetar el Rem primero.
- Úsalo *después* de “Show Answer” cuando un árbol oculto resulte demasiado críptico.
- Por sí solo no cambia nada en tu base de conocimiento: la etiqueta sigue decidiendo el punto de partida y el modo se reinicia en la siguiente tarjeta.
- El botón solo aparece cuando alguna otra línea contiene realmente un cloze — si no, no hay nada que alternar.
- En modo oculto, cada `…` sigue siendo clicable de forma individual, así que también puedes descubrir las respuestas de una en una.

**Hazlo permanente — el botón 🏷 de etiqueta.** En cuanto el ojo deja el árbol en un modo que no coincide con la etiqueta de la tarjeta, aparece un segundo botón **a la izquierda del ojo**. Al pulsarlo, la elección se escribe en el propio Rem, de modo que todos los repasos futuros empiecen así:

- Icono de etiqueta normal = *añadir* `Context Hide Others` a este Rem (mantener ocultas las demás respuestas).
- Icono de etiqueta tachado = *quitarlo* de este Rem (mantener reveladas las demás respuestas).
- Pasa el ratón o el foco por cualquiera de los dos botones y aparecerá una breve explicación en la misma fila, a la izquierda de los iconos.
- El botón desaparece en cuanto la etiqueta coincide con lo que ves, y un aviso confirma el cambio. Esta es la única acción del plugin que escribe en tu base de conocimiento.

## Ajustes (Settings → Plugins → este plugin)
- Start Collapsed (por defecto: activado)
  - Dibuja el árbol plegado, con solo el camino hasta la tarjeta actual abierto; las demás ramas quedan detrás de una flecha ▸ clicable. Como el contenido profundo permanece oculto hasta que lo pides, puedes subir Max Depth sin problemas con esta opción activada.
- Max Depth (por defecto: 8)
  - Limita la profundidad máxima del árbol de contexto. Redúcelo en jerarquías profundas para mejorar la legibilidad.
- Max Nodes (por defecto: 200)
  - Limita el número máximo de nodos mostrados. Redúcelo en árboles muy ramificados para evitar la sobrecarga.
- Debug Mode (por defecto: desactivado)
  - Añade pistas adicionales en la interfaz y la consola para diagnosticar problemas (la mayoría de usuarios puede dejarlo desactivado).

## Cómo usarlo
1. Elige un Rem como “ancla de contexto” y añádele el power‑up “Context for Cloze” (`contextForCloze`).
2. Empieza a repasar: siempre que cualquier descendiente se convierta en tarjeta, aparecerá debajo un árbol de contexto con raíz en el ancla.
3. Opcional: si una tarjeta de cloze fuera a arruinarse por las respuestas reveladas de sus hermanos, añade “Context Hide Others” a **esa tarjeta** — ejecuta **Context: Hide Other Answers for This Rem** (`cfchide`). Consulta la sección dedicada más abajo.
4. Haz clic en las flechas ▸ durante el repaso para abrir la rama que quieras ver; el resto se mantiene apartado.
5. Usa el botón 👁 de la esquina superior derecha del área de contexto para revelar u ocultar las respuestas de cloze de las demás líneas siempre que el modo actual no encaje con la tarjeta — y el botón 🏷 contiguo si quieres que esa elección quede fijada en el Rem.
6. Ajusta Max Depth / Max Nodes en los ajustes para equilibrar densidad de información y legibilidad.

## Context Hide Others — proteger un cloze de sus hermanos

**Qué hace.** Por defecto, este plugin oculta únicamente el hueco que se te está preguntando. Cualquier *otro* cloze del árbol de contexto — hermanos y cualquier otra línea con cloze — se muestra con su respuesta **revelada** (subrayado azul), de modo que las respuestas del entorno actúan como contexto visible.

`Context Hide Others` invierte eso para la tarjeta a la que se aplica: mientras esa tarjeta está en repaso, las respuestas de **todas las demás** líneas con cloze del árbol aparecen **ocultas** (como `…`) en lugar de reveladas. Fíjate en la diferencia de alcance respecto a la etiqueta del ancla: `Context for Cloze` se coloca en la **raíz** de un subárbol y afecta a todos sus descendientes, mientras que esta se coloca en **un único Rem** y solo afecta a los repasos de ese Rem.

La etiqueta define únicamente el modo **inicial** — el botón 👁 descrito arriba lo cambia en ambos sentidos para la tarjeta que tienes delante, sin modificar la etiqueta.

### Cuando no hay ningún ancla de contexto por encima del Rem
Esta etiqueta solo cambia el aspecto de un *árbol de contexto*, y un árbol de contexto solo existe por debajo de un Rem etiquetado con `Context for Cloze`. Etiquetar un Rem sin ese ancestro no haría absolutamente nada, así que el comando lo comprueba primero. Si falta el ancla, aparece un diálogo que explica la situación y ofrece tres salidas:

- **Etiquetar también al padre** — el padre se convierte en el ancla de contexto y el Rem seleccionado recibe `Context Hide Others`. El diálogo nombra al padre y expone la consecuencia por adelantado: un ancla se propaga en cascada, así que *todas* las tarjetas por debajo de ese padre mostrarán un árbol de contexto a partir de entonces. También indica cuántos hermanos tiene el Rem, ya que esos hermanos son de lo que está hecho el contexto — sin ninguno, el árbol quedaría escaso y quizá un ancestro más alto sea mejor ancla.
- **Etiquetar solo este Rem** — añade la etiqueta de todos modos; permanecerá inactiva hasta que algún ancestro se convierta en ancla.
- **Cancelar** — no se escribe nada.

Con una selección múltiple, los Rems que ya están bajo un ancla se etiquetan de inmediato y el diálogo pregunta solo por el resto.

La línea de la propia tarjeta actual siempre aparece oculta como `?`, independientemente de este power‑up, y el texto de contexto sin cloze siempre se muestra. Este power‑up solo cambia cómo aparecen los *demás* clozes.

**Dónde aplicarlo.**
- Aplícalo **al Rem de la tarjeta de cloze que recibiría el spoiler no deseado de sus hermanos** — es decir, la hoja cuyo repaso quieres mantener limpio. No es un marcador de grupo: protege la tarjeta concreta en la que está.
- **No** lo apliques al ancla ni al padre que lleva `Context for Cloze`. El efecto está ligado al Rem de la tarjeta que se está repasando y no se hereda hacia abajo en el árbol, así que una etiqueta en el padre no hace nada.
- La protección es por tarjeta y unidireccional: etiquetar la tarjeta A solo limpia **el repaso de A**; no influye en lo que muestren B o C cuando les toque. Por eso, cuando varios hermanos se arruinarían mutuamente, etiqueta **cada** tarjeta que quieras proteger — cualquier hermano sin etiquetar seguirá revelando todas las respuestas durante su propio repaso.
- Consejo: selecciona las tarjetas de cloze que quieras proteger y ejecuta **Context: Hide Other Answers for This Rem** (`cfchide`) — el comando admite selección múltiple, así que puedes etiquetarlas de una vez.

**Cuándo usarlo.** Úsalo cuando un padre agrupe varios clozes hermanos que se arruinarían entre sí al mostrarse juntos — por ejemplo, una lista enumerada donde cada ítem es su propia tarjeta de cloze, o un conjunto de hechos paralelos que quieres recordar de forma independiente. Mantén el comportamiento por defecto (no etiquetar) cuando las respuestas vecinas sean contexto legítimo que *quieres* ver mientras recuerdas la actual.

**Revelar los clozes ocultos de uno en uno (clic para revelar).** Cuando una tarjeta está protegida así, cada `…` oculto es un botón. Haz clic en él (o enfócalo y pulsa Enter/Espacio) para revelar solo la respuesta de ese cloze en su sitio; vuelve a hacer clic para ocultarla de nuevo como `…`. Esto te permite autoevaluar poco a poco — uno por uno — los clozes ocultos del entorno, aunque no sean la tarjeta evaluada. Cada `…` se alterna de forma independiente, el hueco evaluado permanece siempre oculto (nunca se vuelve clicable) y todas las revelaciones se reinician automáticamente al pasar a la siguiente tarjeta.

## Consejos
- El plugin solo se dibuja en la cola de repaso; la vista del editor no se ve afectada.
- Si la tarjeta actual no está bajo ningún ancla “Context for Cloze”, no se muestra ningún árbol de contexto.
- Cuando se usa junto con No Hierarchy (`noHierarchy`), solo se muestra la línea actual. Es intencionado.

## Capturas de ejemplo

> Las siguientes capturas te ayudan a ver cómo se comporta el plugin en repasos reales.

1) Estructura de prueba (plano del árbol de contexto)

![Estructura de prueba](https://remnote-user-data.s3.amazonaws.com/zaFqKpkiElkV2UIcTnEPlt0mr09fwkG0FV52yBVdzCJR6nTH0Lb6tEEgRIFht-oEINkdrK8wJF1K3G_VjYmWu-vohCE6RwAez_wvjvR6h-WtUPvVPYpyL0V6XdaGRRlJ.jpeg?loading=false)

2) Ejemplo de repaso A (fase de pregunta, sin filtrar pistas)

![Repaso A](https://remnote-user-data.s3.amazonaws.com/GT9Ausv726feJf22kII7MJhnGCbfhVYFCh5GMtf2mUweNpSQUHn6dtmL0GWSTHzLVnyEJtZjCthc5Rda7aIJ-0eFMO2xhOO6dLqRrvm8SfEzl3FFF3zRx9qR8c0czX5g.jpeg)

3) Ejemplo de repaso B (fase de respuesta, resaltado del cloze)

![Repaso B](https://remnote-user-data.s3.amazonaws.com/bXoC-aeiey70Hl_jrjmS0MCUzN82TMPYUJF8KGy9iErqMqAQ-5dGy3UdqW4xbW2ezXFZg1uCgDnM4brRKA8Y0Doz87_VLLUZRS4C7i2t4qmCwVvvi8UZHp9MOaXhutc0.jpeg?loading=false)

- Nota: demostración del power‑up “No Hierarchy” funcionando junto con este plugin.

4) Ejemplo de repaso C (ramas / niveles de un vistazo)

![Repaso C](https://remnote-user-data.s3.amazonaws.com/niJfC_INpPkpidUzOw6ZbY4r7e2bIXbK9zuVoCItDPPv3wv8qVl1b25OpTY8fWGC5JRr2jUHNN9TjOaQzuQwSc2qPqRFzBZRZHEY9vCmDJs-Lux3XYfBZapnr52ZEcyV.jpeg?loading=false)

5) Ejemplo de repaso D (contenido con texto enriquecido mixto)

![Repaso D](https://remnote-user-data.s3.amazonaws.com/j_FQj9RxuQnRqFO4X3Qo64siZY_3nHxoU4vQv-Hy1Op5OcAva_IuBPFlVA1EHAsjeywgP-wBHGrBUfjv82I2V-wJ409_IdO6AOJi8w8xHdIc8DfKH9zF9pjiskwoMlyf.jpeg?loading=false)

6) Ejemplo de repaso E (aspecto general)

![Repaso E](https://remnote-user-data.s3.amazonaws.com/rSRm6AeAIG7bsA1K74po0wdLr-cfbW9mGaA_Rkdp20qY2A54-2_W8kUy2Y4mkHls_K1CLnhR57677cGcIeBPdBSz_cmpDiTDlTN91M4r184lrhjKT4_f85OUoQ7qLG4h.jpeg?loading=false)
