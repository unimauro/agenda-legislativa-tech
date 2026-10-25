# Encargo: 28 propuestas nuevas desde los vacíos de la Visión 2036

Repo: /Users/unimauro/Documents/Repos/agenda-legislativa-tech (sitio cívico "Agenda Legislativa Tech", Congreso bicameral 2026–2031).
Asignación por grupo: `data/nuevas/encargo.json` (cada ítem: id, eje y el/los vacíos de origen con su "por_que").

## Fase 1 — Redactores (cada uno dueño de UN archivo `data/nuevas/<grupo>.json`, lista JSON)
- Lee ANTES: SCHEMA.md (campos v1 + v2 `implicados` e `impacto`), COORDINACION.md (criterios transversales OBLIGATORIOS:
  sin iniciativa de gasto art. 79, no crear organismos/pliegos, leyes orgánicas, tributos art. 74/Norma VII, técnica
  legislativa), `data/contexto_legislativo.json` (nombres oficiales de comisiones de la Cámara de Diputados 2026–2031),
  `data/marco_normativo.json`, `data/plan2050_comisiones.json` (ids válidos para `plan2050`).
- Mira 1 propuesta existente como modelo de nivel y extensión (p. ej. ECO-14 en data/propuestas/econ.json): 7–12 artículos,
  disposiciones, problema 120–220 palabras con cifras con fuente nombrada, 2–5 fuentes con URL real.
- NO dupliques materias ya cubiertas: revisa títulos/sumillas existentes con
  `python3 -c "import json,glob;[print(p['id'],p['titulo_corto'],'|',p['sumilla'][:120]) for f in sorted(glob.glob('data/propuestas/*.json')) for p in json.load(open(f))]"`
  y remite a la propuesta dueña (ver tabla de COORDINACION.md) en vez de repetirla. Si una ley vigente ya regula algo,
  propone modificación puntual citando la norma real.
- Cuando el vacío pida "crear" una entidad u oficina: reformula (fortalece órgano existente, o "encarga al Poder
  Ejecutivo evaluar y, de ser el caso, proponer"). En el Congreso (GOB-16), puede proponerse como órgano del
  servicio parlamentario vía modificación del Reglamento/normas internas — indica el instrumento correcto.
- Verifica en la web lo que cites (El Peruano, SPIJ, gob.pe, congreso.gob.pe, leyes extranjeras oficiales). Nunca
  inventes números de ley, artículos, proyectos ni cifras; si no puedes verificar: "por verificar" o cualitativo.
- Campos: todos los del SCHEMA v1 + `implicados` + `impacto` (v2). NO pongas `revision_atendida` todavía.
  `eje` = valor del encargo. `antecedentes`: "Por verificar en SPLEY" salvo que verifiques.
- Escribe el archivo INCREMENTALMENTE (reescríbelo completo tras cada propuesta) y valida con `python3 -m json.tool`.
- No menciones políticos. Español jurídico peruano. Son PROPUESTAS ciudadanas, no proyectos presentados.
- No toques ningún otro archivo del repo. No hagas git.
- Al terminar responde en ≤10 líneas: ids redactados, decisiones de reformulación relevantes y dudas.

## Fase 2 — Revisores (solo lectura de data/nuevas/*.json)
Siguen REVISION.md y escriben `data/revision/<especialidad>_D.json`.

## Fase 3 — Editores (los mismos redactores)
Aplican hallazgos de `data/revision/*_D.json` a SU archivo y agregan `revision_atendida` (formato SCHEMA v2).

## Fase 3 — Instrucciones de edición (vigentes)
1. Lee TODOS los hallazgos de tus ids en data/revision/{constitucional,jurista,tecnologico,seguridad,normativo}_D.json
   (filtra por id con python). Aplica TODOS los de severidad alta y media; los de severidad baja, cuando sean concretos.
   Si dos revisores se contradicen, prima: constitucional > jurista > normativo > seguridad > tecnológico, salvo en
   seguridad de datos, donde prima la opción más protectora.
2. Agrega `revision_atendida` (formato SCHEMA v2) con un objeto por hallazgo alto o medio (y por los bajos que apliques):
   especialidad, severidad, hallazgo (corto), accion (corregido | parcial | no_aplicado) y nota. Todo "no_aplicado" debe
   tener una razón jurídica.
3. Decisiones transversales:
   - Cada propuesta debe aplicarse SOLA: nada de remitir a "la ley especial de…" o a otra propuesta como si existiera.
     Usa "la norma que regule la materia" o la norma vigente.
   - Las infracciones van tipificadas en la propia ley (o incorporadas a la norma sancionadora existente), con autoridad
     competente. Nada de remisión genérica.
   - El TUO de la Ley 27444 es el D.S. 006-2026-JUS; el TUO de la Ley 27806 es el D.S. 021-2019-JUS. Si no verificaste un
     número de artículo, cita el principio sin número.
   - Bicameralidad: "las comisiones competentes de ambas cámaras", no "la comisión competente".
   - Consulta previa: GOB-21, GOB-23 y SOB-11 (en lo que afecte conocimientos colectivos) deben decir en
     efecto_vigencia y en la exposición de motivos que REQUIEREN consulta previa (Convenio 169, art. 6) antes de la
     votación en el Pleno.
   - Datos sensibles (lengua, etnia, discapacidad, polígonos de parcela, actas con DNI): consentimiento expreso y por
     escrito (Ley 29733), versión pública y acceso restringido.
   - Corrige las URLs que el normativo marcó como erróneas, usando las URLs correctas que él indica.
4. Al terminar valida con json.tool y responde en ≤8 líneas: cuántos hallazgos corregidos, parciales y no aplicados, y
   lo que quede pendiente.
