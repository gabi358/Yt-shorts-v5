#!/usr/bin/env bash
# Creates a new short project:  bash tools/setup.sh <project_dir> [campamento|soldier|eiffel|pig|emu]
# campamento = motor v5 (core.js + world.js + builders: luces prácticas, hierba densa, multitudes, bloom, rayos). Los demás = motor v4 monolítico (legado).
# soldier = Roman bridge, eiffel = Paris 1925, pig = San Juan island 1859 (sea, tents, ships, troops), emu = Australian outback 1932 (wheat, truck, herd) (both are starting points: rewrite story.js, audio.py and the world block).
# Needs: Node >= 22.13, python3 + numpy + pillow, ffmpeg. Check everything first with:  python tools/check.py
set -e
KIT="$(cd "$(dirname "$0")/.." && pwd)"; P="${1:?uso: bash tools/setup.sh <carpeta_proyecto> [soldier|eiffel|pig|emu]}"; EX="${2:-campamento}"
[ -d "$KIT/example/$EX" ] || { echo "ejemplo desconocido: $EX (usa soldier, eiffel, pig o emu)"; exit 1; }
WORLD=bridge; case "$EX" in eiffel) WORLD=paris;; pig) WORLD=island;; emu) WORLD=outback;; esac
mkdir -p "$P/web/lib" "$P/work" "$P/stills" "$P/out" "$P/frames"
cp "$KIT"/engine/*.js "$KIT"/engine/index.html "$P/web/"
if [ -f "$KIT/worlds/$EX/world.js" ]; then cp "$KIT/worlds/$EX/world.js" "$P/web/world.js"; echo "import './core.js';" > "$P/web/main.js"; rm -f "$P/web/roman_unused.js"; else cp "$KIT/worlds/$WORLD/main.js" "$P/web/main.js"; fi   # v5: core.js + world.js  |  legado: monolito
cp "$KIT/example/$EX/story.js" "$P/web/story.js"           # starting point: rewrite for the new story
cp "$KIT/example/$EX/audio.py" "$P/audio.py"               # starting point: rewrite the cue table
cp "$KIT"/vendor/three.module.js "$P/web/lib/"
# all tools go to the project root, so you run everything from there:  bash finish.sh, python mix.py, node render.mjs ...
cp "$KIT"/tools/*.py "$KIT"/tools/*.mjs "$KIT"/tools/*.sh "$P/"
rm -f "$P/setup.sh"
cp "$KIT/package.json" "$KIT/requirements.txt" "$P/"
# toon base: the Pen / head / face library (types stripped with Node's built-in stripper)
node -e "const m=require('node:module'),fs=require('fs');fs.writeFileSync(process.argv[1],m.stripTypeScriptTypes(fs.readFileSync(process.argv[2],'utf8'),{mode:'transform'}))" "$P/web/toonbase.js" "$KIT/vendor/toon.ts" \
  || { echo "ERROR: tu Node no tiene module.stripTypeScriptTypes (hace falta Node 22.13 o superior). Actualiza Node y repite."; exit 1; }
cat "$P/web/toonbase.js" "$P/web/roman.js" > "$P/web/toon.js"
# playwright for render.mjs (needs internet once)
if [ ! -d "$P/node_modules/playwright" ]; then
  ( cd "$P" && npm install --no-audit --no-fund >/dev/null 2>&1 && npx playwright install chromium >/dev/null 2>&1 ) \
    && echo "playwright instalado" \
    || echo "AVISO: no pude instalar playwright. En $P ejecuta:  npm install  y  npx playwright install chromium   (o usa render.py con pip install playwright)"
fi
echo "listo: $P"
echo "  siguiente: cd $P && python timing.py voice.mp3 script.txt --out work"
echo "  (si editas el reparto: cat web/toonbase.js web/roman.js > web/toon.js)"
