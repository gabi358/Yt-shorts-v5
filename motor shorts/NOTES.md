# Lessons learned (read before building a new short)

## Workflow that works
1. `python tools/check.py`, then `bash tools/setup.sh ~/shorts/<slug> [soldier|eiffel]` (three.js + toon.ts are vendored; all tools are copied to the project root).
2. In the project: `python timing.py voice.mp3 script.txt --out work` -> phrase times. Pauses must fall on sentence ends.
3. Write `web/story.js` (shots + cameras + actors + fx) and `audio.py` (cue table). Render 12-16 stills, `sheet.py`, fix, THEN full render.
4. `node render.mjs frames "0-<N-1>"` (GPU by default; `DRAFT=1` for 540x960; `RESUME=1` to continue). On CPU only: `bash render_parallel.sh <N> 2` (about 3-6 s/frame/worker).
5. `TOTAL=<N> python audio.py && python mix.py voice.mp3 music.wav sfx.wav` then `SMALL=1 bash finish.sh "Title"` (add `CAPTIONS=1` after `python captions.py work/phrases.json`).
   Without a voice, mix.py still works but set levels by ear (music louder).

## Camera traps (vertical 1080x1920)
- Horizontal half-width = distance * tan(hfov/2), hfov = 2*atan(tan(vfov/2)*0.5625). At 7 m / fov 36 that is only +-1.2 m, so crowds must be stacked in depth and overlapped (0.75 m spacing).
- Lamp posts / trunks between camera and subject black out the frame: keep street furniture out of camera corridors.
- Never let a floor plane sit exactly at the ground height (z-fighting grass): raise interior floors 0.05-0.1.
- A table in front of characters (top at 0.88 m) hides their legs and makes them read as seated.
- Cut = last key of a shot at frame b and first key of the next at b+1.
- Poses: head centre is ~1.3 m above the card's soles. Paper/briefcase props: card.y = DECK + 0.1..0.55 puts them at chest/face height.
- Outfit keys: `tunic`, `cap`, `tophat`, `hair`, `moustache`, `stout`, `toga` (a sash). The sash is part of the key, it cannot be added mid-shot: use two keys (e.g. lustigB without sash) for dress-up beats.

## Cast and props added (engine/roman.js)
Outfits: lustig, lustigB, poisson, mayor, cop, dA-dF (dealers), gA-gF (guests). Props: fxNews, fxCase, fxBill, fxRust.

## Worlds
- `worlds/bridge/main.js` Roman bridge (original). `worlds/paris/main.js` Paris 1925: Haussmann avenue, hotel facade with awning and flags, cafe terrace, Eiffel Tower (rusty/clean builder), hotel salon interior at x=90 (table, chairs, chandelier, windows).
- Reusable builders in the Paris world: `facadeCanvas`, `ironCanvas`, `strut`, `buildTower`, `block`, `tree`, `lamp`.

## Render gotchas
- Two workers on a 2-vCPU box worked fine; the session can be interrupted: use RESUME=1.
- Uploads over 30 MB are refused: use SMALL=1 in finish.sh.


## Lecciones de los shorts del cerdo y los emús (v3.2)
- **Dos personajes en un plano cuestan**: a 5 m con fov 44 el semiancho es solo ~1.1 m. Separa a los personajes ±0.5-1.0 m, o sube fov a 50-60 y aleja la cámara 7-9 m (siguen legibles). Comprueba siempre un still de cada plano.
- **Geometría fusionada, no instancias**: el pase de normales/profundidad (`ndMat`) no soporta `InstancedMesh`. Para multitudes usa `merged([...geos], mat)` (copia posición/normal/uv/índices; ver `worlds/outback/main.js`) y anima el grupo entero.
- **Capas de color en césped/trigo**: 3 mallas fusionadas de conos con colores distintos dan textura; un plano único se ve plano.
- **Lluvia**: `LIGHTS.<x>.rain = 1` activa un overlay procedural en el shader de tinta (uniforms `rain`, `tm`); no gasta tarjetas.
- **Luz mezclada en un plano**: `light: ['day','gold','night']` en el plano y `lightFor` interpola (ver `example/pig/story.js`).
- **Mundo sin mar**: deja `waterU` definido (el bucle de luz lo escribe) y no añadas la malla.
- **Tarjeta caída (animal muerto)**: `roll: 1.45` y `y = DECK + 0.3` (el giro es sobre la base de la tarjeta).
- **Render**: con CPU, 2 procesos (`RESUME=1`), unos 5.6 s/fotograma/proceso: 1650 fotogramas = 80 min, 1340 = 60 min. No pongas varios `sleep` en paralelo.
- **Mezcla**: `mix.py` deja música y SFX a -6 dB de la voz, pero `finish.sh` (loudnorm -14 LUFS, TP -1.5) acaba en -16 LUFS si la voz es suave: sube `--music-db`/ganancia o `loudnorm` con `linear=true` si quieres -14.
- **Voz y guion**: si la voz sigue el guion al pie de la letra, `timing.py` alinea por silencios sin transcribir; con N pausas distintas de N frases, comprueba el texto.
- **Subtítulos**: `captions.py work/phrases.json` y `CAPTIONS=1 SMALL=1 bash finish.sh "Titulo"`; un MP4 de 55 s a CRF 17 pesa ~41 MB (usa la copia -small).


## Cámara (v4) — sustituye a la sección "encuadre automático v3.3"
- No hay autoencuadre. Compón con `subjectShot` / `groupShot` / `orbit` (ver `DIRECTOR.md` §1).
- `creep` es push-in por segundo dentro de cada plano (defecto 0.03, tope `creepMax` 0.10, no pasar de 0.06). Se reinicia en cada corte duro (hueco de 1 fotograma entre la última key de un plano y la primera del siguiente; `keysFromShots` lo hace solo).
- Si algo se ve cada vez más cerrado según avanza el vídeo, es el síntoma del `creep` antiguo (v3): comprueba que usas el `motion.js` de v4.
- Las tarjetas miden 2.25 m (pies→coronilla) a escala 1; la cabeza queda a ~1.3 m (`aim` 0.58).
- Valida cada plano con 3 stills (inicio, mitad, final) antes del render.
