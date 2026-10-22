"""Consolida los 5 lentes prospectivos (data/prioridad/<lente>.json) en data/prioridad.json.

- Score consolidado = promedio simple del PERCENTIL de cada propuesta dentro de cada lente (0-100). Así ningún lente
  pesa más por usar una escala más generosa.
- Olas: las del lente implementacion_estado (secuencia por dependencias y viabilidad).
- Aristas de la esfera: relaciones habilita/requiere del lente de implementación, más las que mencionan ≥2 lentes.
- Vacíos: unión de los vacíos de todos los lentes, fusionando títulos muy parecidos.
"""
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NOMBRES = {"economista_crecimiento": "Crecimiento económico", "prospectiva_tecnologica": "Prospectiva tecnológica",
           "implementacion_estado": "Implementación en el Estado", "geoeconomia": "Geoeconomía",
           "desarrollo_territorial": "Desarrollo humano y territorial"}
OLAS = [("ola_1_100_dias", "Ola 1 · Primeros 100 días"), ("ola_2_2027", "Ola 2 · 2027"),
        ("ola_3_2028_2029", "Ola 3 · 2028–2029"), ("ola_4_2030_2031", "Ola 4 · 2030–2031")]


def norm(t):
    t = unicodedata.normalize("NFD", t or "").encode("ascii", "ignore").decode().lower()
    return set(w for w in re.findall(r"[a-z]{4,}", t) if w not in {"para", "que", "con", "como", "sobre", "entre", "desde"})


def main():
    lentes = {}
    for k in NOMBRES:
        f = ROOT / f"data/prioridad/{k}.json"
        if f.exists():
            lentes[k] = json.loads(f.read_text())
    ids = [p["id"] for p in json.loads((ROOT / "data/prioridad/insumo.json").read_text())]

    pct = defaultdict(dict)
    for k, L in lentes.items():
        sc = {x["id"]: x["score"] for x in L.get("puntajes", []) if x.get("id") in ids}
        orden = sorted(sc.values())
        for i, v in sc.items():
            # percentil con empates: proporción de propuestas con score menor + mitad de las iguales
            menor, igual = sum(1 for o in orden if o < v), sum(1 for o in orden if o == v)
            pct[i][k] = round(100 * (menor + igual / 2) / len(orden), 1)
    ranking = []
    for i in ids:
        vals = list(pct[i].values())
        if vals:
            ranking.append({"id": i, "score": round(sum(vals) / len(vals), 1), "por_lente": pct[i],
                            "crudo": {k: next((x["score"] for x in L["puntajes"] if x["id"] == i), None) for k, L in lentes.items()}})
    ranking.sort(key=lambda r: -r["score"])

    impl = lentes.get("implementacion_estado", {})
    olas = {}
    for k, nombre in OLAS:
        o = (impl.get("olas") or {}).get(k)
        if o is not None:
            ids_o = o if isinstance(o, list) else o.get("ids", [])
            crit = "" if isinstance(o, list) else o.get("criterio", "")
            olas[k] = {"nombre": nombre, "ids": [i for i in ids_o if i in ids], "criterio": crit}
    if impl.get("olas_criterio"):
        pass

    menciones = Counter()
    for k, L in lentes.items():
        for x in L.get("puntajes", []):
            for h in x.get("habilita") or []:
                if h in ids and h != x["id"]:
                    menciones[(x["id"], h, k == "implementacion_estado")] += 1
            for r in x.get("requiere") or []:
                if r in ids and r != x["id"]:
                    menciones[(r, x["id"], k == "implementacion_estado")] += 1
    pares = Counter()
    de_impl = set()
    for (a, b, es_impl), n in menciones.items():
        pares[(a, b)] += n
        if es_impl:
            de_impl.add((a, b))
    aristas = sorted({(a, b) for (a, b), n in pares.items() if (a, b) in de_impl or n >= 2})

    vacios = []
    for k, L in lentes.items():
        for v in L.get("vacios", []):
            t = norm(v.get("titulo", "") + " " + v.get("por_que", ""))
            dup = next((x for x in vacios if len(t & x["_t"]) / max(1, len(t | x["_t"])) > 0.12), None)
            if dup:
                dup["lentes"].append(NOMBRES[k])
                dup["_t"] |= t
            else:
                vacios.append({"titulo": v.get("titulo"), "por_que": v.get("por_que"), "eje_sugerido": v.get("eje_sugerido"),
                               "lentes": [NOMBRES[k]], "_t": t})
    for v in vacios:
        v.pop("_t")
    vacios.sort(key=lambda v: -len(v["lentes"]))

    out = {
        "vision": "Que el Perú lidere el crecimiento del PBI entre las economías emergentes 2026–2036 (meta realista: 5–6 % sostenido) y converja a ingreso alto, con inclusión territorial.",
        "metodo": "Consolidado = promedio del percentil de cada propuesta dentro de cada uno de los lentes disponibles (pesos iguales). Puntajes de los lentes = juicio experto asistido por IA con criterios explícitos, no estimaciones econométricas.",
        "olas_criterio": impl.get("olas_criterio") or "Secuencia propuesta por el lente de implementación: primero lo habilitador, barato y viable; luego lo que depende de ello.",
        "lentes": [{"lente": k, "nombre": NOMBRES[k], "tesis": L.get("tesis"), "criterios": L.get("criterios"), "fuentes": L.get("fuentes", [])[:12],
                    "escenarios": L.get("escenarios_2036")} for k, L in lentes.items()],
        "ranking": ranking, "olas": olas, "aristas": aristas, "vacios": vacios,
    }
    (ROOT / "data/prioridad.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
    print(f"OK: {len(lentes)} lentes, {len(ranking)} en ranking, {len(olas)} olas, {len(aristas)} aristas, {len(vacios)} vacíos")


if __name__ == "__main__":
    main()
