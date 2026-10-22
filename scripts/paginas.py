"""Páginas del sitio (plantilla común). Cada página carga solo los datos que necesita (ver assets/app.js)."""

BASE = "https://unimauro.github.io/agenda-legislativa-tech/"
GA = '<script src="assets/consent.js"></script>'
CSP = """<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com; connect-src 'self' https://api.tunky.net https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'">"""

NAV = [("index", "index.html", "Inicio"), ("propuestas", "propuestas.html", "Propuestas"), ("vision", "vision.html", "Visión 2036"),
       ("panorama", "panorama.html", "Panorama"), ("ciudadania", "ciudadania.html", "Ciudadanía"), ("foro", "foro.html", "Foro"), ("tramite", "tramite.html", "Cómo se tramita")]

RELACIONADOS = [
    ("https://planperu2050.pe/", "🇵🇪 Plan Perú 2050", "Comisiones, indicadores y metas del CNPP / CIP."),
    ("https://unimauro.github.io/congreso-abierto-peru/", "🏛️ Congreso Abierto", "Proyectos de ley, comisiones y presupuesto del Congreso."),
    ("https://unimauro.github.io/peru-transparente/", "🔎 Perú Transparente", "Servidores, contratos, sanciones y DJ."),
    ("https://cheka.app", "✅ Cheka", "Consulta a funcionarios y su trayectoria."),
    ("https://unimauro.github.io/observatorio-idoneidad-estado/", "🎯 Idoneidad en el Estado", "Índice de idoneidad de altos cargos."),
    ("https://unimauro.github.io/productividad/", "⏱️ Productividad", "Horas trabajadas, PIB por hora e informalidad."),
    ("https://unimauro.github.io/educacion-peru/", "🎒 Educación Perú", "Aprendizajes por región."),
    ("https://unimauro.github.io/universidades-peru/", "🎓 Universidades Perú", "95 universidades en cifras."),
    ("https://unimauro.github.io/observatorio-ambiental-peruano/", "🌳 Observatorio Ambiental", "Incendios y deforestación casi en tiempo real."),
    ("https://unimauro.github.io/", "🧭 Todos los proyectos", "Portafolio de @unimauro."),
]


def shell(page, titulo, desc, cuerpo, scripts=""):
    nav = "".join(f'<a href="{href}"{" class=on aria-current=page" if k == page else ""}>{txt}</a>' for k, href, txt in NAV)
    canon = BASE + ("" if page == "index" else f"{page}.html")
    rel = "".join(f'<a href="{u}" target="_blank" rel="noopener"><b>{t}</b><span>{d}</span></a>' for u, t, d in RELACIONADOS)
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
{CSP}
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>{titulo}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canon}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Agenda Legislativa Tech Perú">
<meta property="og:title" content="{titulo}"><meta property="og:description" content="{desc}">
<meta property="og:url" content="{canon}"><meta property="og:image" content="{BASE}og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale" content="es_PE">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{BASE}og.png">
<meta name="theme-color" content="#c8102e">
<link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="icon" href="favicon.png" sizes="64x64" type="image/png"><link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
<script>try{{const t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}}catch(_){{}}</script>
{GA}
</head>
<body data-page="{page}">
<header class="top">
  <a class="brand" href="index.html">⚖️ Agenda Legislativa Tech</a>
  <nav class="nav" id="nav">{nav}</nav>
  <span class="spacer"></span>
  <button class="ghost nav-toggle" id="nav-btn" aria-expanded="false" aria-controls="nav-m">☰</button>
  <button class="ghost" id="theme" aria-label="Cambiar tema claro/oscuro">◐</button>
</header>
<nav class="nav-m" id="nav-m" hidden>{nav}</nav>
<main class="wrap">
{cuerpo}
  <section class="block" id="apoyo">
    <h2>Apoya y difunde</h2>
    <p class="sub">Hecho por <b><a href="https://unimauro.github.io/">Carlos Cárdenas Fernández</a></b> (<a href="https://github.com/unimauro">@unimauro</a>).
      Código y datos abiertos en <a href="https://github.com/unimauro/agenda-legislativa-tech">GitHub</a>. Si te sirve, invítame un café:</p>
    <div class="support">
      <a class="s-coffee" href="https://buymeacoffee.com/unimauro" target="_blank" rel="noopener">☕ Invítame un café</a>
      <button class="s-yape" id="yape-btn" aria-expanded="false" aria-controls="yape-box">💜 Yápeame</button>
      <a class="s-paypal" href="https://paypal.me/unimauro" target="_blank" rel="noopener">🅿️ PayPal</a>
    </div>
    <div class="yape-inline" id="yape-box"><b>Yape · Carlos Cárdenas Fernández</b><br>
      <img src="assets/yape.png" alt="Código QR de Yape" loading="lazy" onerror="this.style.display='none'"></div>
    <div class="share">
      <a id="sh-x" target="_blank" rel="noopener">𝕏 Twitter/X</a><a id="sh-wa" target="_blank" rel="noopener">🟢 WhatsApp</a>
      <a id="sh-in" target="_blank" rel="noopener">💼 LinkedIn</a><a id="sh-fb" target="_blank" rel="noopener">📘 Facebook</a>
      <button id="sh-copy">🔗 Copiar enlace</button>
    </div>
    <details class="rel-wrap"><summary>Proyectos relacionados</summary><div class="related">{rel}</div></details>
  </section>
  <footer>
    <p><b>Nota.</b> Son <b>propuestas ciudadanas</b> de libre uso (CC BY 4.0): no son proyectos de ley presentados ni tienen
      número en el Congreso. Las cifras citan su fuente y las estimaciones lo dicen. Actualizado: <span id="upd">—</span>. <a href="privacidad.html">Privacidad</a>.</p>
  </footer>
</main>
<button class="chat-fab" id="chat-fab" aria-expanded="false" aria-controls="chat">💬 Pregúntale a la agenda</button>
<aside class="chat" id="chat" hidden aria-label="Asistente ciudadano">
  <header><b>🤖 Asistente ciudadano</b><span class="muted">Responde con las propuestas de esta agenda</span><button class="ghost" id="chat-x" aria-label="Cerrar">✕</button></header>
  <div class="chat-log" id="chat-log" aria-live="polite">
    <div class="msg bot">¡Hola! 👋 Soy el asistente de la agenda. Cuéntame qué te preocupa —las estafas por celular, el internet en tu pueblo, los empleos con IA— y te explico qué ley lo atiende, a quién ayuda y cuánto costaría. Son <b>propuestas ciudadanas</b>, no leyes vigentes.</div>
    <div class="chips sug" id="chat-sug">
      <button class="chip">¿Qué proponen contra el robo de celulares y las estafas?</button>
      <button class="chip">¿Qué propuestas no le cuestan nada al Estado?</button>
      <button class="chip">¿Cuáles son las más urgentes para crecer?</button>
      <button class="chip">¿Cómo propongo una ley?</button>
    </div>
  </div>
  <form id="chat-f"><input id="chat-q" placeholder="Escribe tu pregunta…" maxlength="400" autocomplete="off" aria-label="Tu pregunta"><button class="btn" type="submit">Enviar</button></form>
  <p class="chat-note">Responde con IA usando solo las propuestas de esta agenda; puede equivocarse. No es asesoría legal.</p>
</aside>
{scripts}<script src="assets/participa.js"></script>
<script src="assets/app.js"></script>
</body>
</html>
"""


CHART = '<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js" integrity="sha384-bs/nf9FbdNouRbMiFcrcZfLXYPKiPaGVGplVbv7dLGECccEXDW+S3zjqSKR5ZEaD" crossorigin="anonymous" referrerpolicy="no-referrer"></script>\n'
ESFERA = '<script src="assets/esfera.js"></script>\n'


def generar(root, total):
    paginas = {
        "index": ("Agenda Legislativa Tech Perú 2026–2031",
                  f"{total} propuestas de ley en tecnología, redactadas, revisadas y listas para comisión, priorizadas para que el Perú lidere el crecimiento al 2036.",
                  f"""  <section class="hero" id="inicio">
    <div class="hero-grid">
      <div>
        <div class="kicker">Congreso 2026–2031 · Propuestas ciudadanas</div>
        <h1>¿Dónde están <s>las 50 propuestas</s>?<br>Aquí hay <em id="h-total">{total}</em>, redactadas.</h1>
        <p class="lead">Proyectos de ley en tecnología con articulado, costo-beneficio, quién hace qué y fuentes; revisados por
          cinco especialidades y ordenados por una visión: que el Perú <b>lidere el crecimiento</b> al 2036.</p>
        <div class="actions">
          <a class="btn" href="propuestas.html">Ver propuestas</a>
          <a class="btn ghost" href="vision.html">🌐 Visión 2036</a>
          <a class="btn ghost" href="ciudadania.html">🗳️ Propón una ley</a>
        </div>
      </div>
      <a class="hero-sphere" href="vision.html" aria-label="Ver la esfera de la visión"><canvas id="esfera-mini"></canvas><span>Explora la visión →</span></a>
    </div>
    <div class="gsearch">
      <input id="gq" type="search" placeholder="🔎 Busca en todas las propuestas: artículos, entidades, normas… (ej. «celulares robados», «SUNAT», «quechua»)" aria-label="Buscar en todas las propuestas" autocomplete="off">
      <div id="gres" class="gres" hidden></div>
    </div>
    <div class="kpis" id="kpis"></div>
  </section>
  <section class="block">
    <h2>Ejes para un país que lidera</h2>
    <p class="sub">Elige un eje para ver sus propuestas.</p>
    <div class="ejes-grid" id="ejes-grid"></div>
  </section>
  <section class="block" id="top">
    <h2>Primera ola: lo más urgente</h2>
    <p class="sub" id="top-sub">Las propuestas que el panel prospectivo recomienda empujar primero.</p>
    <div class="top-list" id="top-list"></div>
    <p><a class="btn ghost" href="vision.html">Ver la priorización completa →</a></p>
  </section>
""", ESFERA),
        "propuestas": ("Propuestas · Agenda Legislativa Tech Perú",
                       "Explora y filtra las propuestas de ley tech por eje, comisión, prioridad y costo fiscal. PDF y Word de cada una.",
                       """  <section class="block first" id="propuestas">
    <h1 class="page-h">Las propuestas</h1>
    <p class="sub">Filtra por eje, comisión, prioridad o costo fiscal. Abre una para ver su resumen; cada una tiene su página completa, PDF y Word.
      <a href="pdf/agenda-legislativa-tech-completa.pdf" download>⬇️ PDF completo</a> · <a href="data/propuestas.json">{ } Datos abiertos</a></p>
    <div class="eje-pills" id="eje-pills"></div>
    <div class="filters">
      <input id="q" type="search" placeholder="Buscar: deepfakes, 5G, startups, ransomware, quechua…" aria-label="Buscar">
      <select id="f-com" aria-label="Comisión"><option value="">Toda comisión (Diputados)</option></select>
      <select id="f-prio" aria-label="Prioridad"><option value="">Toda prioridad</option><option value="alta">Alta</option><option value="media">Media</option></select>
      <select id="f-costo" aria-label="Costo fiscal"><option value="">Todo costo</option><option value="nulo">Costo nulo</option><option value="bajo">Bajo</option><option value="medio">Medio</option></select>
      <select id="f-orden" aria-label="Ordenar"><option value="">Orden: por eje</option><option value="score">Orden: prioridad Visión 2036</option></select>
    </div>
    <p class="count" id="count"></p>
    <div class="plist" id="plist"></div>
  </section>
""", ""),
        "vision": ("Visión Perú 2036 · Agenda Legislativa Tech",
                   "Priorización prospectiva de las propuestas de ley tech para que el Perú lidere el crecimiento del PBI al 2036: esfera de la visión, olas y vacíos.",
                   """  <section class="block first" id="vision">
    <h1 class="page-h">Visión Perú 2036</h1>
    <p class="sub">Meta: que el Perú <b>lidere el crecimiento</b> entre las economías emergentes y avance hacia el <b>ingreso alto</b>,
      con inclusión territorial. Dos precisiones honestas: liderar el PBI <i>mundial</i> no es alcanzable en 10 años (el Perú es ~0,3 %
      de la economía mundial), y duplicar el PBI per cápita al 2036 exigiría crecer ~8 % al año; el panel propone como meta exigente
      pero realista un <b>5–6 % sostenido</b>, el doble del ~3 % proyectado. Cinco lentes prospectivos puntuaron cada propuesta.</p>
    <div class="esfera-wrap"><canvas id="esfera"></canvas>
      <div class="esfera-ui"><div id="esfera-leyenda" class="esfera-leyenda"></div>
        <div class="esfera-ctrl"><button class="chip" id="es-pausa">⏸ Pausar</button><select id="es-ola" aria-label="Filtrar por ola"><option value="">Todas las olas</option></select></div></div>
      <div class="esfera-tip" id="esfera-tip" hidden></div></div>
    <p class="muted" style="font-size:13px">Cada punto es una propuesta (color = eje, tamaño = prioridad). Las líneas unen propuestas que se habilitan entre sí.
      Arrastra para girar; toca un punto para verlo y vuelve a tocar para abrirlo.</p>
  </section>
  <section class="block" id="olas"><h2>Las olas de implementación</h2><p class="sub" id="olas-sub"></p><div class="lanes olas" id="olas-grid"></div></section>
  <section class="block" id="ranking"><h2>Ranking por lente</h2><p class="sub">Puntaje 0–100 por cada lente y el consolidado.</p><div class="card tbl-scroll" id="rank-tbl"></div></section>
  <section class="block" id="tesis"><h2>Qué dice cada lente</h2><div class="tesis-grid" id="tesis-grid"></div></section>
  <section class="block" id="vacios"><h2>Lo que falta: leyes que la visión necesita</h2><p class="sub">Vacíos detectados por el panel; candidatos a nuevas propuestas.</p><div id="vacios-list"></div></section>
""", ESFERA),
        "panorama": ("Panorama · Agenda Legislativa Tech Perú",
                     "Gráficos, quién hace qué, revisión especializada y alineamiento con el Plan Perú 2050 de las propuestas de ley tech.",
                     """  <section class="block first" id="panorama">
    <h1 class="page-h">Panorama</h1>
    <p class="sub">Cómo se reparte la agenda. El Congreso no tiene iniciativa de gasto (art. 79; STC 00018-2023-PI/TC), por eso la mayoría está diseñada a costo nulo o bajo.</p>
    <div class="grid2">
      <div class="card"><h3>Propuestas por eje</h3><div class="chart-box"><canvas id="ch-eje"></canvas></div></div>
      <div class="card"><h3>Comisión dictaminadora (Diputados)</h3><div class="chart-box"><canvas id="ch-com"></canvas></div></div>
      <div class="card"><h3>Tipo de impacto económico</h3><div class="chart-box"><canvas id="ch-imp"></canvas></div></div>
      <div class="card"><h3>Entidades más implicadas</h3><div class="chart-box"><canvas id="ch-ent"></canvas></div></div>
      <div class="card"><h3>Prioridad × costo fiscal</h3><div class="matrix-wrap" id="m-prio"></div></div>
      <div class="card"><h3>Objetivos de Desarrollo Sostenible</h3><div class="chart-box"><canvas id="ch-ods"></canvas></div></div>
    </div>
  </section>
  <section class="block" id="actores">
    <h2>¿Quién hace qué?</h2>
    <p class="sub">Busca una entidad para ver todo lo que esta agenda le encargaría.</p>
    <input id="eq" type="search" placeholder="Buscar entidad: OSIPTEL, MINEDU, SBS, RENIEC, municipalidades…" aria-label="Buscar entidad" class="search-wide">
    <div class="card" style="margin-top:10px"><div class="tbl-scroll" id="ent-tbl"></div></div>
  </section>
  <section class="block" id="revision">
    <h2>Revisión especializada</h2>
    <p class="sub">Cinco revisiones asistidas por IA (constitucional, técnica legislativa, derecho tecnológico, seguridad, concordancia normativa) y luego corrección. No reemplaza la revisión de un abogado ni el dictamen de comisión.</p>
    <div class="card matrix-wrap" id="m-rev"></div>
  </section>
  <section class="block" id="plan2050">
    <h2>Alineamiento con el Plan Perú 2050</h2>
    <p class="sub">Ejes de esta agenda × comisiones temáticas del Plan Perú 2050 (CNPP / CIP).</p>
    <div class="card matrix-wrap" id="m-plan"></div>
  </section>
""", CHART),
        "ciudadania": ("Ciudadanía · Propón una ley · Agenda Legislativa Tech",
                       "Propón tu propia ley tech, apoya o rechaza las propuestas y comenta. Sin cuenta, todo queda registrado y público.",
                       """  <section class="block first" id="proponer">
    <h1 class="page-h">Propón una ley</h1>
    <div class="cta-card">
      <form id="prop-f" class="prop-f" hidden>
        <h2>Tu idea puede ser la próxima propuesta</h2>
        <label>Título de la ley *<input name="titulo" required minlength="10" maxlength="220" placeholder="Ley que garantiza internet gratuito en las bibliotecas municipales"></label>
        <label>Eje temático<select name="eje"><option>Inteligencia artificial y datos</option><option>Ciberseguridad e identidad digital</option><option>Gobierno digital y transparencia</option>
          <option>Conectividad, telecom y espacio</option><option>Economía digital, startups y CTI</option><option>Talento, educación y tech sectorial</option>
          <option>Soberanía tecnológica e industria 4.0</option><option>Justicia y derechos digitales</option><option>Otro</option></select></label>
        <label>¿Qué problema resuelve? *<textarea name="problema" required minlength="20" maxlength="2500" rows="4" placeholder="Describe el problema; si tienes datos, menciona la fuente."></textarea></label>
        <label>¿Qué propones? *<textarea name="propuesta" required minlength="20" maxlength="3500" rows="5" placeholder="La idea central o, si puedes, los artículos."></textarea></label>
        <label>¿A quién beneficia?<textarea name="beneficiarios" maxlength="800" rows="2"></textarea></label>
        <div class="f2"><label>¿Qué entidades la implementarían?<input name="entidades" maxlength="400" placeholder="MTC, MINEDU, municipalidades…"></label>
          <label>¿Le costaría dinero al Estado?<select name="costo"><option>No / casi nada</option><option>Poco (presupuesto actual)</option><option>Bastante (presupuesto nuevo)</option><option>No sé</option></select></label></div>
        <div class="f2"><label>Región<input name="region" maxlength="40" placeholder="Cusco"></label><label>Nombre o seudónimo (opcional)<input name="autor" maxlength="80"></label></div>
        <input name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
        <label class="chk"><input type="checkbox" name="acepto" required> Acepto que se publique con licencia CC BY 4.0 y no incluye datos personales de terceros.</label>
        <div class="com-acts"><button class="btn" type="submit">🗳️ Enviar propuesta</button><span class="muted" id="prop-msg" aria-live="polite"></span></div>
        <p class="muted com-legal">Se registra con fecha y pasa por revisión (constitucional, técnica, costo para el Estado). Solo se publica tras la revisión. No necesitas cuenta.</p>
      </form>
      <div id="prop-off" hidden><h2>Formulario temporalmente no disponible</h2><p>No pudimos conectar con el servidor. Intenta en unos minutos.</p></div>
      <div><div class="kpis" id="cd-kpis"></div>
        <ol class="mini-steps"><li><b>Recibida</b> — queda registrada con fecha.</li><li><b>En revisión</b> — se evalúa viabilidad y duplicidad.</li>
          <li><b>Publicada</b> — aparece aquí para recibir apoyo.</li><li><b>Incorporada</b> — se redacta como propuesta formal con articulado.</li></ol>
</div>
    </div>
  </section>
  <section class="block" id="ciudadanas"><h2>Propuestas de la ciudadanía</h2><p class="sub">Solo se muestran las aprobadas tras revisión. Apoya las que te convenzan.</p><div id="cd-list"></div></section>
  <section class="block" id="ciudadania">
    <h2>Lo que dice la ciudadanía</h2>
    <p class="sub">Apoyos (👍), rechazos (👎) y comentarios en cada propuesta de la agenda, en tiempo real.</p>
    <div class="grid2"><div class="card"><h3>Más apoyadas y comentadas</h3><div class="tbl-scroll" id="cm-rank"></div></div>
      <div class="card"><h3>Comentarios recientes</h3><div class="tbl-scroll" id="cm-feed"></div></div></div>
  </section>
""", ""),
        "foro": ("Foro ciudadano · Agenda Legislativa Tech Perú",
                 "Foro abierto para debatir la agenda legislativa tech: ideas de nuevas leyes, dudas, debate y miradas desde las regiones. Sin cuenta.",
                 """  <section class="block first" id="foro">
    <h1 class="page-h">Foro ciudadano</h1>
    <p class="sub">Debate la agenda, propone ideas, pregunta. Cada tema tiene votos y respuestas en hilo. Para comentar una ley concreta, entra a su página;
      para proponer una ley formal, usa <a href="ciudadania.html">Propón una ley</a>.</p>
    <div class="eje-pills" id="foro-cats"></div>
    <div class="foro-top"><button class="btn" id="foro-nuevo-btn" aria-expanded="false">✍️ Abrir un tema</button><span class="muted" id="foro-estado"></span></div>
    <form id="foro-f" class="prop-f card" hidden>
      <label>Título *<input name="titulo" required minlength="8" maxlength="160" placeholder="¿Qué ley falta para la Amazonía conectada?"></label>
      <label>Categoría<select name="categoria"><option value="ideas">💡 Ideas</option><option value="dudas">❓ Dudas</option><option value="debate">⚖️ Debate</option><option value="regiones">📍 Regiones</option><option value="otros">💬 Otros</option></select></label>
      <label>Tu mensaje *<textarea name="texto" required minlength="15" maxlength="3000" rows="5"></textarea></label>
      <label>Nombre o seudónimo (opcional)<input name="nombre" maxlength="60"></label>
      <input name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
      <div class="com-acts"><button class="btn" type="submit">Publicar tema</button><span class="muted" id="foro-msg" aria-live="polite"></span></div>
      <p class="muted com-legal">Es público. No compartas datos personales tuyos ni de terceros. Se moderan insultos, spam y desinformación evidente.</p>
    </form>
    <div id="foro-list"></div>
  </section>
""", ""),
        "privacidad": ("Privacidad · Agenda Legislativa Tech Perú",
                       "Qué datos recoge la Agenda Legislativa Tech Perú, para qué, por cuánto tiempo y cómo ejercer tus derechos.",
                       """  <section class="block first" id="privacidad">
    <h1 class="page-h">Privacidad</h1>
    <div class="prosa">
    <p>Este sitio es un proyecto ciudadano sin fines de lucro. Recogemos <b>lo mínimo</b> para que puedas participar.</p>
    <h3>Qué guardamos cuando participas</h3>
    <ul><li><b>Propuestas, comentarios y temas del foro:</b> el texto que escribes y el nombre o seudónimo que elijas (opcional). Son <b>públicos</b> una vez publicados. No escribas DNI, teléfonos ni correos: el sistema los rechaza.</li>
      <li><b>Votos 👍/👎:</b> un identificador aleatorio de tu navegador, guardado en el servidor solo como <i>hash</i>, para contar un voto por dispositivo.</li>
      <li><b>Tu red:</b> la dirección IP se guarda solo como <i>hash</i> irreversible con sal secreta, para frenar spam y abuso. No guardamos tu IP en claro ni tu navegador en las tablas de participación.</li></ul>
    <h3>Analítica</h3>
    <p>Usamos Google Analytics (con IP anonimizada) <b>solo si lo aceptas</b> en el aviso inferior. Puedes cambiar tu decisión borrando los datos del sitio en tu navegador.</p>
    <h3>Dónde y por cuánto tiempo</h3>
    <p>Los datos de participación se guardan en un servidor propio (api.tunky.net). Lo moderado como spam u ofensivo se oculta; puedes pedir que borremos tu aporte.</p>
    <h3>Tus derechos</h3>
    <p>Puedes pedir acceso, corrección o eliminación de tus aportes (Ley 29733, Ley de Protección de Datos Personales) escribiendo a través de <a href="https://github.com/unimauro" target="_blank" rel="noopener">github.com/unimauro</a>, indicando el código de tu aporte (por ejemplo C-12 o T-3) y la fecha.</p>
    <p class="muted">Este aviso no reemplaza asesoría legal. Última actualización: 22 de octubre de 2026.</p>
    </div>
  </section>
""", ""),
        "tramite": ("Cómo se tramita · Agenda Legislativa Tech Perú",
                    "Cómo se presenta y tramita un proyecto de ley en el Congreso bicameral 2026–2031, marco normativo tech vigente y antecedentes 2021–2026.",
                    """  <section class="block first" id="tramite">
    <h1 class="page-h">Cómo se tramita un proyecto de ley</h1>
    <p class="sub">Del texto a la ley en el Congreso bicameral. Si eres asesor o asesora, toma el Word de cualquier propuesta, adáptalo y preséntalo.</p>
    <div class="grid2"><div><ol class="steps" id="steps"></ol></div>
      <div class="card"><h3>Marco normativo tech vigente</h3><div class="tbl-scroll" id="marco"></div></div></div>
  </section>
  <section class="block" id="ruta"><h2>Hoja de ruta por plazo</h2><p class="sub">Según el plazo de implementación de cada propuesta.</p><div class="lanes" id="lanes"></div></section>
  <section class="block" id="antecedentes"><h2>Lo que pasó en el Congreso 2021–2026</h2><p class="sub" id="ant-sub"></p><div id="ant"></div></section>
""", ""),
    }
    for k, (t, d, cuerpo, scripts) in paginas.items():
        (root / ("index.html" if k == "index" else f"{k}.html")).write_text(shell(k, t, d, cuerpo, scripts))
    urls = [BASE] + [BASE + f"{k}.html" for k in paginas if k != "index"]
    return urls

