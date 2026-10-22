"""Traza los comentarios ciudadanos de cada propuesta (hilos giscus en GitHub Discussions) en data/comentarios.json.

Cada propuesta tiene un hilo cuyo título es su id (giscus data-mapping="specific"). Se consolidan: n.º de comentarios
y respuestas, reacciones (apoyo 👍 / rechazo 👎 y demás), último movimiento y los comentarios recientes.

Uso: GITHUB_TOKEN=... python3 scripts/build_comentarios.py   (o con `gh auth token`)
"""
import json
import os
import re
import subprocess
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OWNER, REPO, CATEGORIA = "unimauro", "agenda-legislativa-tech", "Announcements"
ID_RE = re.compile(r"\b(IA|CIB|GOB|CON|ECO|TAL|SOB|DER)-\d{2}\b")

QUERY = """
query($owner:String!,$repo:String!,$after:String){
  repository(owner:$owner,name:$repo){
    discussions(first:50,after:$after,orderBy:{field:UPDATED_AT,direction:DESC}){
      pageInfo{hasNextPage endCursor}
      nodes{
        title url createdAt updatedAt category{name}
        reactionGroups{content reactors{totalCount}}
        comments(first:50){totalCount nodes{
          author{login} createdAt url bodyText
          reactionGroups{content reactors{totalCount}}
          replies(first:20){totalCount nodes{author{login} createdAt url bodyText}}
        }}
      }
    }
  }
}"""


def token():
    t = os.environ.get("GITHUB_TOKEN")
    if t:
        return t
    return subprocess.run(["gh", "auth", "token"], capture_output=True, text=True, check=True).stdout.strip()


def gql(variables):
    req = urllib.request.Request("https://api.github.com/graphql", method="POST",
                                 data=json.dumps({"query": QUERY, "variables": variables}).encode(),
                                 headers={"Authorization": f"Bearer {token()}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        out = json.load(r)
    if "errors" in out:
        raise SystemExit(out["errors"])
    return out["data"]["repository"]["discussions"]


def reacciones(groups):
    return {g["content"]: g["reactors"]["totalCount"] for g in groups or [] if g["reactors"]["totalCount"]}


def corto(t, n=280):
    t = " ".join((t or "").split())
    return t if len(t) <= n else t[:n].rsplit(" ", 1)[0] + "…"


def main():
    hilos, after = [], None
    while True:
        page = gql({"owner": OWNER, "repo": REPO, "after": after})
        hilos += page["nodes"]
        if not page["pageInfo"]["hasNextPage"]:
            break
        after = page["pageInfo"]["endCursor"]

    por_id, recientes = {}, []
    for d in hilos:
        m = ID_RE.search(d["title"])
        if d["category"]["name"] != CATEGORIA or not m:
            continue
        pid = m.group(0)
        coms = d["comments"]["nodes"]
        n_resp = sum(c["replies"]["totalCount"] for c in coms)
        reac = reacciones(d["reactionGroups"])
        for c in coms:
            for k, v in reacciones(c["reactionGroups"]).items():
                reac[k] = reac.get(k, 0) + v
        por_id[pid] = {
            "comentarios": d["comments"]["totalCount"], "respuestas": n_resp,
            "apoyo": reac.get("THUMBS_UP", 0), "rechazo": reac.get("THUMBS_DOWN", 0), "reacciones": reac,
            "personas": len({c["author"]["login"] for c in coms if c.get("author")}),
            "ultimo": d["updatedAt"], "url": d["url"],
        }
        for c in coms:
            recientes.append({"id": pid, "autor": (c.get("author") or {}).get("login", "anónimo"), "fecha": c["createdAt"],
                              "texto": corto(c["bodyText"]), "url": c["url"]})
            for r in c["replies"]["nodes"]:
                recientes.append({"id": pid, "autor": (r.get("author") or {}).get("login", "anónimo"), "fecha": r["createdAt"],
                                  "texto": corto(r["bodyText"]), "url": r["url"], "respuesta": True})

    recientes.sort(key=lambda x: x["fecha"], reverse=True)
    out = {
        "actualizado": datetime.now(timezone.utc).isoformat(timespec="minutes"),
        "fuente": f"GitHub Discussions {OWNER}/{REPO} (categoría {CATEGORIA}, hilos giscus)",
        "totales": {"propuestas_con_comentarios": sum(1 for v in por_id.values() if v["comentarios"]),
                    "comentarios": sum(v["comentarios"] + v["respuestas"] for v in por_id.values()),
                    "apoyo": sum(v["apoyo"] for v in por_id.values()), "rechazo": sum(v["rechazo"] for v in por_id.values())},
        "por_propuesta": por_id,
        "recientes": recientes[:60],
    }
    (ROOT / "data/comentarios.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f"OK: {len(por_id)} hilos, {out['totales']['comentarios']} comentarios")


if __name__ == "__main__":
    main()
