"""Páginas del sitio (plantilla común). Cada página carga solo los datos que necesita (ver assets/app.js)."""

BASE = "https://unimauro.github.io/agenda-legislativa-tech/"
GA = """<script async src="https://www.googletagmanager.com/gtag/js?id=G-YKRRVYDYQ8"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-YKRRVYDYQ8');</script>"""

NAV = [("index", "index.html", "Inicio"), ("propuestas", "propuestas.html", "Propuestas"), ("vision", "vision.html", "Visión 2036"),
       ("panorama", "panorama.html", "Panorama"), ("ciudadania", "ciudadania.html", "Ciudadanía"), ("tramite", "tramite.html", "Cómo se tramita")]

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
      <img src="https://raw.githubusercontent.com/unimauro/salariosperu/main/yape.png" alt="Código QR de Yape" loading="lazy" onerror="this.style.display='none'"></div>
    <div class="share">
      <a id="sh-x" target="_blank" rel="noopener">𝕏 Twitter/X</a><a id="sh-wa" target="_blank" rel="noopener">🟢 WhatsApp</a>
      <a id="sh-in" target="_blank" rel="noopener">💼 LinkedIn</a><a id="sh-fb" target="_blank" rel="noopener">📘 Facebook</a>
      <button id="sh-copy">🔗 Copiar enlace</button>
    </div>
    <details class="rel-wrap"><summary>Proyectos relacionados</summary><div class="related">{rel}</div></details>
  </section>
  <footer>
    <p><b>Nota.</b> Son <b>propuestas ciudadanas</b> de libre uso (CC BY 4.0): no son proyectos de ley presentados ni tienen
      número en el Congreso. Las cifras citan su fuente y las estimaciones lo dicen. Actualizado: <span id="upd">—</span>.</p>
  </footer>
</main>
<button class="chat-fab" id="chat-fab" aria-expanded="false" aria-controls="chat">💬 Pregúntale a la agenda</button>
<aside class="chat" id="chat" hidden aria-label="Asistente ciudadano">
  <header><b>🤖 Asistente ciudadano</b><span class="muted">Responde con las propuestas de esta agenda</span><button class="ghost" id="chat-x" aria-label="Cerrar">✕</button></header>
  <div class="chat-log" id="chat-log" aria-live="polite">
    <div class="msg bot">¡Hola! Pregúntame qué propone esta agenda sobre un tema, a quién beneficia, quién la implementaría o cuánto costaría. Son <b>propuestas ciudadanas</b>, no leyes vigentes.</div>
    <div class="chips sug" id="chat-sug">
      <button class="chip">¿Qué proponen contra el robo de celulares y las estafas?</button>
      <button class="chip">¿Qué propuestas no le cuestan nada al Estado?</button>
      <button class="chip">¿Cuáles son las más urgentes para crecer?</button>
      <button class="chip">¿Cómo propongo una ley?</button>
    </div>
  </div>
  <form id="chat-f"><input id="chat-q" placeholder="Escribe tu pregunta…" maxlength="400" autocomplete="off" aria-label="Tu pregunta"><button class="btn" type="submit">Enviar</button></form>
  <p class="chat-note">Respuestas armadas a partir de las propuestas. No es asesoría legal.</p>
</aside>
{scripts}<script src="assets/app.js"></script>
</body>
</html>
"""


CHART = '<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>\n'
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
                       "Propón tu propia ley tech, opina sobre las propuestas y mira qué dice la ciudadanía. Todo queda trazado y público.",
                       """  <section class="block first" id="proponer">
    <h1 class="page-h">Propón una ley</h1>
    <div class="cta-card">
      <div><h2>Tu idea puede ser la próxima propuesta</h2>
        <p>Llena el formulario (título, problema, qué propones, a quién beneficia). Queda <b>registrado y público</b>; pasa por la misma
          revisión que las demás (constitucional, técnica legislativa, costo para el Estado) y, si procede, se incorpora a la agenda.</p>
        <ol class="mini-steps"><li><b>Recibida</b> — queda registrada con fecha.</li><li><b>En revisión</b> — se evalúa viabilidad y duplicidad.</li>
          <li><b>Publicada</b> — aparece aquí para recibir apoyo.</li><li><b>Incorporada</b> — se redacta como propuesta formal con articulado.</li></ol>
        <a class="btn" id="form-link" href="https://github.com/unimauro/agenda-legislativa-tech/issues/new?template=propuesta-ciudadana.yml" target="_blank" rel="noopener">🗳️ Proponer una ley</a>
        <p class="muted" style="font-size:12.5px">Requiere una cuenta gratuita de GitHub (así cada propuesta queda trazada y no se pierde).</p></div>
      <div class="kpis" id="cd-kpis"></div>
    </div>
  </section>
  <section class="block" id="ciudadanas"><h2>Propuestas de la ciudadanía</h2><p class="sub">Solo se muestran las aprobadas para publicación (filtro de spam y datos personales).</p><div id="cd-list"></div></section>
  <section class="block" id="ciudadania">
    <h2>Lo que dice la ciudadanía</h2>
    <p class="sub">Comentarios y reacciones (👍 apoyo · 👎 rechazo) en cada propuesta, consolidados automáticamente cada 6 horas.</p>
    <div class="grid2"><div class="card"><h3>Más comentadas</h3><div class="tbl-scroll" id="cm-rank"></div></div>
      <div class="card"><h3>Comentarios recientes</h3><div class="tbl-scroll" id="cm-feed"></div></div></div>
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
