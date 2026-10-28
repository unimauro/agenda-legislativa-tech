# BACKLOG — Agenda Legislativa Tech Perú 2026–2031

Live: https://unimauro.github.io/agenda-legislativa-tech/ · Repo: unimauro/agenda-legislativa-tech (Pages desde `main`, sin build en CI).
**Leer primero:** SCHEMA.md (esquema + campos v2), COORDINACION.md (decisiones obligatorias y reparto de materias),
REVISION.md (protocolo de revisión). Regenerar: `.venv/bin/python scripts/build.py --con-revision` (venv: reportlab,
python-docx, requests; requiere `rsvg-convert`). Sin `--con-revision` no se muestran las revisiones; los ejes cuyas
propuestas no tienen `revision_atendida` NO se publican salvo `--borradores`.

## Hecho
- [x] v1 (22-oct-2026): 84 propuestas en 6 ejes, página + PDF + Word por propuesta, compendio PDF, antecedentes SPLEY,
  trámite bicameral, marco normativo, matriz Plan 2050, OG/favicon, apoyo (café/Yape/PayPal), GA4 G-YKRRVYDYQ8.
- [x] v2 (22-oct-2026): revisión de 5 especialidades (constitucional, jurista/técnica legislativa, derecho tecnológico,
  seguridad, concordancia normativa) en `data/revision/*_{A,B}.json` → 6 editores aplicaron correcciones a las 84 y
  agregaron `implicados`, `impacto`, `revision_atendida`. Criterio clave: STC 00018-2023-PI/TC (Sentencia 158/2026) —
  sin iniciativa de gasto del Congreso; no crear organismos (art. 28 LOPE).
- [x] "La ley en un vistazo" en cada página (mapa normas → ley → entidades por rol, ruta de implementación, balance
  costo/beneficio), buscador global, asistente ciudadano SIN IA (intención + buscador, en assets/app.js), sección
  «¿Quién hace qué?», matriz de revisión, comentarios ciudadanos con giscus + `scripts/build_comentarios.py` +
  Action `.github/workflows/comentarios.yml` (cada 6 h → data/comentarios.json → sección «Lo que dice la ciudadanía»).
- [x] Sidebar en páginas de propuesta (`con_sidebar()` en build.py): índice con scrollspy, propuestas por eje con filtro, panel plegable en móvil, barra de lectura, botón arriba.

- [x] v3 (22-oct-2026): sitio en 6 páginas (index, propuestas, vision, panorama, ciudadania, tramite) generadas por
  `scripts/paginas.py` (plantilla común); datos divididos (`data/indice.json` liviano, `texto.json` perezoso para el
  buscador, `actores.json`, `contexto.json`); `data/propuestas.json` queda solo como descarga. **Visión 2036**: 5 lentes
  prospectivos en `data/prioridad/<lente>.json` (protocolo PRIORIZACION.md) → `scripts/build_prioridad.py` →
  `data/prioridad.json` (score = promedio de percentiles, olas del lente de implementación, aristas habilita/requiere,
  30 vacíos). Esfera 3D en `assets/esfera.js` (canvas, sin librerías). **Propuestas ciudadanas**: formulario
  `.github/ISSUE_TEMPLATE/propuesta-ciudadana.yml` → etiquetas recibida/en-revision/publicada/incorporada/archivada →
  `scripts/build_ciudadanas.py` → `data/ciudadanas.json` (solo muestra las etiquetadas `publicada`). Action
  `participacion.yml` refresca comentarios + ciudadanas cada 6 h y ante eventos de issues.

- [x] v4 (22-oct-2026): participación sin cuenta vía **api.tunky.net/agenda/*** (solo Agenda Legislativa; tablas
  `agenda_propuestas`, `agenda_comentarios`, `agenda_votos` en api-tunky-db; IP solo como hash): proponer ley, votar
  👍/👎 por dispositivo, comentar; moderación en `admin.html` (token ADMIN_TOKEN en el cuerpo, sessionStorage). Front:
  `assets/participa.js`; si la API no responde, cae a GitHub (issues/giscus). Carga liviana: `data/home.json` (~12 KB)
  para portada/visión, `indice.json` perezoso para buscador/asistente, listado paginado (20), antecedentes perezosos.

- [x] v5 seguridad (22-oct-2026): foro propio (temas T-n + respuestas en hilo) y fuera giscus/issues/Action (todo en
  api.tunky.net). Pruebas adversariales a la API en vivo (CORS, SQLi, JSON roto, 200 KB, prototype pollution, rutas,
  honeypot) + auditoría del front (sin XSS explotable). Arreglos: panel de moderación movido a
  **https://api.tunky.net/agenda/admin** (CSP con nonce, frame-ancestors none, token solo en memoria), límite de intentos
  de admin, tope de 5 votos por red/propuesta, 413 limpio, ids validados, sal propia para hashes, vid hasheado, sin UA
  ni respaldos .jsonl, rechazo de DNI/teléfono/correo, CSP meta en todas las páginas, SRI de Chart.js, QR de Yape local,
  página de privacidad y GA4 solo con consentimiento.


### Hecho 25-oct-2026 — 28 leyes nuevas desde los 30 vacíos de la Visión 2036 (total 128)
- Vacíos depurados 30→28 (fusionados: AIR ×2 → GOB-15; acuerdos de economía digital + diplomacia → ECO-20). Encargo y brief en
  `data/nuevas/` (encargo.json, BRIEF.md, borradores por grupo A–E). Ids: SOB-09..13, CON-15, ECO-15..22, GOB-15..24, TAL-15/16, IA-15/16.
- Pipeline: 5 redactores → 5 revisores (`data/revision/*_D.json`, 388 hallazgos) → los redactores aplican (`revision_atendida`)
  → panel futurista puntúa en los 5 lentes (fórmula reproducida sin desvío) → `build_prioridad.py` marca `convertido_en` en vacíos.
- GOB-16 = Resolución Legislativa (modifica Reglamento del Congreso y de cada cámara); GOB-18 = ley orgánica (art. 13 LOPE).
- GOB-21, GOB-23 y SOB-11 REQUIEREN consulta previa (Convenio 169) antes del Pleno.

### Pendientes que dejó esta tanda
- [x] **Ley 32353 (27-05-2025)** (28-oct-2026): según su ficha técnica entra en vigencia al día siguiente de publicado su
      reglamento (no ubicado a oct-2026); recién entonces deroga la Ley 28015, el DL 1086 y la parte MYPE de la Ley 30056 y deja
      sin efecto el TUO D.S. 013-2013-PRODUCE. ECO-15/17, SOB-07 y TAL-02 remiten "al TUO o, desde su entrada en vigor, a la Ley
      32353". ECO-14 no cita esas normas. ECO-15 es el instrumento que integra el RER al RMT; ECP-23 de Agenda País depende de él.
- [ ] Vigilar la publicación del reglamento de la Ley 32353 y, cuando salga, retirar las remisiones al TUO.
- [ ] Verificar en SPIJ numeraciones marcadas "por verificar": literal nuevo art. 29.2 DL 1350 (TAL-15), literal art. 19 TUO CTS
      (TAL-16), art. 13 LOPE (GOB-18), art. 4 Ley 29029 (GOB-19), arts. 18/57/120/121 Ley 29338 (SOB-10), Leyes 28832 y 28749,
      arts. 15/20 Ley 29735 (GOB-23), nuevo artículo Ley 31335 (ECO-22), numeración del TUO 27444 (D.S. 006-2026-JUS).
- [ ] Fuentes oficiales faltantes: DL 1565, DS 023-2025-PCM, DS 021-2020-PCM (hoy copias secundarias); cifras FMI/OCDE de ECO-15;
      condición del Perú en la IEC (ECO-20); decisión UE de adecuación de Brasil (n.º no confirmado).
- [ ] Discutible: adelantar GOB-18 a la ola 2 (muy habilitadora, pero ley orgánica).

## SIGUIENTE (en orden)
000. [x] API v2 desplegada y re-probada (22-oct): 413, PII rechazada, ids/parent validados, cabeceras del panel, X-Forwarded-For no falsificable (429 al intento 11), El Loro intacto. Riesgo residual aceptado: inflar votos rotando el identificador de dispositivo (tope 5 por red y propuesta).
00. [x] **(HECHO 22-oct por Carlos, verificado: CORS, votos, admin 403, El Loro intacto)** DESPLEGAR el módulo en api.tunky.net (el clasificador bloqueó el deploy a producción desde la sesión):
    `bash deploy/api-tunky/deploy.sh` (respalda server.js, `node -c` antes de reconstruir, prueba /agenda/resumen).
    Código: `deploy/api-tunky/agenda.js` + `patch.py` (añade 2 líneas tras makeCounter en src/server.js).
    Hasta entonces el sitio funciona en modo GitHub (formulario de issues + giscus).
0. [ ] **Moderar propuestas ciudadanas**: revisar issues con etiqueta `recibida`; poner `en-revision`/`publicada`/
   `archivada`. Las que se incorporen: redactarlas como propuesta formal (SCHEMA v2) y pasarlas por REVISION.md.
0b. [ ] **Vacíos de la Visión 2036** (`data/prioridad.json` → vacios, 30): convertir los más votados por los lentes en
   nuevas propuestas (régimen tributario MYPE único, calidad regulatoria/AIR, energía para conectividad rural,
   flujos transfronterizos de datos/adecuación UE, Oficina de Evaluación Tecnológica del Congreso, etc.).
1. [x] **(HECHO 22-oct: 100 propuestas publicadas)** Ejes nuevos SOB (soberanía tecnológica e industria 4.0, 8) y DER (justicia y derechos digitales, 8)** →
   llegar a 100 propuestas. Los redactores ya escribieron (ambos borradores están en el repo) `data/propuestas/sober.json` y
   `data/propuestas/derechos.json` con campos v2 y `revision_atendida: []`. Falta: (a) revisión con las 5 especialidades
   siguiendo REVISION.md → `data/revision/<especialidad>_C.json`; (b) editor por eje que aplique hallazgos y llene
   `revision_atendida`; (c) agregar sus filas de reparto a COORDINACION.md si hay cruces; (d) build + push. Los ejes ya
   están registrados en `EJES` de scripts/build.py (colores #b45309 y #4f46e5). Actualizar textos "84" → total real
   donde esté fijo (index.html usa el total dinámico; README/portafolio dicen 84).
2. [x] ~~Instalar la app giscus~~ (descartado: foro propio en Tunky) (lo hace Carlos en github.com/apps/giscus → solo este repo). Sin eso no cargan los hilos.
3. [x] **Asistente con IA** LIVE (25-oct-2026): POST api.tunky.net/agenda/chat → ai.tunky.net (proyecto `agenda-tech`,
   token solo en servidor AGENDA_AI_TOKEN, modelo openai/gpt-oss-20b:free, 15 s + reintento 12 s). Recuperación top-5 desde
   indice.json con sinónimos cotidianos; guía de estilo cercana. Probado: tono humano 5–12 s, rechaza opinión partidaria y
   prompt injection, no inventa montos. Respaldo offline `responder()` en app.js. Ajuste que prohíbe decir "notas/ficha" redesplegado (28-oct).
4. [ ] **Diseño:** Carlos dice que la página "está un poquito fea". Mejorar la portada (hero con ilustración/mapa,
   tarjetas más visuales por eje, iconos por eje, menos texto denso), versión móvil del listado, y miniaturas del
   "mapa de la ley" en las tarjetas. Mantener mobile-first y modo claro/oscuro.
5. [ ] Enlace erróneo: `gob.pe/institucion/produce/normas-legales/235858-013-2013-produce` se cita como DS 013-2013-PRODUCE pero abre una resolución del Ministerio de Cultura (en: talento.json). Reemplazar por la URL correcta.
6. [ ] Verificaciones pendientes marcadas "por verificar"/"verificar en SPIJ" dentro de `efecto_vigencia` de varias
   propuestas (numeración libre de artículos incorporados; p. ej. LOPJ 184-A, Ley 26702 349-A/B, Ley 29904 2-A, TUO
   Telecom 61-A..C, Ley 26497 7-A/7-B; art. 200 CP vigente; cifra del padrón en IA-07).
7. [ ] Comentarios sin cuenta de GitHub (giscus exige login): formulario propio en VPS con rate-limit/moderación.
8. [ ] Revisión jurídica humana antes de llevar a despachos; seguimiento si un despacho presenta alguna (registrar n.º de PL real).
9. [ ] Cron de antecedentes 2026–2031 (scripts/build_antecedentes.py, ~3 min; la API SPLEY separa por `codTipoParl` D/S/C).
10. [ ] Versión en quechua del resumen de cada propuesta.
