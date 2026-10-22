"""Antecedentes legislativos reales en tecnología (SPLEY, Congreso del Perú).

Descarga TODOS los proyectos de ley de los periodos parlamentarios indicados
(perParId 2021 = 2021-2026; perParId 2026 = 2026-2031, consultando por separado
codTipoParl = C/D/S: Congreso, Cámara de Diputados y Senado) desde la API pública del
Sistema de Proyectos de Ley (SPLEY) y filtra los de tecnología por palabras
clave en el título. Luego cruza la comisión asignada consultando la misma API
con el filtro comisionId.

Fuente: POST https://api.congreso.gob.pe/spley-portal-service/proyecto-ley/lista-con-filtro
        GET  https://api.congreso.gob.pe/spley-portal-service/comisiones
(mismo método que congreso-abierto-peru/pipeline/scrapers/proyectos_ley.py)

Uso (desde la raíz del repo):
    python3 -m venv .venv && .venv/bin/pip install requests
    .venv/bin/python scripts/build_antecedentes.py

Limitaciones honestas:
- El filtro es por palabras clave en el TÍTULO: puede haber falsos positivos
  (p. ej. creación de universidades "tecnológicas") y falsos negativos (proyectos
  tech con títulos genéricos). Cada proyecto conserva su título para revisión.
- "comision" = comisiones a las que la API asocia el proyecto (puede ser más de
  una, o ninguna si aún no fue decretado).
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import unicodedata
from collections import Counter, defaultdict
from datetime import date

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

API_BASE = "https://api.congreso.gob.pe/spley-portal-service"
LISTA = f"{API_BASE}/proyecto-ley/lista-con-filtro"
COMISIONES = f"{API_BASE}/comisiones"
PORTAL = "https://wb2server.congreso.gob.pe/spley-portal/#/{ruta}/expediente/{per}/{num}"
# (perParId, codTipoParl, etiqueta del periodo, cámara/ámbito, ruta del portal)
# codTipoParl: C = Congreso (unicameral 2021-2026 / trámites del Congreso bicameral),
#              D = Cámara de Diputados, S = Senado (desde 2026).
BLOQUES = [
    (2021, "C", "2021-2026", "Congreso (unicameral)", "congreso"),
    (2026, "C", "2026-2031", "Congreso de la República (bicameral)", "congreso"),
    (2026, "D", "2026-2031", "Cámara de Diputados", "diputados"),
    (2026, "S", "2026-2031", "Senado", "senado"),
]
PRIMER_ID_COMISION_BICAMERAL = 60  # ids >= 60 en /comisiones corresponden al periodo 2026-2031
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "antecedentes.json")

ESTADOS_LEY = ("PUBLICAD", "PROMULGAD")  # AUTÓGRAFA aún no es ley vigente


def norm(s: str) -> str:
    """Mayúsculas sin tildes para comparar."""
    s = unicodedata.normalize("NFD", (s or "").upper())
    return "".join(c for c in s if unicodedata.category(c) != "Mn")


# (tema, [regex sobre título normalizado]). Orden = prioridad (gana el primero).
TEMAS: list[tuple[str, list[str]]] = [
    ("Educación superior tecnológica (creación/conversión de institutos y universidades)", [
        r"(CREA|CREACION|CONVERSION|CONVIERTE|DENOMINA|AMPLIA|CARRERAS|FUNCIONAMIENTO|ADECUACION|"
        r"CONSTRUCCION|EQUIPAMIENTO|INFRAESTRUCTURA|IMPLEMENTACION)"
        r".{0,140}\b(INSTITUTO|INSTITUTOS|UNIVERSIDAD|ESCUELA)\b.{0,80}"
        r"(TECNOLOGIC|CIENCIA|CIENTIFIC|INNOVACION|INGENIERIA)"]),
    ("Inteligencia artificial y algoritmos", [
        r"INTELIGENCIA ARTIFICIAL", r"\bALGORITM", r"\bROBOTIC", r"AUTOMATIZACION"]),
    ("Ciberseguridad y delitos informáticos", [
        r"CIBER", r"DELITOS? INFORMATIC", r"INFORMATICA FORENSE", r"FRAUDES? INFORMATIC", r"HACKE", r"SUPLANTACION DE IDENTIDAD",
        r"GROOMING", r"FRAUDE ELECTRONICO", r"FRAUDE DIGITAL"]),
    ("Datos personales y privacidad", [
        r"DATOS PERSONALES", r"PROTECCION DE DATOS", r"PRIVACIDAD", r"BIOMETRIC",
        r"VIDEOVIGILANCIA"]),
    ("Telecomunicaciones, conectividad y espectro", [
        r"TELECOMUNICACION", r"BANDA ANCHA", r"\bINTERNET\b", r"CONECTIVIDAD", r"FIBRA OPTICA",
        r"TELEFONIA", r"ESPECTRO RADIOELECTRICO", r"RADIODIFUSION",
        r"\bANTENAS?\b", r"\b5G\b", r"SERVICIOS? MOVIL", r"OPERADORES? MOVIL", r"\bFITEL\b",
        r"\bPRONATEL\b", r"TELEVISION DIGITAL"]),
    ("Espacio y satélites", [
        r"SATELITAL", r"\bSATELITES? (ARTIFICIAL|DE OBSERVACION|DE COMUNICACION)",
        r"(AGENCIA|PUERTO|ZONA FRANCA|ACTIVIDAD(ES)?|POLITICA|PROGRAMA) ESPACIAL",
        r"ACTIVIDADES ESPACIALES", r"\bCONIDA\b", r"AEROESPACIAL", r"ULTRATERRESTRE"]),
    ("Economía digital, fintech y comercio electrónico", [
        r"COMERCIO ELECTRONICO", r"\bFINTECH", r"CRIPTO", r"ACTIVOS? VIRTUAL",
        r"PLATAFORMAS? DIGITAL", r"ECONOMIA DIGITAL", r"PAGOS? DIGITAL", r"DINERO ELECTRONICO",
        r"BILLETERAS? (ELECTRONIC|DIGITAL)", r"\bSTARTUP", r"EMPRENDIMIENTOS? (DINAMIC|INNOVADOR)",
        r"FACTURA(CION)? ELECTRONICA", r"FINANCIAMIENTO COLECTIVO", r"CROWDFUNDING",
        r"MONEDA DIGITAL", r"APLICATIVOS?", r"\bAPPS?\b", r"DELIVERY"]),
    ("Teletrabajo y trabajo digital", [r"TELETRABAJO", r"TRABAJO REMOTO", r"DESCONEXION DIGITAL"]),
    ("Salud digital", [r"TELESALUD", r"TELEMEDICINA", r"HISTORIA CLINICA (ELECTRONICA|DIGITAL)",
                       r"RECETA (ELECTRONICA|DIGITAL)"]),
    ("Gobierno digital y servicios públicos digitales", [
        r"GOBIERNO DIGITAL", r"GOBIERNO ELECTRONICO", r"FIRMAS? DIGITAL", r"FIRMAS? ELECTRONICA",
        r"CERTIFICADOS? DIGITAL", r"IDENTIDAD DIGITAL", r"\bDNI ELECTRONICO", r"INTEROPERABILIDAD",
        r"TRANSFORMACION DIGITAL", r"DIGITALIZ", r"EXPEDIENTE (JUDICIAL )?ELECTRONICO",
        r"NOTIFICACION(ES)? ELECTRONICA", r"CASILLA ELECTRONICA", r"VOTO (ELECTRONICO|DIGITAL)",
        r"MESA DE PARTES (DIGITAL|VIRTUAL)", r"DATOS ABIERTOS", r"\bVIRTUAL(ES)?\b",
        r"MEDIOS? (DIGITAL|ELECTRONIC|TECNOLOGIC)", r"\bDIGITAL(ES)?\b", r"ELECTRONIC"]),
    ("Educación y talento digital", [
        r"ALFABETIZACION DIGITAL", r"COMPETENCIAS DIGITAL", r"HABILIDADES DIGITAL",
        r"EDUCACION DIGITAL", r"\bPROGRAMACION (INFORMATICA|DE COMPUTADORAS|Y ROBOTICA)",
        r"PENSAMIENTO COMPUTACIONAL", r"BRECHA DIGITAL", r"\bTABLETAS?\b", r"\bSTEM\b",
        r"\bSTEAM\b", r"ENTORNOS? VIRTUAL", r"EDUCACION (A DISTANCIA|VIRTUAL)"]),
    ("Ciencia, tecnología e innovación (CTI)", [
        r"\bCIENCIA\b", r"CIENTIFIC", r"\bCTI\b", r"\bCONCYTEC\b", r"\bSINACTI\b",
        r"INNOVACION", r"TECNOLOG", r"INVESTIGACION Y DESARROLLO", r"\bI\+D", r"PROPIEDAD INTELECTUAL",
        r"PATENTE", r"SOFTWARE", r"TRANSFERENCIA TECNOLOGICA", r"BIOTECNOLOG",
        r"NANOTECNOLOG", r"\bTIC\b", r"\bTICS\b"]),
]
_COMPILADOS = [(t, [re.compile(p) for p in pats]) for t, pats in TEMAS]

# Exclusiones de falsos positivos frecuentes (se evalúan antes del tema).
EXCLUIR = [re.compile(p) for p in (
    r"APARATOS ELECTRICOS Y ELECTRONICOS",  # residuos RAEE: ambiental, no tech
    r"SALIR DEL TERRITORIO NACIONAL",        # autorizaciones de viaje
    r"CIENCIAS FORENSES",
    r"PARTIDAS? ELECTRONICAS? N",            # partidas registrales en expropiaciones                    # régimen laboral de Medicina Legal
)]


_INSTITUCIONAL = TEMAS[0][0]
_ESPECIFICO = re.compile(r"INTELIGENCIA ARTIFICIAL|CIBER|DATOS PERSONALES|DIGITAL|SOFTWARE|"
                         r"TELECOMUNICACION|INTERNET|ROBOTIC|ESPACIAL|SATELITAL")


def clasificar(titulo: str) -> str | None:
    t = norm(titulo)
    if any(e.search(t) for e in EXCLUIR):
        return None
    for tema, pats in _COMPILADOS:
        if tema == _INSTITUCIONAL and _ESPECIFICO.search(t):
            continue  # p.ej. "universidad ... de inteligencia artificial": tema específico
        if any(p.search(t) for p in pats):
            return tema
    return None


def session() -> requests.Session:
    s = requests.Session()
    retry = Retry(total=5, backoff_factor=1.5, status_forcelist=(429, 500, 502, 503, 504),
                  allowed_methods=frozenset(["GET", "POST"]))
    s.mount("https://", HTTPAdapter(max_retries=retry))
    s.headers.update({
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "es-PE,es;q=0.9",
    })
    return s


def filtro(per: int, cod: str, comision_id: int | None = None) -> dict:
    return {"perParId": per, "codTipoParl": cod, "perLegId": None, "comisionId": comision_id,
            "estadoId": None, "grupParId": None, "tipoFirmanteId": None, "congresistaId": None,
            "texto": None, "fechaPresentacion": None, "numeroProyecto": None}


def lista(s: requests.Session, per: int, cod: str, comision_id: int | None = None) -> list[dict]:
    r = s.post(LISTA, params={"pageSize": 100000, "page": 1, "rowStart": 0},
               json=filtro(per, cod, comision_id), timeout=180)
    r.raise_for_status()
    payload = r.json()
    if payload.get("code") != 200:
        raise RuntimeError(f"API code {payload.get('code')}: {payload.get('status')}")
    return (payload.get("data") or {}).get("proyectos") or []


def main() -> int:
    s = session()
    errores: list[str] = []
    total_por_bloque: dict[str, int] = {}
    total_por_periodo: dict[str, int] = defaultdict(int)
    tech: dict[tuple[int, str, int], dict] = {}
    ok_bloques = []

    for per, cod, etiqueta, camara, ruta in BLOQUES:
        print(f"[*] periodo {per} codTipoParl={cod} ({camara})...", file=sys.stderr)
        try:
            rows = lista(s, per, cod)
        except Exception as e:  # documentar el error real, no inventar
            errores.append(f"perParId={per} codTipoParl={cod}: {type(e).__name__}: {e}")
            print(f"    ERROR {e}", file=sys.stderr)
            continue
        ok_bloques.append((per, cod))
        total_por_bloque[f"{etiqueta} | {camara}"] = len(rows)
        total_por_periodo[etiqueta] += len(rows)
        print(f"    {len(rows)} proyectos", file=sys.stderr)
        for r in rows:
            tema = clasificar(r.get("titulo") or "")
            if not tema:
                continue
            fecha = r.get("fecPresentacion") or ""
            num = int(r.get("pleyNum"))
            tech[(per, cod, num)] = {
                "codigo": r.get("proyectoLey", ""),
                "periodo": etiqueta,
                "camara": camara,
                "fecha": fecha.split("T")[0] if "T" in fecha else fecha,
                "titulo": " ".join((r.get("titulo") or "").split()),
                "estado": (r.get("desEstado") or "").strip(),
                "proponente": (r.get("desProponente") or "").strip(),
                "comision": [],
                "tema": tema,
                "url": PORTAL.format(ruta=ruta, per=per, num=num),
            }
            # En 2026-2031 hay "actualizaciones" de proyectos del periodo anterior
            # (2.a DCT del Reglamento del Congreso o acuerdo de Junta de Portavoces).
            m = re.search(r"ANTES\s+PL\s*N?[°º]?\s*([0-9]+/[0-9]{4}-[A-Z]+)", norm(r.get("titulo") or ""))
            if m:
                tech[(per, cod, num)]["actualiza_pl"] = m.group(1)

    # Cruce de comisiones (dato real de la API, filtro comisionId).
    try:
        comisiones = s.get(COMISIONES, timeout=60).json().get("data") or []
    except Exception as e:
        comisiones = []
        errores.append(f"comisiones: {type(e).__name__}: {e}")
    for per, cod in ok_bloques:
        for c in comisiones:
            cid = c["comisionId"]
            if (per >= 2026) != (cid >= PRIMER_ID_COMISION_BICAMERAL):
                continue
            try:
                rows = lista(s, per, cod, cid)
            except Exception as e:
                errores.append(f"perParId={per} codTipoParl={cod} comisionId={cid}: {e}")
                continue
            for r in rows:
                k = (per, cod, int(r.get("pleyNum")))
                if k in tech and c["nombreComision"] not in tech[k]["comision"]:
                    tech[k]["comision"].append(c["nombreComision"])
            if rows:
                print(f"    {per}{cod} com {cid:>2} {c['nombreComision'][:40]:<40} {len(rows)}",
                      file=sys.stderr)
            time.sleep(0.2)

    proyectos = sorted(tech.values(), key=lambda p: (p["fecha"], p["codigo"]), reverse=True)
    for p in proyectos:
        p["comision"] = "; ".join(p["comision"]) or None
        p["es_ley"] = any(k in norm(p["estado"]) for k in ESTADOS_LEY)

    n_tema = Counter(p["tema"] for p in proyectos)
    leyes_tema = Counter(p["tema"] for p in proyectos if p["es_ley"])
    por_tema = [{"tema": t, "n": n, "leyes": leyes_tema.get(t, 0)} for t, n in n_tema.most_common()]
    por_estado = [{"estado": e, "n": n} for e, n in Counter(p["estado"] for p in proyectos).most_common()]
    por_periodo = defaultdict(int)
    for p in proyectos:
        por_periodo[p["periodo"]] += 1

    out = {
        "meta": {
            "fuente": "API SPLEY del Congreso de la República del Perú "
                      "(api.congreso.gob.pe/spley-portal-service/proyecto-ley/lista-con-filtro)",
            "fecha_consulta": date.today().isoformat(),
            "periodos": sorted({b[2] for b in BLOQUES}),
            "total_proyectos_periodo": dict(total_por_periodo),
            "total_proyectos_por_camara": total_por_bloque,
            "total_tech": len(proyectos),
            "total_tech_por_periodo": dict(por_periodo),
            "total_tech_por_camara": dict(Counter(p["camara"] for p in proyectos)),
            "leyes_tech": sum(1 for p in proyectos if p["es_ley"]),
            "metodo": "Filtro por palabras clave en el título (ver scripts/build_antecedentes.py). "
                      "El tema 'Educación superior tecnológica (creación/conversión...)' agrupa leyes "
                      "institucionales (crear institutos/universidades tecnológicas): no son política "
                      "tecnológica sustantiva y conviene excluirlas en análisis temáticos. "
                      "Puede incluir falsos positivos y omitir proyectos tech con títulos genéricos. "
                      "'leyes' = estado contiene PUBLICADA/PROMULGADA (no cuenta AUTÓGRAFA). "
                      "Desde 2026 la API separa expedientes por codTipoParl: D (Cámara de Diputados), "
                      "S (Senado) y C (Congreso: leyes presupuestales/trámites bicamerales). "
                      "'comision' = comisiones asociadas por la API (filtro comisionId). "
                      "'url' = enlace profundo al portal SPLEY (aplicación de página única: el "
                      "servidor responde 200 a la ruta base; el expediente lo resuelve el navegador). "
                      "'actualiza_pl' = número del proyecto del periodo anterior que se actualiza.",
            "actualizaciones_2026_tech": sum(1 for p in proyectos if p.get("actualiza_pl")),
            "errores": errores,
        },
        "por_tema": por_tema,
        "por_estado": por_estado,
        "proyectos": proyectos,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"[ok] {len(proyectos)} proyectos tech -> {OUT}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
