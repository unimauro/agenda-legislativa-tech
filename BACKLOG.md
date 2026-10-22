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

## SIGUIENTE (en orden)
1. [ ] **Ejes nuevos SOB (soberanía tecnológica e industria 4.0, 8) y DER (justicia y derechos digitales, 8)** →
   llegar a 100 propuestas. Los redactores escribieron (o están escribiendo) `data/propuestas/sober.json` y
   `data/propuestas/derechos.json` con campos v2 y `revision_atendida: []`. Falta: (a) revisión con las 5 especialidades
   siguiendo REVISION.md → `data/revision/<especialidad>_C.json`; (b) editor por eje que aplique hallazgos y llene
   `revision_atendida`; (c) agregar sus filas de reparto a COORDINACION.md si hay cruces; (d) build + push. Los ejes ya
   están registrados en `EJES` de scripts/build.py (colores #b45309 y #4f46e5). Actualizar textos "84" → total real
   donde esté fijo (index.html usa el total dinámico; README/portafolio dicen 84).
2. [ ] **Instalar la app giscus** (lo hace Carlos en github.com/apps/giscus → solo este repo). Sin eso no cargan los hilos.
3. [ ] **Asistente con IA** (desde otra sesión; el clasificador de esta sesión bloqueó escribir el .env del gateway y
   meter token en el front): dar de alta el proyecto `agenda-tech` en ai.tunky.net (token cliente en CLIENT_TOKENS +
   persona en /opt/ai-tunky-gateway/data/prompts.json + `docker compose up -d --force-recreate`; ver memoria
   project_ai_tunky_gateway) y conectar `preguntar()` en assets/app.js: POST https://ai.tunky.net/v1/chat con header
   X-Client-Token, body {project:"agenda-tech", messages}; contexto = top-5 de `buscar()` con id, título, sumilla,
   entidades, costo, beneficio. Mantener `responder()` actual como respaldo si el gateway falla. Persona: máx. 4
   frases, solo propuestas del contexto, citar códigos (IA-07), aclarar que son propuestas ciudadanas, sin opinar de
   partidos/políticos, remitir a #tramite.
4. [ ] **Diseño:** Carlos dice que la página "está un poquito fea". Mejorar la portada (hero con ilustración/mapa,
   tarjetas más visuales por eje, iconos por eje, menos texto denso), versión móvil del listado, y miniaturas del
   "mapa de la ley" en las tarjetas. Mantener mobile-first y modo claro/oscuro.
5. [ ] Verificaciones pendientes marcadas "por verificar"/"verificar en SPIJ" dentro de `efecto_vigencia` de varias
   propuestas (numeración libre de artículos incorporados; p. ej. LOPJ 184-A, Ley 26702 349-A/B, Ley 29904 2-A, TUO
   Telecom 61-A..C, Ley 26497 7-A/7-B; art. 200 CP vigente; cifra del padrón en IA-07).
6. [ ] Comentarios sin cuenta de GitHub (giscus exige login): formulario propio en VPS con rate-limit/moderación.
7. [ ] Revisión jurídica humana antes de llevar a despachos; seguimiento si un despacho presenta alguna (registrar n.º de PL real).
8. [ ] Cron de antecedentes 2026–2031 (scripts/build_antecedentes.py, ~3 min; la API SPLEY separa por `codTipoParl` D/S/C).
9. [ ] Versión en quechua del resumen de cada propuesta.
