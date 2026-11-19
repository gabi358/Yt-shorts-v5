# Motor v5 — render de calidad "referencia"

Qué cambia respecto a v4 (se renderiza con tu programa; yo solo entrego el zip):
- Pipeline nuevo: `engine/core.js` + `worlds/<mundo>/world.js` + `story.js`. Luz real (hemisférica + sol/luna con sombras + 6 luces prácticas con parpadeo), cielo con estrellas/nubes/luna, bloom, rayos de luz, ACES, gradación, DOF, grano.
- Personajes iluminados por el entorno (rim del fuego, niebla, luces cercanas).
- `engine/fx.js`: partículas deterministas (spark, ember, fire, smoke, dust, puff, flash, confetti, rainsplash) y rayos 3D. En el story: `FX_EVENTS` y `LIGHTNING`.
- `engine/builders.js` (`kit`): terreno, hierba con viento, pinos/árboles, montañas, muralla, torre, puerta, casa, tienda, barril, caja, mesa, alfombra, carro, valla, estandarte, hoguera, linterna, antorcha, haz de luz y multitud (`kit.crowd`).
- Mundo de ejemplo `worlds/campamento` y story demo `example/campamento` (7 planos: noche, retrato, columna, interior de tienda, día, atardecer, tormenta).
- Campos de luz nuevos en `LIGHTS`: hemi, sunI, glow, stars, clouds, practical, windows, bloom, rays, exposure, cardLit, cardRim, rain...
- Cámara v4 (creep por plano, orbit/subjectShot/groupShot/keysFromShots) sin cambios.

Uso: `bash tools/setup.sh <carpeta> campamento` y edita `story.js`. Los ejemplos antiguos (bridge, paris, island, outback) siguen en modo legacy.
Consejos: noche → hemi ≥1.0 y exposure ~1.3; apunta la cámara con `orbit` a 12–18 m desde un lado, no a través de tiendas.
Límites conocidos: la multitud es de cartulinas (usa >1.1 de escala y planos medios); el mundo nuevo es solo el campamento, para otro escenario hay que escribir un `world.js` con el `kit`.
