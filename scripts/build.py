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
            malos = [x for x in p.get("plan2050", []) if x not in plan]
            if malos:
                errores.append(f"{p['id']}: plan2050 desconocido {malos}")
                p["plan2050"] = [x for x in p["plan2050"] if x in plan]
            props.append(p)
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
 <span class="pill">Comisión: {e(p.get('comision_sugerida'))}</span>
 {f'<span class="pill">+ {e(p.get("comision_secundaria"))}</span>' if p.get('comision_secundaria') else ''}
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
            f"<b>Comisión sugerida:</b> {t(p.get('comision_sugerida'))}"
            + (f" (+ {t(p.get('comision_secundaria'))})" if p.get("comision_secundaria") else "")
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
              Paragraph("IV. Efecto de la vigencia de la norma", h2), Paragraph(t(p.get("efecto_vigencia")), body),
              Paragraph("V. Indicador de éxito al 2031", h2), Paragraph(t(p.get("indicador_exito")), body),
              Paragraph("Normas relacionadas", h2), *lst(p.get("normas_relacionadas"), "norma"),
              Paragraph("Antecedentes", h2), Paragraph(t(p.get("antecedentes")), small),
              Paragraph("Referencias internacionales", h2), *lst(p.get("referencias_internacionales"), "norma"),
              Paragraph("Fuentes", h2), *lst(p.get("fuentes")),
              Spacer(1, 8), Paragraph(f"Propuesta ciudadana de libre uso — no es un proyecto presentado. Versión web: {BASE}p/{p['id']}.html", small)]
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
