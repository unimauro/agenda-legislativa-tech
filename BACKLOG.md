# BACKLOG — Agenda Legislativa Tech

## Hecho
- [x] v1 (2026-10-22): propuestas en 6 ejes, página + PDF por propuesta, compendio PDF, antecedentes SPLEY 2021–2026, trámite bicameral, marco normativo, matriz Plan 2050, OG/favicon, apoyo (café/Yape/PayPal).

## Pendiente
- [ ] **Asistente con IA (otra sesión):** dar de alta el proyecto `agenda-tech` en ai.tunky.net (token de cliente en CLIENT_TOKENS + persona en data/prompts.json + `docker compose up -d --force-recreate`, ver memoria project_ai_tunky_gateway) y conectar `preguntar()` de assets/app.js al gateway (POST /v1/chat con X-Client-Token, contexto = top-5 de `buscar()`), dejando el modo sin IA actual como respaldo. Persona: máx. 4 frases, solo las propuestas del contexto, citar códigos (IA-07), aclarar que son propuestas ciudadanas, sin opinar de partidos.
- [ ] **Comentarios sin cuenta de GitHub:** giscus exige login de GitHub; evaluar formulario sin login (backend en VPS con rate-limit y moderación) que escriba en las mismas Discussions o en una tabla propia.
- [ ] Instalar la app giscus en el repo (https://github.com/apps/giscus → solo agenda-legislativa-tech) — requisito para que carguen los hilos.
- [ ] Revisión jurídica por abogado/a de cada articulado antes de difundir a despachos.
- [ ] Seguimiento: si un despacho presenta una propuesta, registrar el número de PL real y su estado (SPLEY 2026).
- [ ] Refresco automático de antecedentes 2026–2031 (GitHub Action diaria, como congreso-abierto-peru).
- [ ] Exportar cada propuesta también a DOCX (formato de despacho editable).
- [ ] Formulario de adhesiones (firmas de respaldo ciudadano) — requiere backend.
- [ ] Versión en quechua del resumen de cada propuesta.
