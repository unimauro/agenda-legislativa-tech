"""Traza las propuestas ciudadanas (issues con la etiqueta `propuesta-ciudadana`) en data/ciudadanas.json.

Se cuentan TODAS las recibidas (transparencia), pero solo se publica el contenido de las que tienen la etiqueta
`publicada` (moderación: evita spam y datos personales). Estado según etiquetas: recibida → en-revision →
incorporada | archivada.

Uso: GITHUB_TOKEN=... python3 scripts/build_ciudadanas.py   (o con `gh auth token`)
"""
import json
import os
import re
import subprocess
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = "unimauro/agenda-legislativa-tech"
ESTADOS = ["incorporada", "archivada", "en-revision", "recibida"]  # el primero que coincida gana
CAMPOS = {"Título de la ley": "titulo", "Eje temático": "eje", "¿Qué problema resuelve?": "problema", "¿Qué propones?": "propuesta",
          "¿A quién beneficia?": "beneficiarios", "¿Qué entidades deberían implementarla?": "entidades",
          "¿Le costaría dinero al Estado?": "costo", "Región desde donde propones": "region", "Nombre o seudónimo (opcional)": "autor"}


def token():
    return os.environ.get("GITHUB_TOKEN") or subprocess.run(["gh", "auth", "token"], capture_output=True, text=True, check=True).stdout.strip()


def api(url):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token()}", "Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def parsear(body):
    """Los formularios de issues generan secciones '### Etiqueta' seguidas del valor."""
    out = {}
    for bloque in re.split(r"^### ", body or "", flags=re.M)[1:]:
        cab, _, val = bloque.partition("\n")
        k = CAMPOS.get(cab.strip())
        val = val.strip()
        if k and val and val != "_No response_":
            out[k] = val
    return out


def corto(t, n):
    t = " ".join((t or "").split())
    return t if len(t) <= n else t[:n].rsplit(" ", 1)[0] + "…"


def main():
    issues, page = [], 1
    while True:
        lote = api(f"https://api.github.com/repos/{REPO}/issues?labels=propuesta-ciudadana&state=all&per_page=100&page={page}")
        issues += [i for i in lote if "pull_request" not in i]
        if len(lote) < 100:
            break
        page += 1

    items, conteo = [], {e: 0 for e in ESTADOS}
    for i in issues:
        labels = {l["name"] for l in i["labels"]}
        estado = next((e for e in ESTADOS if e in labels), "recibida")
        conteo[estado] += 1
        if "publicada" not in labels:
            continue
        f = parsear(i["body"])
        items.append({
            "n": i["number"], "titulo": corto(f.get("titulo") or i["title"].replace("[Propuesta]", "").strip(), 200),
            "eje": f.get("eje"), "region": corto(f.get("region"), 40), "autor": corto(f.get("autor"), 60) or None,
            "problema": corto(f.get("problema"), 500), "propuesta": corto(f.get("propuesta"), 700),
            "beneficiarios": corto(f.get("beneficiarios"), 300), "entidades": corto(f.get("entidades"), 200), "costo": f.get("costo"),
            "estado": estado, "fecha": i["created_at"][:10], "comentarios": i["comments"],
            "apoyo": (i.get("reactions") or {}).get("+1", 0), "url": i["html_url"],
        })
    items.sort(key=lambda x: (x["estado"] != "incorporada", -x["apoyo"], x["fecha"]), reverse=False)
    out = {"actualizado": datetime.now(timezone.utc).isoformat(timespec="minutes"),
           "totales": {"recibidas": len(issues), "publicadas": len(items), **conteo},
           "formulario": f"https://github.com/{REPO}/issues/new?template=propuesta-ciudadana.yml",
           "items": items}
    (ROOT / "data/ciudadanas.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f"OK: {len(issues)} recibidas, {len(items)} publicadas")


if __name__ == "__main__":
    main()
