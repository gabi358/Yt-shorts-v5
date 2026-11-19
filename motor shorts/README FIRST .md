> **v5:** lee MOTOR_V5.md (motor nuevo con luz, cielo, FX y mundo campamento).

# cartoon-short-kit v4 (cámara por composición)

Audio in, vertical cartoon short out (1080x1920, 30 fps). Muñecos 2D "cabeza de judía" en un mundo 3D con tinta y texturas pintadas
(three.js en Chromium headless), con música y SFX sintetizados.

> 🚨 **PARA CLAUDE / AGENTES DE IA:** lee **`DIRECTOR.md`** entero ANTES de escribir una línea de `story.js` (es la norma única: cámara, densidad de escena, luz, personajes, guion, checklist y qué entregar). Después `NOTES.md` (trampas técnicas) y `plantilla_story_v4.js` (punto de partida). Los cambios de v4 están al final de este archivo.
> `STYLE_GUIDE.md` y `references/` son material de estudio, no normas.

## Requisitos (una sola vez)
- **Node 22.13+**, **Python 3** (`pip install -r requirements.txt`), **ffmpeg** (con ffprobe) en el PATH.
- **bash**: en Windows usa *Git Bash* (Git for Windows) o WSL.
- Comprueba todo con `python tools/check.py`.

## Flujo (todo desde la carpeta del proyecto)
```
bash tools/setup.sh ~/shorts/mi-short soldier|eiffel|pig|emu    # crea el proyecto y copia las herramientas a su raíz
cd ~/shorts/mi-short
python timing.py voice.mp3 script.txt --out work         # tiempos (pausas al final de cada frase). LANG_CODE=es, WHISPER_MODEL=small
#  escribir web/story.js (planos, cámaras, actores, fx) y reescribir el mundo en web/main.js; audio.py = tabla de sonidos
node render.mjs stills/a "5,40,90"  &&  python sheet.py stills/a stills/sheet.jpg      # stills de prueba: revisar ANTES del render
node render.mjs frames "0-<TOTAL-1>"                     # render (RESUME=1 continúa). En CPU: bash render_parallel.sh <TOTAL> 2
TOTAL=<TOTAL> python audio.py                            # genera SOLO los stems: music.wav y sfx.wav
python mix.py voice.mp3 music.wav sfx.wav                # --music-db -9.5 (defecto) --sfx-db -6 -> mix_raw.wav
bash finish.sh "Titulo"                                  # -> out/Titulo.mp4 + QA (SMALL=1 copia <30 MB, CAPTIONS=1 subtítulos)
```
Subtítulos palabra por palabra (opcional): `python captions.py work/phrases.json` (crea `captions.ass`; `--font`, `--size`, `--marginv`, `--words`) y luego `CAPTIONS=1 bash finish.sh "Titulo"`.
La fuente por defecto es Arial (existe en Windows); en `STYLE_GUIDE.md` los shorts de referencia llevan subtítulos siempre.

## Render con GPU o sin ella
`render.mjs` usa la **GPU por defecto** (ANGLE: Direct3D 11 en Windows, Metal en Mac, GL en Linux) e imprime `WebGL: <tu GPU>` al empezar.
Si pone *SwiftShader* o *llvmpipe*, no está usando la GPU: prueba `ANGLE=vulkan`.
Variables: `CPU=1` (sin GPU, 3-9 s/fotograma), `DRAFT=1` (borrador 540x960; `finish.sh` lo escala a 1080x1920), `RESUME=1`, `ANGLE=d3d11|vulkan|metal|gl`.
PowerShell: `$env:DRAFT=1; node render.mjs frames "0-500"`. Alternativa en Python: `python render.py ...` (`pip install playwright`, `playwright install chromium`).
Con GPU basta un solo proceso; `render_parallel.sh` es para CPU.

## Contenido
- `engine/` motor (`main.js`, `paint.js`, `roman.js`, `motion.js`); `worlds/bridge`, `worlds/paris`, `worlds/island` y `worlds/outback`: `main.js` completo por escenario.
- `example/soldier`, `example/pig`, `example/emu` y `example/eiffel` (París 1925, 46 s, 16 planos, en español): `story.js` + `audio.py` + guion.
- `vendor/` three.js r160 y `toon.ts` (sin red). `references/new/` (ref8 y ref9, el nivel a igualar), `references/storyboards/` (22 hojas), `references/reports/` (medidas) y `STYLE_GUIDE.md` (histórico).
- `DIRECTOR.md` norma única de dirección; `plantilla_story_v4.js` plantilla de story.js; `NOTES.md` trampas técnicas y lecciones.
- `tools/` setup.sh, check.py, timing.py, render.mjs, render.py, render_parallel.sh, sheet.py, captions.py, mix.py, finish.sh.

## Cambios en v4
- **Cámara arreglada.** `creep` acumulaba zoom desde el fotograma 0 del vídeo (un short de 60 s terminaba con el FOV a la mitad). Ahora es push-in por plano (3 %/s, tope 10 %). Ver `DIRECTOR.md` §0.
- **Composición por fracción de pantalla**: `subjectShot`, `groupShot`, `orbit`, `keysFromShots` (con `glide`), `FILL`, `sway` en `engine/motion.js`. Se acabó adivinar coordenadas.
- **Quitado el autoencuadre v3.3** (solo estaba en `engine/main.js`, que `setup.sh` sobrescribe, y alejaba los primeros planos).
- **Normas unificadas** en `DIRECTOR.md` (se borraron AI_DIRECTOR_PROMPT, CAMERA_FRAMING, CHANGELOG v3.3, INSTRUCCIONES_ILUMINACION, COMO_PEDIR_A_CLAUDE y plantilla_story_10de10: se contradecían). Se quitó `example/soldier/stills.jpg` (aspecto plano de la v1) y `references/reports/CONTEXT.md`.
- **Nuevas referencias** `references/new/ref8_*` (samurái y la bomba, noche, 59 s) y `ref9_*` (fuerte y ejército, 67 s).
- Los ejemplos (`example/*`) se escribieron con el zoom acumulado antiguo: úsalos para la API (actores, fx), no como referencia de cámara ni de aspecto.

## Cambios en v3.2
- **Nuevos mundos** `worlds/island` (isla San Juan 1859: mar, bosque, campo de patatas, cabaña, tiendas, banderas, bloques de 64/420 soldados, 14 cañones, 3 barcos, mesa con mapa, tumba) y `worlds/outback` (Australia 1932: trigo, eucaliptos, granja, molino, camión con ametralladora, vallas, casquillos, manada de 200 emús, ejército de emús con casco).
- **Nuevos ejemplos** `example/pig` (La guerra del cerdo, 55 s, 35 planos) y `example/emu` (La guerra de los emús, 44 s, 26 planos), con `story.js`, `audio.py` y `script.txt`; `setup.sh ... pig|emu`.
- **Reparto y accesorios** en `engine/roman.js`: cutlar/cutlarR, usS, usO, gbS, admiral, judge, hbc, aus, major, farmA, farmB; `pigFront`, `emuFront` (expresiones, corona, casco, banda), `fxBang`, `fxBoard`, `fxCross`, `fxExcl`, `fxPotato`; opción `rifle` junto a `spear`.
- **Lluvia** procedural en el shader de tinta (`rain` en la luz) en el motor y los 4 mundos; luz mezclada dentro de un plano (`light: [...]`).
- **Referencias 6 y 7** (nuestros shorts) y lecciones nuevas en `NOTES.md` y `STYLE_GUIDE.md`.

## Cambios en v3.1
Nuevas referencias 4 y 5 (hojas de contacto de dos videos) y su análisis en `STYLE_GUIDE.md`.

## Cambios en v3
GPU por defecto y modo borrador; `setup.sh` copia todas las herramientas e instala Playwright (sin enlaces simbólicos); Whisper multilingüe y sílabas en español;
`mix.py` con música ajustable (-9,5 dB por defecto); `audio.py` de los ejemplos solo escribe stems; `finish.sh` escala el borrador y combina con subtítulos; `check.py`.
