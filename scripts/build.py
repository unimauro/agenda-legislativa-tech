"""Une data/propuestas/*.json, valida, y genera:
- data/propuestas.json (consumido por index.html)
- p/<id>.html (una página estática por propuesta, compartible y con OG)
- pdf/<id>.pdf + pdf/agenda-legislativa-tech-completa.pdf
- sitemap.xml

Uso: .venv/bin/python scripts/build.py [--sin-pdf]
"""
import html
import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://unimauro.github.io/agenda-legislativa-tech/"
HOY = date.today().isoformat()

EJES = {
    "ia": ("Inteligencia artificial y datos", "#7c5cff"),
    "ciber": ("Ciberseguridad e identidad digital", "#e5484d"),
    "gob": ("Gobierno digital y transparencia", "#0ea5e9"),
    "conect": ("Conectividad, telecom y espacio", "#f59e0b"),
    "econ": ("Economía digital, startups y CTI", "#10b981"),
    "talento": ("Talento, educación y tech sectorial", "#ec4899"),
}
ORDEN_EJES = list(EJES)
# Comisiones ordinarias 2021-2026 (como las redactaron los agentes) -> comisión legislativa de la Cámara de
# Diputados 2026-2031 (Reglamento RL 005, art. 45) -> comisión revisora del Senado (RL 006, art. 48).
A_DIPUTADOS = {
    "Transportes y Comunicaciones": "Infraestructura, Vivienda y Transportes",
    "Vivienda y Construcción": "Infraestructura, Vivienda y Transportes",
    "Ciencia, Innovación y Tecnología": "Ciencia, Innovación Tecnológica y Sociedad Digital",
    "Economía, Banca, Finanzas e Inteligencia Financiera": "Economía, Banca, Finanzas e Inteligencia Financiera",
    "Descentralización, Regionalización, Gobiernos Locales y Modernización de la Gestión del Estado": "Modernización de la Gestión del Estado y Contraloría",
    "Fiscalización y Contraloría": "Modernización de la Gestión del Estado y Contraloría",
    "Justicia y Derechos Humanos": "Justicia y Derechos Humanos",
    "Defensa del Consumidor y Organismos Reguladores de los Servicios Públicos": "Defensa del Consumidor y Regulación de los Servicios Públicos",
    "Producción, Micro y Pequeña Empresa y Cooperativas": "Producción, Comercio Exterior y Turismo",
    "Comercio Exterior y Turismo": "Producción, Comercio Exterior y Turismo",
    "Educación, Juventud y Deporte": "Educación, Cultura y Deporte",
    "Cultura y Patrimonio Cultural": "Educación, Cultura y Deporte",
    "Constitución y Reglamento": "Constitución, Reglamento y Relaciones Exteriores",
    "Salud y Población": "Salud",
    "Trabajo y Seguridad Social": "Trabajo y Seguridad Social",
    "Mujer y Familia": "Inclusión Social, Familia, Mujer y Pueblos Andinos, Amazónicos y Afroperuanos",
    "Inclusión Social y Personas con Discapacidad": "Inclusión Social, Familia, Mujer y Pueblos Andinos, Amazónicos y Afroperuanos",
    "Pueblos Andinos, Amazónicos y Afroperuanos, Ambiente y Ecología": "Inclusión Social, Familia, Mujer y Pueblos Andinos, Amazónicos y Afroperuanos",
    "Defensa Nacional y Orden Interno": "Defensa Nacional y Orden Interno",
    "Defensa Nacional, Orden Interno, Desarrollo Alternativo y Lucha contra las Drogas": "Defensa Nacional y Orden Interno",
    "Agraria": "Desarrollo Agrario",
    "Energía y Minas": "Energía y Minas",
    "Presupuesto y Cuenta General de la República": "Bicameral de Presupuesto y Cuenta General de la República",
}
A_SENADO = {
    "Constitución, Reglamento y Relaciones Exteriores": "Constitución, Reglamento y Relaciones Exteriores",
    "Defensa Nacional y Orden Interno": "Defensa Nacional y Orden Interno",
    "Justicia y Derechos Humanos": "Justicia y Derechos Humanos",
    "Economía, Banca, Finanzas e Inteligencia Financiera": "Economía, Medio Ambiente y Defensa del Consumidor",
    "Defensa del Consumidor y Regulación de los Servicios Públicos": "Economía, Medio Ambiente y Defensa del Consumidor",
    "Medio Ambiente y Sostenibilidad": "Economía, Medio Ambiente y Defensa del Consumidor",
    "Modernización de la Gestión del Estado y Contraloría": "En asuntos de Gestión del Estado y Contraloría",
    "Infraestructura, Vivienda y Transportes": "En asuntos de Desarrollo Productivo, Energía y Minas, Infraestructura y Trabajo",
    "Producción, Comercio Exterior y Turismo": "En asuntos de Desarrollo Productivo, Energía y Minas, Infraestructura y Trabajo",
    "Energía y Minas": "En asuntos de Desarrollo Productivo, Energía y Minas, Infraestructura y Trabajo",
    "Trabajo y Seguridad Social": "En asuntos de Desarrollo Productivo, Energía y Minas, Infraestructura y Trabajo",
    "Desarrollo Agrario": "En asuntos de Desarrollo Productivo, Energía y Minas, Infraestructura y Trabajo",
    "Ciencia, Innovación Tecnológica y Sociedad Digital": "En asuntos de Salud, Educación, Cultura, Mujer y Desarrollo Social y Digital",
    "Educación, Cultura y Deporte": "En asuntos de Salud, Educación, Cultura, Mujer y Desarrollo Social y Digital",
    "Salud": "En asuntos de Salud, Educación, Cultura, Mujer y Desarrollo Social y Digital",
    "Inclusión Social, Familia, Mujer y Pueblos Andinos, Amazónicos y Afroperuanos": "En asuntos de Salud, Educación, Cultura, Mujer y Desarrollo Social y Digital",
}


def mapear_comisiones(p, errores):
    for k in ("comision_sugerida", "comision_secundaria"):
        v = p.get(k)
        if not v:
            continue
        if v not in A_DIPUTADOS:
            errores.append(f"{p['id']}: comisión sin mapear '{v}'")
            continue
        p.setdefault(k + "_2021", v)
        p[k] = A_DIPUTADOS[v]
    if p.get("comision_secundaria") == p.get("comision_sugerida"):
        p["comision_secundaria"] = None
    p["comision_senado"] = A_SENADO.get(p.get("comision_sugerida"))


ESPECIALIDADES = {"constitucional": "Constitucional", "jurista": "Técnica legislativa", "derecho_tecnologico": "Derecho tecnológico",
                  "seguridad": "Seguridad", "normativo": "Concordancia normativa"}
VEREDICTO = {"conforme": "Conforme", "observaciones": "Con observaciones", "observaciones_graves": "Observaciones graves"}
ROLES = ["rectora", "reglamentadora", "ejecutora", "supervisora", "sancionadora", "financiadora", "regulada", "consultiva", "beneficiaria"]

REQ = ["id", "eje", "titulo", "titulo_corto", "sumilla", "problema", "articulado", "comision_sugerida", "plan2050"]


def cargar():
    plan = {c["id"]: c for c in json.loads((ROOT / "data/plan2050_comisiones.json").read_text())}
    props, errores = [], []
    for eje in ORDEN_EJES:
        f = ROOT / f"data/propuestas/{eje}.json"
        if not f.exists():
            errores.append(f"falta {f.name}")
            continue
        for p in json.loads(f.read_text()):
            faltan = [k for k in REQ if not p.get(k)]
            if faltan:
                errores.append(f"{p.get('id')}: faltan {faltan}")
            p["eje"] = eje
            mapear_comisiones(p, errores)
            malos = [x for x in p.get("plan2050", []) if x not in plan]
            if malos:
                errores.append(f"{p['id']}: plan2050 desconocido {malos}")
                p["plan2050"] = [x for x in p["plan2050"] if x in plan]
            props.append(p)
    revs = {}
    for rf in sorted((ROOT / "data/revision").glob("*.json")) if "--con-revision" in sys.argv else []:
        try:
            for r in json.loads(rf.read_text()):
                revs.setdefault(r.get("id"), []).append(r)
        except Exception as ex:
            errores.append(f"revisión ilegible {rf.name}: {ex}")
    for p in props:
        p["revision"] = [
            {"especialidad": ESPECIALIDADES.get(r.get("especialidad"), r.get("especialidad")), "veredicto": r.get("veredicto"),
             "resumen": r.get("resumen"), "hallazgos": {sv: sum(1 for h in r.get("hallazgos", []) if h.get("severidad") == sv) for sv in ("alta", "media", "baja")}}
            for r in revs.get(p["id"], [])
        ]
    ids = [p["id"] for p in props]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        errores.append(f"ids duplicados {dup}")
    return props, plan, errores


def opcional(nombre):
    f = ROOT / "data" / nombre
    return json.loads(f.read_text()) if f.exists() else None


# ---------------------------------------------------------------- páginas por propuesta
def e(s):
    return html.escape(str(s or ""))


def links(lista, k1="titulo", k2="url"):
    out = []
    for x in lista or []:
        if isinstance(x, str):
            out.append(f"<li>{e(x)}</li>")
            continue
        label = x.get(k1) or x.get("norma") or x.get("titulo") or x.get(k2)
        pre = f"<b>{e(x['pais'])}:</b> " if x.get("pais") else ""
        u = x.get(k2)
        out.append(f'<li>{pre}<a href="{e(u)}" target="_blank" rel="noopener">{e(label)}</a></li>' if u else f"<li>{pre}{e(label)}</li>")
    return "<ul>" + "".join(out) + "</ul>" if out else "<p class='muted'>—</p>"


def enlace(txt, url):
    return f'<a href="{e(url)}" target="_blank" rel="noopener">{e(txt)}</a>' if url else e(txt)


def bloques_v2(p):
    """Secciones: normas que modifica, quién hace qué, impacto económico, revisión especializada."""
    out = []
    im = p.get("implicados") or {}
    nm = im.get("normas_modificadas") or []
    if nm:
        filas = "".join(
            f"<tr><td>{enlace(n.get('norma'), n.get('url'))}</td>"
            f"<td>{e(n.get('articulo'))}</td><td><span class='pill acc-{e(n.get('accion'))}'>{e(n.get('accion'))}</span></td></tr>" for n in nm)
        out.append(f"<section><h2>Normas que modifica</h2><div class='tbl-scroll'><table class='tbl'><tr><th>Norma</th><th>Artículo</th><th>Acción</th></tr>{filas}</table></div></section>")
    ent = im.get("entidades") or []
    if ent:
        ent = sorted(ent, key=lambda x: ROLES.index(x.get("rol")) if x.get("rol") in ROLES else 99)
        filas = "".join(f"<tr><td><b>{e(x.get('sigla') or '')}</b> {e(x.get('entidad'))}<br><span class='muted'>{e(x.get('sector') or '')}</span></td>"
                        f"<td><span class='pill rol'>{e(x.get('rol'))}</span></td><td>{e(x.get('responsabilidad'))}</td></tr>" for x in ent)
        extra = "".join(f"<p><b>{k}:</b> {e(im.get(c))}</p>" for k, c in (("Sujetos obligados", "sujetos_obligados"), ("Beneficiarios", "beneficiarios")) if im.get(c))
        out.append(f"<section><h2>¿Quién hace qué?</h2><div class='tbl-scroll'><table class='tbl'><tr><th>Entidad</th><th>Rol</th><th>Responsabilidad</th></tr>{filas}</table></div>{extra}</section>")
    ip = p.get("impacto") or {}
    if ip:
        ce = ip.get("costo_estado") or {}
        celdas = [("Tipo de impacto", ip.get("tipo")), ("Costo para el Estado", ce.get("rango")), ("Horizonte", ce.get("horizonte")),
                  ("Financiamiento", ce.get("financiamiento")), ("Beneficio para el Estado", ip.get("beneficio_estado")),
                  ("Beneficio para la sociedad", ip.get("beneficio_sociedad")), ("Inversión privada movilizable", ip.get("inversion_privada")),
                  ("Costo para privados", ip.get("costo_privado")), ("Riesgos", ip.get("riesgos")), ("Supuestos del cálculo", ce.get("supuestos"))]
        grid = "".join(f"<div class='imp'><span>{k}</span><p>{e(v)}</p></div>" for k, v in celdas if v)
        out.append(f"<section><h2>Impacto económico estimado</h2><p class='muted'>Estimación referencial con supuestos explícitos · confianza: <b>{e(ip.get('confianza') or '—')}</b>. No es un dato oficial ni reemplaza el informe del MEF.</p><div class='imp-grid'>{grid}</div></section>")
    rv = p.get("revision") or []
    if rv:
        filas = "".join(f"<tr><td>{e(r['especialidad'])}</td><td><span class='pill ver-{e(r.get('veredicto'))}'>{e(VEREDICTO.get(r.get('veredicto'), r.get('veredicto')))}</span></td>"
                        f"<td>{e(r.get('resumen'))}<br><span class='muted'>Hallazgos: {r['hallazgos']['alta']} altos · {r['hallazgos']['media']} medios · {r['hallazgos']['baja']} bajos</span></td></tr>" for r in rv)
        ra = p.get("revision_atendida") or []
        aten = ""
        if ra:
            c = {k: sum(1 for x in ra if x.get("accion") == k) for k in ("corregido", "parcial", "no_aplicado")}
            aten = f"<p>Observaciones atendidas en esta versión: <b>{c['corregido']}</b> corregidas, <b>{c['parcial']}</b> parciales, <b>{c['no_aplicado']}</b> no aplicadas (con justificación).</p>"
        out.append(f"<section><h2>Revisión especializada</h2><p class='muted'>Revisión asistida por IA desde cinco especialidades, sobre la versión anterior del texto. No reemplaza la revisión de un abogado ni el dictamen de comisión.</p>{aten}<div class='tbl-scroll'><table class='tbl'><tr><th>Especialidad</th><th>Veredicto</th><th>Opinión</th></tr>{filas}</table></div></section>")
    return "".join(out)


def pagina(p, plan, prev, nxt):
    eje_nom, color = EJES[p["eje"]]
    url = f"{BASE}p/{p['id']}.html"
    arts = "".join(
        f"<div class='art'><h4>{e(a.get('n'))}. {e(a.get('titulo'))}</h4><p>{e(a.get('texto')).replace(chr(10), '<br>')}</p></div>"
        for a in p.get("articulado", [])
    )
    disp = "".join(
        f"<div class='art'><h4>{e(d.get('n'))} Disposición {e(d.get('tipo'))}</h4><p>{e(d.get('texto'))}</p></div>"
        for d in p.get("disposiciones", [])
    )
    p50 = "".join(f'<a class="chip" href="{e(plan[c]["url"])}" target="_blank" rel="noopener">Plan 2050 · {e(plan[c]["nombre"])}</a>' for c in p.get("plan2050", []))
    ods = "".join(f'<span class="chip">ODS {e(o)}</span>' for o in p.get("ods", []))
    nav = (f'<a href="{e(prev)}.html">← {e(prev)}</a>' if prev else "<span></span>") + (f'<a href="{e(nxt)}.html">{e(nxt)} →</a>' if nxt else "")
    desc = e(p.get("sumilla"))[:280]
    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(p['id'])} · {e(p['titulo_corto'])} — Agenda Legislativa Tech</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article"><meta property="og:title" content="{e(p['titulo'])}">
<meta property="og:description" content="{desc}"><meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../favicon.svg" type="image/svg+xml"><link rel="icon" href="../favicon.png" sizes="64x64">
<link rel="stylesheet" href="../assets/style.css">
<script>try{{const t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}}catch(_){{}}</script>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YKRRVYDYQ8"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-YKRRVYDYQ8');
</script>
</head><body class="doc" style="--eje:{color}">
<header class="top"><a class="brand" href="../">⚖️ Agenda Legislativa Tech</a>
<span class="spacer"></span><button class="ghost" id="theme" aria-label="Cambiar tema">◐</button></header>
<main class="wrap narrow">
<p class="crumb"><a href="../#propuestas">Propuestas</a> › <span class="eje-tag">{e(eje_nom)}</span></p>
<h1><span class="pid">{e(p['id'])}</span> {e(p['titulo'])}</h1>
<p class="lead">{e(p.get('sumilla'))}</p>
<div class="meta-row">
 <span class="pill prio-{e(p.get('prioridad'))}">Prioridad {e(p.get('prioridad'))}</span>
 <span class="pill">Costo fiscal: {e(p.get('costo_fiscal'))}</span>
 <span class="pill">Plazo: {e(p.get('plazo'))}</span>
 <span class="pill">Diputados: {e(p.get('comision_sugerida'))}</span>
 {f'<span class="pill">+ {e(p.get("comision_secundaria"))}</span>' if p.get('comision_secundaria') else ''}
 {f'<span class="pill">Senado: {e(p.get("comision_senado"))}</span>' if p.get('comision_senado') else ''}
</div>
<div class="actions"><a class="btn" href="../pdf/{e(p['id'])}.pdf" download>⬇️ Descargar PDF</a>
<a class="btn ghost" href="../docx/{e(p['id'])}.docx" download>📝 Word editable (formato despacho)</a>
<button class="btn ghost" onclick="window.print()">🖨️ Imprimir</button>
<a class="btn ghost" id="wa" target="_blank" rel="noopener">🟢 Compartir</a></div>
<div class="chips">{p50}{ods}</div>
<section><h2>Exposición de motivos — el problema</h2><p>{e(p.get('problema'))}</p></section>
<section><h2>Objeto</h2><p>{e(p.get('objeto'))}</p></section>
<section><h2>Fórmula legal</h2><p class="formula">EL CONGRESO DE LA REPÚBLICA<br>Ha dado la Ley siguiente:<br><b>{e(p['titulo'].upper())}</b></p>{arts}{disp}</section>
<section><h2>Análisis costo-beneficio</h2><p>{e(p.get('costo_beneficio'))}</p></section>
{bloques_v2(p)}
<section><h2>Efecto de la vigencia sobre la legislación nacional</h2><p>{e(p.get('efecto_vigencia'))}</p></section>
<section><h2>Indicador de éxito al 2031</h2><p>{e(p.get('indicador_exito'))}</p></section>
<section><h2>Normas relacionadas</h2>{links(p.get('normas_relacionadas'), 'norma')}</section>
<section><h2>Antecedentes</h2><p>{e(p.get('antecedentes'))}</p></section>
<section><h2>Referencias internacionales</h2>{links(p.get('referencias_internacionales'), 'norma')}</section>
<section><h2>Fuentes</h2>{links(p.get('fuentes'))}</section>
<p class="disclaimer">Propuesta ciudadana de libre uso para cualquier congresista, bancada o colectivo que quiera presentarla. No es un proyecto de ley presentado ni tiene número en el Congreso. Cítala y mejórala.</p>
<nav class="pager">{nav}</nav>
</main>
<script>document.getElementById('wa').href='https://wa.me/?text='+encodeURIComponent(document.title+' '+location.href);
document.getElementById('theme').onclick=()=>{{const r=document.documentElement,n=(r.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'))==='dark'?'light':'dark';r.dataset.theme=n;try{{localStorage.setItem('theme',n)}}catch(_){{}}}};</script>
</body></html>"""


# ---------------------------------------------------------------- PDF
def pdfs(props, plan):
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_JUSTIFY
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer

    ss = getSampleStyleSheet()
    body = ParagraphStyle("b", parent=ss["BodyText"], fontName="Helvetica", fontSize=9.5, leading=13.5, alignment=TA_JUSTIFY)
    h1 = ParagraphStyle("h1", parent=ss["Title"], fontName="Helvetica-Bold", fontSize=15, leading=19, alignment=0)
    h2 = ParagraphStyle("h2", parent=ss["Heading2"], fontName="Helvetica-Bold", fontSize=11, spaceBefore=10, textColor=colors.HexColor("#b91c1c"))
    h3 = ParagraphStyle("h3", parent=body, fontName="Helvetica-Bold", spaceBefore=4)
    small = ParagraphStyle("s", parent=body, fontSize=8, textColor=colors.HexColor("#555555"), alignment=0)

    def t(s):
        s = str(s or "")
        s = s.encode("cp1252", "ignore").decode("cp1252")  # fuentes estándar = WinAnsi
        return html.escape(s).replace("\n", "<br/>")

    def lst(items, k="titulo"):
        out = []
        for x in items or []:
            if isinstance(x, str):
                out.append(Paragraph("• " + t(x), small))
                continue
            label = (x.get("pais") + ": " if x.get("pais") else "") + str(x.get(k) or x.get("norma") or x.get("titulo") or "")
            u = x.get("url")
            out.append(Paragraph("• " + t(label) + (f' — <link href="{html.escape(u)}" color="blue">{t(u)}</link>' if u else ""), small))
        return out

    def historia(p):
        s = [Paragraph(f"{t(p['id'])} · {t(EJES[p['eje']][0])}", small), Paragraph(t(p["titulo"]), h1), Paragraph(t(p.get("sumilla")), body)]
        s.append(Paragraph(
            f"<b>Comisión (Cámara de Diputados):</b> {t(p.get('comision_sugerida'))}"
            + (f" (+ {t(p.get('comision_secundaria'))})" if p.get("comision_secundaria") else "")
            + (f" · <b>Revisora (Senado):</b> {t(p.get('comision_senado'))}" if p.get("comision_senado") else "")
            + f" · <b>Prioridad:</b> {t(p.get('prioridad'))} · <b>Costo fiscal:</b> {t(p.get('costo_fiscal'))} · <b>Plazo:</b> {t(p.get('plazo'))}<br/>"
            + "<b>Plan Perú 2050:</b> " + t(", ".join(plan[c]["nombre"] for c in p.get("plan2050", []))),
            small))
        s += [Paragraph("I. Exposición de motivos", h2), Paragraph(t(p.get("problema")), body),
              Paragraph("II. Fórmula legal", h2), Paragraph("EL CONGRESO DE LA REPÚBLICA ha dado la Ley siguiente:<br/><b>" + t(p["titulo"].upper()) + "</b>", body)]
        for a in p.get("articulado", []):
            s += [Paragraph(f"{t(a.get('n'))}. {t(a.get('titulo'))}", h3), Paragraph(t(a.get("texto")), body)]
        for d in p.get("disposiciones", []):
            s += [Paragraph(f"{t(d.get('n'))}. Disposición {t(d.get('tipo'))}", h3), Paragraph(t(d.get("texto")), body)]
        s += [Paragraph("III. Análisis costo-beneficio", h2), Paragraph(t(p.get("costo_beneficio")), body),
              *pdf_v2(p),
              Paragraph("IV. Efecto de la vigencia de la norma", h2), Paragraph(t(p.get("efecto_vigencia")), body),
              Paragraph("V. Indicador de éxito al 2031", h2), Paragraph(t(p.get("indicador_exito")), body),
              Paragraph("Normas relacionadas", h2), *lst(p.get("normas_relacionadas"), "norma"),
              Paragraph("Antecedentes", h2), Paragraph(t(p.get("antecedentes")), small),
              Paragraph("Referencias internacionales", h2), *lst(p.get("referencias_internacionales"), "norma"),
              Paragraph("Fuentes", h2), *lst(p.get("fuentes")),
              Spacer(1, 8), Paragraph(f"Propuesta ciudadana de libre uso — no es un proyecto presentado. Versión web: {BASE}p/{p['id']}.html", small)]
        return s

    def pdf_v2(p):
        s = []
        im, ip = p.get("implicados") or {}, p.get("impacto") or {}
        if im.get("normas_modificadas"):
            s.append(Paragraph("Normas que modifica", h3))
            s += [Paragraph(f"• {t(n.get('norma'))}, {t(n.get('articulo'))} — <i>{t(n.get('accion'))}</i>", small) for n in im["normas_modificadas"]]
        if im.get("entidades"):
            s.append(Paragraph("Entidades implicadas (quién hace qué)", h3))
            s += [Paragraph(f"• <b>{t(x.get('sigla') or x.get('entidad'))}</b> ({t(x.get('rol'))}): {t(x.get('responsabilidad'))}", small) for x in im["entidades"]]
            for k, c in (("Sujetos obligados", "sujetos_obligados"), ("Beneficiarios", "beneficiarios")):
                if im.get(c):
                    s.append(Paragraph(f"<b>{k}:</b> {t(im[c])}", small))
        if ip:
            ce = ip.get("costo_estado") or {}
            s.append(Paragraph(f"Impacto económico estimado (confianza {t(ip.get('confianza'))}; referencial, no oficial)", h3))
            for k, v in (("Tipo", ip.get("tipo")), ("Costo para el Estado", ce.get("rango")), ("Horizonte", ce.get("horizonte")), ("Financiamiento", ce.get("financiamiento")),
                         ("Supuestos", ce.get("supuestos")), ("Beneficio para el Estado", ip.get("beneficio_estado")), ("Beneficio para la sociedad", ip.get("beneficio_sociedad")),
                         ("Inversión privada", ip.get("inversion_privada")), ("Costo para privados", ip.get("costo_privado")), ("Riesgos", ip.get("riesgos"))):
                if v:
                    s.append(Paragraph(f"<b>{k}:</b> {t(v)}", small))
        if p.get("revision"):
            s.append(Paragraph("Revisión especializada (asistida por IA, sobre la versión anterior)", h3))
            s += [Paragraph(f"• <b>{t(r['especialidad'])}</b> — {t(VEREDICTO.get(r.get('veredicto'), r.get('veredicto')))}: {t(r.get('resumen'))}", small) for r in p["revision"]]
        return s

    def pie(c, d):
        c.saveState(); c.setFont("Helvetica", 7.5); c.setFillColor(colors.HexColor("#777777"))
        c.drawString(2 * cm, 1.2 * cm, "Agenda Legislativa Tech Perú 2026-2031 · " + BASE)
        c.drawRightString(A4[0] - 2 * cm, 1.2 * cm, str(d.page)); c.restoreState()

    kw = dict(pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm, topMargin=1.8 * cm, bottomMargin=1.8 * cm,
              author="Carlos Cárdenas Fernández (@unimauro)")
    out = ROOT / "pdf"; out.mkdir(exist_ok=True)
    for p in props:
        SimpleDocTemplate(str(out / f"{p['id']}.pdf"), title=p["titulo"], **kw).build(historia(p), onFirstPage=pie, onLaterPages=pie)
    portada = [Spacer(1, 5 * cm), Paragraph("Agenda Legislativa Tech Perú 2026-2031", ParagraphStyle("t", parent=h1, fontSize=26, leading=30)),
               Spacer(1, 12), Paragraph(f"{len(props)} propuestas de ley en tecnología listas para debate en comisiones, alineadas al Plan Perú 2050.", body),
               Spacer(1, 6), Paragraph(f"Versión {HOY} · {BASE}", small), PageBreak(), Paragraph("Índice", h2)]
    for eje in ORDEN_EJES:
        portada.append(Paragraph(t(EJES[eje][0]), h3))
        portada += [Paragraph(f"{t(p['id'])} — {t(p['titulo'])}", small) for p in props if p["eje"] == eje]
    todo = portada
    for p in props:
        todo += [PageBreak()] + historia(p)
    SimpleDocTemplate(str(out / "agenda-legislativa-tech-completa.pdf"), title="Agenda Legislativa Tech Perú 2026-2031", **kw).build(todo, onFirstPage=pie, onLaterPages=pie)


def docxs(props, plan):
    """Versión editable (formato despacho) de cada propuesta."""
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.shared import Pt

    out = ROOT / "docx"; out.mkdir(exist_ok=True)
    for p in props:
        d = Document()
        st = d.styles["Normal"]; st.font.name = "Arial"; st.font.size = Pt(11)
        d.add_paragraph("PROYECTO DE LEY N.° ____/2026-CR").alignment = WD_ALIGN_PARAGRAPH.RIGHT
        d.add_heading(p["titulo"].upper(), level=1)
        d.add_paragraph("El/la congresista que suscribe, ______________________, en ejercicio del derecho de iniciativa legislativa "
                        "que le confiere el artículo 107 de la Constitución Política del Perú, presenta la siguiente propuesta legislativa:")
        f = d.add_paragraph(); f.alignment = WD_ALIGN_PARAGRAPH.CENTER
        f.add_run("FÓRMULA LEGAL\n").bold = True
        f.add_run("EL CONGRESO DE LA REPÚBLICA\nHa dado la Ley siguiente:\n")
        f.add_run(p["titulo"].upper()).bold = True
        for a in p.get("articulado", []):
            par = d.add_paragraph(); par.add_run(f"{a.get('n')}. {a.get('titulo')}\n").bold = True; par.add_run(a.get("texto", ""))
            par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        for x in p.get("disposiciones", []):
            par = d.add_paragraph(); par.add_run(f"{x.get('n')}. Disposición {x.get('tipo')}\n").bold = True; par.add_run(x.get("texto", ""))
            par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        d.add_paragraph("Lima, ___ de __________ de 20__")
        d.add_page_break()
        d.add_heading("EXPOSICIÓN DE MOTIVOS", level=1)
        for tit, k in [("I. Fundamentos y problema", "problema"), ("II. Objeto", "objeto"), ("III. Análisis costo-beneficio", "costo_beneficio"),
                       ("IV. Efecto de la vigencia de la norma sobre la legislación nacional", "efecto_vigencia"),
                       ("V. Antecedentes", "antecedentes"), ("VI. Indicador de éxito", "indicador_exito")]:
            d.add_heading(tit, level=2); d.add_paragraph(str(p.get(k) or "")).alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        im, ip = p.get("implicados") or {}, p.get("impacto") or {}
        if im.get("normas_modificadas") or im.get("entidades"):
            d.add_heading("Normas que modifica y entidades implicadas", level=2)
            for n in im.get("normas_modificadas") or []:
                d.add_paragraph(f"{n.get('norma')}, {n.get('articulo')} — {n.get('accion')}", style="List Bullet")
            for x in im.get("entidades") or []:
                d.add_paragraph(f"{x.get('sigla') or x.get('entidad')} ({x.get('rol')}): {x.get('responsabilidad')}", style="List Bullet")
        if ip:
            ce = ip.get("costo_estado") or {}
            d.add_heading("Impacto económico estimado (referencial)", level=2)
            for k, v in (("Tipo", ip.get("tipo")), ("Costo para el Estado", ce.get("rango")), ("Financiamiento", ce.get("financiamiento")), ("Supuestos", ce.get("supuestos")),
                         ("Beneficio para el Estado", ip.get("beneficio_estado")), ("Beneficio para la sociedad", ip.get("beneficio_sociedad")),
                         ("Inversión privada", ip.get("inversion_privada")), ("Costo para privados", ip.get("costo_privado")), ("Riesgos", ip.get("riesgos"))):
                if v:
                    d.add_paragraph(f"{k}: {v}", style="List Bullet")
        d.add_heading("VII. Vinculación con la Agenda Legislativa y el Plan Perú 2050", level=2)
        d.add_paragraph("Comisiones temáticas del Plan Perú 2050: " + ", ".join(plan[c]["nombre"] for c in p.get("plan2050", [])) +
                        ". ODS: " + ", ".join(str(o) for o in p.get("ods", [])) + ".")
        d.add_heading("VIII. Referencias", level=2)
        for x in (p.get("normas_relacionadas") or []) + (p.get("referencias_internacionales") or []) + (p.get("fuentes") or []):
            if isinstance(x, dict):
                d.add_paragraph(f"{(x.get('pais') + ': ') if x.get('pais') else ''}{x.get('norma') or x.get('titulo') or ''} — {x.get('url') or ''}", style="List Bullet")
        d.add_paragraph(f"Fuente: Agenda Legislativa Tech Perú 2026–2031 ({BASE}p/{p['id']}.html), propuesta ciudadana CC BY 4.0.")
        d.core_properties.title = p["titulo"]; d.core_properties.author = "Agenda Legislativa Tech Perú"
        d.save(out / f"{p['id']}.docx")


def main():
    props, plan, errores = cargar()
    for x in errores:
        print("⚠️ ", x)
    props.sort(key=lambda p: (ORDEN_EJES.index(p["eje"]), p["id"]))
    salida = {
        "meta": {"actualizado": HOY, "total": len(props), "base": BASE,
                 "ejes": [{"id": k, "nombre": v[0], "color": v[1]} for k, v in EJES.items()]},
        "plan2050": plan,
        "propuestas": props,
        "antecedentes": opcional("antecedentes.json"),
        "contexto": opcional("contexto_legislativo.json"),
        "marco": opcional("marco_normativo.json"),
    }
    (ROOT / "data/propuestas.json").write_text(json.dumps(salida, ensure_ascii=False, separators=(",", ":")))
    (ROOT / "p").mkdir(exist_ok=True)
    for i, p in enumerate(props):
        prev = props[i - 1]["id"] if i else None
        nxt = props[i + 1]["id"] if i + 1 < len(props) else None
        (ROOT / f"p/{p['id']}.html").write_text(pagina(p, plan, prev, nxt))
    urls = [BASE] + [f"{BASE}p/{p['id']}.html" for p in props]
    (ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                                     + "".join(f"<url><loc>{u}</loc><lastmod>{HOY}</lastmod></url>\n" for u in urls) + "</urlset>\n")
    import subprocess
    svg = (ROOT / "og.svg").read_text().replace("__N__", str(len(props)))
    subprocess.run(["rsvg-convert", "-w", "1200", "-h", "630", "-o", str(ROOT / "og.png")], input=svg.encode(), check=True)
    if "--sin-pdf" not in sys.argv:
        pdfs(props, plan)
        docxs(props, plan)
    print(f"OK: {len(props)} propuestas, {len(errores)} avisos")


if __name__ == "__main__":
    main()
