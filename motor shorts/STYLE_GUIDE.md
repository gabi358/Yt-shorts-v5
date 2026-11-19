> **HISTÓRICO (v3.1).** La norma vigente es `DIRECTOR.md`; donde se contradigan (ritmo de cortes, subtítulos "siempre") manda `DIRECTOR.md`.

# Guía de estilo (v3.1) — sacada de 5 shorts de referencia del usuario
Referencias en `references/` (1 foto cada 2 s). El usuario dice que uno de ellos hizo 3x las visitas que sus 2D completos en 9 min (dato suyo, sin verificar).

## Lo que tienen en común
1. **Subtítulos palabra por palabra siempre**: 1-2 palabras grandes, blanco bold con contorno negro grueso, en el tercio inferior (~70 % de la altura), sin fondo. Generador: `tools/captions.py` + `CAPTIONS=1 bash tools/finish.sh`.
2. **Un plano nuevo cada ~2 s** (composición distinta, no solo zoom): el ritmo es mucho más alto que nuestro corto de la Torre Eiffel (planos de 3-5 s).
3. **Personajes = mismos muñecos de cabeza de judía** con contorno oscuro; accesorios y trajes marcan el rol (gorra, sombrero de sheriff con gafas, gorro de cocinero, tricornio, pañuelo pirata).
4. **Mundo 3D con luz muy trabajada**: cielo con degradado y nubes, sol con rayos (god rays), niebla de atmósfera, profundidad de campo, cambio día/noche/tormenta, rayos y lluvia, iluminación cálida interior.
5. **Utilería grande y legible** como protagonista: coches, barco pirata, barriles, gallinas con cara, gallinero, pizarra con esquema, cartel de neón, olla, plato de caldo.
6. **Planos de inserto**: primer plano de objeto clave (olla, plato, volante, mano gigante del cielo), plano subjetivo (cabina del coche con el volante), vista cenital, plano contrapicado de ola.
7. **Diagramas en pantalla** (pizarra: RICH/POOR, 2=huevo, 3=pollitos) para explicar la mecánica.
8. **Escala y escenas multitudinarias** (docenas de barriles, gallineros, gallinas) que dan sensación de mundo.
9. **Transiciones de luz/clima como giro**: soleado -> tormenta -> brillo, para marcar el pivote.

## Qué hace nuestro motor hoy y qué falta
- Ya: muñecos, calles/edificios/torres, interiores, humo/destellos, tinta, DOF, cámaras suaves, sonido sintetizado.
- Falta (por orden de impacto): **subtítulos** (hecho en v2.1), **ritmo de planos 2 s**, **utilería de vehículos y barcos**, **animales con cara** (gallina, oso, cerdo), **rayos de luz (god rays)**, **lluvia/tormenta/rayos**, **olas y mar con espuma**, **pizarra con diagramas animados**, **planos POV/cabina**, **cambio de clima en un plano**.

## Reglas para el siguiente short (con este estilo)
- Guion con gancho de paradoja y giro final, planeado a **1 plano cada 4-6 palabras** (cada ~2 s).
- Cada frase lleva un objeto-gag visible. Cada 3-4 planos, un inserto de objeto o un plano extremo.
- Subir el contraste de luz: usar `gold`/tormenta en el pivote, noche azul en la explicación.
- No copiar planos ni gags de estas referencias; usarlas como técnica.

## Referencias 4 y 5 (añadidas en v3.1)
Hojas de contacto con 1 fotograma cada 2 s: `references/ref4_boton_rojo_pueblo_cupula.jpg` (video de 65 s, 33 fotogramas) y
`references/ref5_banco_auditoria_numeros.jpg` (47 s, 24 fotogramas). Leer la hoja en orden: izquierda a derecha, arriba a abajo; la palabra de cada
fotograma es el subtítulo que se veía en ese momento.

**Ref 4 (pueblo con un botón rojo bajo una cúpula de cristal):**
- Un **objeto único como protagonista** (botón rojo en un pedestal dorado) que reaparece en casi todos los planos: grande, de cerca, o minúsculo desde arriba.
- **Cambios de escala extremos**: vista cenital de todo el pueblo, plano a ras de suelo de una multitud de cientos de muñecos, primer plano del botón, plano vertical de una escalera interminable.
- **Multitudes** (decenas a cientos de muñecos con ropa distinta) apiladas en profundidad sobre césped llano; un solo protagonista de color vivo (camiseta roja) que destaca.
- **Utilería con información**: cronómetro con contador digital (47, 48...) que mide el tiempo, cúpula de cristal con reflejos, anillo de fuego (eclipse) en el cielo como giro.
- **Ciclo de luz muy marcado**: día azul claro -> noche azul con ventanas encendidas -> amanecer anaranjado. Interior de madera cálido con una sola ventana azul.
- Un pueblo circular de casitas azules y calles concéntricas: un único decorado grande reutilizado en muchos ángulos.

**Ref 5 (banco, auditoría y números):**
- **Un decorado por idea**: mostrador de banco con cheques, ascensor de cristal con dos muñecos, rascacielos con números por pisos, despacho de auditoría, celda con barrotes.
- **Números y datos como protagonistas visuales**: cifras gigantes flotando sobre la ciudad al atardecer, panel de botones con luces de colores que se encienden una a una, cuadrícula de monedas con una fila resaltada por un puntero, pilas de monedas.
- **Lupa y puntero** como accesorios recurrentes para pasar de la explicación al detalle; cada muñeco con rol claro (chaqueta amarilla con corbata = empleado, gafas y moño = auditora, gorra azul = policía).
- **Paleta cálida de atardecer** (rosa, naranja, turquesa) en casi todo el video, con un cierre en barrotes oscuros.
- **Planos casi verticales**: el muñeco ocupa 2/3 de la altura y el fondo se desenfoca; los cambios entre interiores son cortes limpios.

**Qué copiar como técnica (no como plano):** objeto-ancla que reaparece, escala extrema (cenital <-> primer plano), multitudes en profundidad, accesorios que explican
(cronómetro, lupa, puntero, panel de luces), un decorado grande con muchos ángulos y una paleta de luz por bloque del guion.
**Qué falta aún en el motor para igualarlo:** multitudes de cientos, cristal con reflejos, anillo de fuego/eclipse, contador digital animado, cuadrícula de monedas, ascensor de cristal, barrotes.


## Referencias 6 y 7 (nuestros propios shorts, añadidos en v3.2)
Hojas de contacto con 1 fotograma cada 2 s, con subtítulos: `references/ref6_emus_desierto_camion.jpg` (La guerra de los emús, 44 s) y
`references/ref7_cerdo_isla_barcos.jpg` (La guerra del cerdo, 55 s). Son hechos con este mismo motor: sirven de **vara de medir** (qué se puede conseguir) y de
punto de partida (`worlds/outback`, `worlds/island`, `example/emu`, `example/pig`).

**Qué enseñan:**
- Un **animal protagonista con cara** (emú, cerdo) como tarjeta 2D: expresiones (comer, sonreír con picardía, asustado, mareado, muerto con halo y alas) y accesorios (corona, casco, banda).
- **Mundos de un solo escenario grande** que se reutilizan en 26-35 planos: isla (mar, tiendas, cañones, barcos de guerra, bloques de soldados) y desierto (trigo, camión, manada de 200 emús, ejército de emús con casco).
- **Escala extrema** barata: bloques de geometría fusionada (64, 420 soldados; 200 emús) vistos desde arriba, y luego el mismo mundo con 2-3 tarjetas en primer plano.
- **Clima y hora como narración**: tormenta con lluvia sobre los barcos, día -> atardecer -> noche -> amanecer durante "doce años" (luz mezclada dentro de un plano), amanecer cálido para "Al final", luz brillante para el giro.
- **Cartel de madera con texto** (`fxBoard`: "1859", "12 AÑOS", "1932", "PREMIO") como ancla de fecha/dato; cruz de tumba con placa de cerdo para el giro final.
- **Giro final visual**: el protagonista que nadie esperaba (cerdo con halo y alas, emú con corona) justo en la última palabra, con destello y golpe de sonido.

**Lo que falta aún:** multitudes de tarjetas (solo hay geometría fusionada), animales de perfil, mar con espuma, humo de cañones en 3D, soldados que marchan de lado.
