# DIRECTOR.md — norma ÚNICA para hacer un short (v4)

> Si eres Claude: lee este archivo entero ANTES de escribir `story.js`. Sustituye a los antiguos AI_DIRECTOR_PROMPT, CAMERA_FRAMING, INSTRUCCIONES_ILUMINACION y COMO_PEDIR_A_CLAUDE (se borraron: se contradecían entre sí).
> Objetivo: igualar el **nivel de detalle y densidad de animación** de `references/new/` (ref8 samurái/trueno, ref9 fuerte/ejército) sin copiar sus planos, personajes ni gags. El usuario renderiza en su PC; tú entregas **solo el zip del proyecto** (ver §9).

## 0. Qué se arregló en v4 (la causa de "la cámara no deja ver nada")
1. **`creep` acumulaba zoom desde el fotograma 0 del vídeo.** Con el valor que mandaban las reglas (0.0018) un short de 60 s acababa con el FOV a la mitad (40° → 20°) y uno de 90 s a ~11°: cada plano nuevo salía más cerrado que el anterior. Ahora `creep` es "% de FOV por segundo de plano", se cuenta desde el último corte y tiene tope (`creepMax` 10 %). Defecto 0.03. **No lo subas de 0.06.**
2. **El autoencuadre de v3.3 no funcionaba como se creía**: solo estaba en `engine/main.js`, y `setup.sh` lo sobrescribe con `worlds/<mundo>/main.js`, que no lo tiene. Además, si se hubiera activado, habría alejado todos los primeros planos para meter el cuerpo entero. Se ha quitado.
3. **Los planos se escribían con coordenadas de mundo adivinadas** (`C([0,8,10],[0,7,0],38)`) y casi siempre apuntaban a vacío. Ahora se componen con `subjectShot()` / `groupShot()` / `orbit()` (en `engine/motion.js`): dices **qué** miras y **cuánto de la pantalla ocupa**, y la distancia sale de la óptica.

## 1. Cámara (lo más importante)
**Nunca escribas `pos`/`look` a mano para un personaje.** Usa:
```js
subjectShot(PIES_TARJETA, { fill, az, el, fov, dx, dy, s, aim, roll })   // un sujeto
groupShot([p1, p2, p3], { az, el, fov, fill })                         // varios: se aleja solo hasta que quepan
orbit(PUNTO, distancia, az, el, fov)                                   // mundo, objetos, planos cenitales
```
- `fill` = fracción de la altura de pantalla que ocupa el **cuerpo entero** de la tarjeta: `FILL.ecu 3.2` (ojos/cara) · `cu 2.1` (cabeza y hombros) · `mcu 1.45` (pecho) · `ms 0.95` (cuerpo entero) · `mws 0.62` · `ws 0.34` · `ews 0.14` (personaje diminuto en el mundo).
- `az` lado desde el que se ve (0 = de frente, ±20-40 = tres cuartos). `el` altura: **2-6° a la altura de los ojos, −3 a −8° contrapicado (cámara casi a ras de suelo, como en ref8/ref9), 25-70° picado, 80° cenital.**
- `dx`/`dy` = regla de tercios (±0.12-0.18 / 0.05-0.12). Un personaje centrado y quieto es el plano más "barato".
- `fov`: 30-38 retratos/insertos, 40-50 medio, 52-60 mundo y multitudes (perspectiva exagerada cerca del suelo = el aspecto de las referencias).
- Cada plano = `c0` → `c1`: cambia **algo** (fill 1.45→1.8, az 20→10, el 4→1, fov 38→35). La cámara nunca está congelada: además hay `creep` (push-in 3 %/s) y `sway: 0.012` (mano).
- **Cuándo se cambia de composición:** una nueva cada **1.5-2.5 s** (4-9 palabras). En las referencias se mide muy poco corte duro (ref8: 5 en 59 s; ref9: 0 en 67 s) y la cámara se mueve en ≈ la mitad de los fotogramas: el cambio se hace con **glide** (`glide: 6-10`, `ease: 'easeOut'`: arranca rápido y frena), whip y push-in. **Regla: ≥ 70 % de los cambios son glide; corte duro solo al cambiar de lugar o en el golpe final.**
- Alterna escala: ews/ws (mundo, cenital, multitud) → ms/mws (acción) → cu/ecu (reacción) → **inserto de objeto** (cu del prop a 1.2-2 m, `cinf` 9) → POV. Nunca dos planos seguidos de la misma escala.
- **QA de cámara (obligatorio):** `node render.mjs stills/a "inicio,mitad,final de cada plano"` + `python sheet.py`. Revisa: ¿se ve el sujeto?, ¿cabeza y mirada con aire?, ¿algo tapa la cámara (farolas, troncos, mesa)?, ¿el FOV del último plano sigue ≈ el del primero? (si se estrecha con el tiempo, algo va mal).

## 2. Densidad de escena (lo que hace que NO se vea barato)
Las referencias no tienen "decorados": tienen **espacios habitados**. En ref8/ref9 todo plano lleva a la vez:
1. **Primer término** desenfocado y tocando el borde (hierba alta, cuerda, barril, rama, borde de mesa, un personaje de espaldas cortado).
2. **Sujeto** nítido con **expresión actuada** (ver §4).
3. **≥ 2 elementos de fondo** con vida (personajes secundarios reaccionando, humo, banderas, fuego, luna, torres, tiendas).
4. **Una fuente de luz práctica** que tiñe la escena (hoguera, linterna, antorcha, ventana, relámpago) además del sol/luna.
5. **Un efecto vivo** (chispas, polvo, lluvia, humo, rayos 3D, destello) y atrezo con **modelado real**, no un rectángulo (bomba con mecha, barril con monedas, carreta con 80 agujeros y cañas, carretilla, paraguas ceremonial).
- Materiales con textura pintada y juntas marcadas (sillería, madera, tela de tienda, alfombra con dibujo, tejas), nunca un color liso.
- Los mundos son **densos y se reutilizan en muchos ángulos**: construye un decorado grande con 3-4 "rincones" (campamento, tienda interior, muralla, camino) y muévete por él.
- **Multitudes:** vistas desde arriba y a ras de suelo, cientos de muñecos (geometría fusionada, ver NOTES.md) con ropa/casco/bandera por bando. Un héroe de color vivo entre multitud apagada.
- **Vestuario por rol** (armadura con dibujo, sombrero, banda, parche, cinta en la cabeza): que cada personaje se reconozca por silueta.
- **Antes de escribir el código** apunta, por plano: primer término · sujeto + expresión · fondo ×2 · luz práctica · efecto. Si te falta uno, el plano está vacío.

## 3. Luz y color
- Una luz por bloque del guion (día → atardecer → tormenta/noche → amanecer), cambiando en el giro. Hasta 3-4 cambios por short.
- Sombras largas y **frías (azul/violeta)**, sol cálido (`#ffc888`-`#ff9848`), negros profundos. `el` del sol **12-30°** (no cenital: >35° solo para mediodía a propósito). `hemi` 0.5-0.8: si sube de 0.85 la escena se lava. Cielo con degradado y nubes, sin blancos quemados.
- **Noche (ref8):** luna grande, cielo azul-petróleo con nubes, sombras azules, **luz cálida de fuego/linternas sobre los personajes** (contraste frío/cálido) y rayos de luz. **Interior (ref8):** luz cálida con una ventana azul. **Tormenta (ref9):** `rain: 1`, lámparas encendidas, relámpagos con `flash`.
- Los personajes reciben la luz de la escena (tinte y sombra), no son pegatinas: baja su `emissive` si se ven planos.
- DOF: foco = distancia real al sujeto; `cinf` 2 mundo abierto · 5-6 plano medio · 8-9 cu e insertos. El primer término siempre fuera de foco.
- Presets listos en `plantilla_story_v4.js` (dia, atardecer, gris, tormenta, noche, amanecer, triunfo).

## 4. Personajes y animación
- Cabeza de judía/ovalada, contorno grueso, extremidades finas. **Cada personaje en pantalla**: `idle(f, seed)` + `blinkAt(f, seed)` en todos los fotogramas.
- **Actuación:** la expresión cambia cada ~1.5 s y sigue la frase (asombro con gotas de sudor, ira con vena, desprecio, risa, miedo, calma). Las referencias usan: ojos entrecerrados, boca abierta de grito, gotas, vena roja, cara aplastada de golpe. Un personaje con la misma cara 3 s seguidos es un fallo.
- Física no lineal: entradas `M.back`, preparación `M.anticip`, vibración `M.spring`. Nunca `lerp` lineal en acciones.
- Acción física visible: lanzar, rodar, golpear, caer, correr, tumbarse. Los objetos que importan **se mueven por el mundo** (la bomba rueda hasta el campamento; la carreta avanza). Un objeto estático que se "explica" con la voz es un plano muerto.
- Reacción de los secundarios en el mismo plano (se ríen, se asustan, miran al prota).
- Gags de lectura rápida: cartel `fxBoard`, exclamaciones `fxExcl`, humo `fxBang`.

## 5. Guion (planea ANTES de escribir código)
- Gancho-paradoja en la 1ª frase. Contexto concreto (hora, número, lugar). Escalada con burla/duda. **Pivote "Verán…/You see…"** hacia el mecanismo real con analogía cotidiana. Remate irónico en la última palabra, con destello.
- 3.5-4 palabras/s, apenas pausas. 45-90 s según el pedido del usuario.
- **Cada frase tiene objeto o acción visible** (dinero → monedas, tiempo → reloj, dato → cartel, mecanismo → modelo del objeto en detalle/diagrama).
- Tabla previa de planos: `#, segundo, escala (FILL), az/el, primer término, sujeto+expresión, fondo, luz, efecto, SFX`.

## 6. Audio
- Un SFX por corte/aparición/golpe (`pop`, `whoosh`, `wood_hit`, `thud`, `bell`, `coin`). Música baja (-9.5 dB defecto) y **0.5 s de silencio antes de la última frase**.

## 7. Subtítulos
Solo si el usuario los pide. Si los pide: palabra a palabra (1-2 palabras), blanco bold con contorno negro, **abajo** (~70 % de la altura), como en ref8/ref9 (`tools/captions.py`).

## 8. Checklist antes de entregar
- [ ] Planos de 1.5-2.8 s; ≥ 70 % de transiciones por glide; nunca 2 planos seguidos de la misma escala.
- [ ] Todos los planos con `subjectShot`/`groupShot`/`orbit` (ninguna coordenada de cámara a mano para personajes).
- [ ] Stills de inicio/mitad/final revisados: sujeto visible, aire sobre la cabeza, nada tapando, FOV final ≈ inicial.
- [ ] Cada plano cumple §2 (primer término, sujeto con expresión, 2 fondos, luz práctica, efecto).
- [ ] ≥ 3 cambios de luz. `idle`+`blinkAt` en todos. Utilería visible por frase.
- [ ] `node --check` de story.js y de main.js sin errores.

## 9. Qué entregar (el usuario renderiza en su PC)
Solo el **zip del proyecto** con la estructura de `tools/setup.sh`: `web/` (index.html, main.js con el mundo, story.js, motion.js, paint.js, roman.js, toon.js, lib/), `audio.py`, `script.txt`, herramientas (`render.mjs`, `mix.py`, `finish.sh`, …) y `package.json`. **No renderizar vídeo ni fotogramas finales** (solo stills de prueba para el QA de cámara, si se pueden hacer). El programa del usuario elige resolución (4K/1440p/1080p/720p) y fps (15/30/60): si lo cambia, `story.js` sigue en fotogramas a 30 fps, no hardcodees píxeles.

## 10. Referencias
`references/new/` (ref8, ref9: 1 fotograma por segundo, 24 s por hoja), `references/storyboards/` (22 hojas del canal de referencia), `references/STYLE_BIBLE.md` y `references/reports/` (medidas de luz, tinta, texturas, DOF; **sus fragmentos de código son de otro motor (Remotion): usa solo los números**). Técnica sí, plano/personaje/gag no.
