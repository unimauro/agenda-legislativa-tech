# Protocolo de revisión especializada (fase 1: solo lectura)

Cada revisor lee las propuestas de SUS ejes (`data/propuestas/<eje>.json`, NO las modifica) y escribe UN archivo
`data/revision/<especialidad>_<parte>.json` (lista JSON, un objeto por propuesta revisada):

```json
{
  "id": "IA-07",
  "especialidad": "constitucional",
  "veredicto": "conforme | observaciones | observaciones_graves",
  "resumen": "1-3 frases con la opinión del especialista",
  "hallazgos": [
    {
      "severidad": "alta | media | baja",
      "ubicacion": "Artículo 4.1 | Exposición de motivos | Disposición Complementaria Final Segunda | costo_beneficio",
      "problema": "Qué está mal y por qué (cita la norma/principio/jurisprudencia).",
      "correccion": "Texto de reemplazo concreto o instrucción precisa aplicable por un editor."
    }
  ],
  "aportes": {
    "normas_a_modificar": ["Ley 29733, art. 32 (modifica)"],
    "entidades_implicadas": ["ANPD/MINJUSDH — supervisora"],
    "impacto_economico": "Notas sobre costo/inversión/ahorro para el Estado o la sociedad, con supuestos"
  }
}
```

`aportes` es opcional; úsalo cuando tu especialidad detecte normas, entidades o efectos económicos que faltan.

Reglas
- Escribe el archivo de forma INCREMENTAL (reescríbelo completo tras cada 3-4 propuestas) para no perder trabajo.
- Lee cada propuesta por separado con python (p. ej. `python3 -c "import json;p=[x for x in json.load(open('data/propuestas/ia.json')) if x['id']=='IA-07'][0];print(json.dumps(p,ensure_ascii=False,indent=1))"`), no cargues los 6 archivos completos.
- Severidad alta = inconstitucional, ilegal, contradice norma vigente, inaplicable, crea gasto prohibido (art. 79), viola reserva de ley orgánica, riesgo de seguridad grave, o cita una norma inexistente/mal numerada.
- Sé concreto: cada hallazgo con corrección aplicable. Nada genérico ("mejorar redacción").
- Verifica en web lo que dudes (El Peruano, SPIJ, gob.pe, TC: tc.gob.pe). No inventes sentencias ni números; si no puedes verificar, dilo.
- Contexto vigente: Congreso bicameral 2026–2031 (Ley 31988; Reglamentos RL 004/005/006 de 2026 — ver `data/contexto_legislativo.json`); marco tech en `data/marco_normativo.json`.
- No menciones políticos. Español jurídico peruano.
- Al terminar responde: n.º revisadas, conteo por veredicto, y los 5 hallazgos más graves.
