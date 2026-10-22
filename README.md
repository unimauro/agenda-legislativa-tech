# Agenda Legislativa Tech Perú 2026–2031

Propuestas ciudadanas de proyectos de ley en tecnología, con exposición de motivos, articulado, análisis
costo-beneficio, efecto de vigencia y fuentes, listas para que cualquier congresista, bancada o colectivo las
presente y entren a debate en comisión. Alineadas a las comisiones temáticas del [Plan Perú 2050](https://planperu2050.pe/).

**Live:** https://unimauro.github.io/agenda-legislativa-tech/

## Ejes
IA y datos · Ciberseguridad e identidad digital · Gobierno digital y transparencia · Conectividad, telecom y
espacio · Economía digital, startups y CTI · Talento, educación y tech sectorial.

## Estructura
- `data/propuestas/<eje>.json` — fuente de verdad (una lista por eje, esquema en `SCHEMA.md`).
- `data/antecedentes.json` — proyectos tech del periodo 2021–2026 (API SPLEY del Congreso), `scripts/build_antecedentes.py`.
- `data/contexto_legislativo.json`, `data/marco_normativo.json` — trámite bicameral y normas vigentes.
- `scripts/build.py` — une todo en `data/propuestas.json`, genera `p/<id>.html`, `pdf/*.pdf`, `og.png` y `sitemap.xml`.

```bash
python3 -m venv .venv && .venv/bin/pip install reportlab requests
.venv/bin/python scripts/build_antecedentes.py   # opcional: refresca antecedentes
.venv/bin/python scripts/build.py                # requiere rsvg-convert para el OG
```

## Contribuir
¿Un artículo mejorable, una cifra desactualizada o una propuesta nueva? Abre un *issue* o *pull request*
editando el JSON del eje correspondiente.

## Licencia
Contenido de las propuestas: CC BY 4.0. Código: MIT. Son propuestas ciudadanas, no proyectos de ley presentados.
