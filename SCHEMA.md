# Esquema de una propuesta (data/propuestas/<eje>.json = lista de objetos)

```json
{
  "id": "IA-01",                       // prefijo del eje + correlativo 2 dígitos
  "eje": "ia",                          // ia | ciber | gob | conect | econ | talento
  "titulo": "Ley que ...",              // fórmula oficial "Ley que ..."
  "titulo_corto": "IA en el Estado",    // <= 6 palabras
  "sumilla": "1-2 frases: qué hace la ley",
  "problema": "Diagnóstico 120-220 palabras con cifras y su fuente en el texto (ej. 'según INEI ENAHO 2024...'). Sin cifras inventadas: si no hay dato verificable, describir cualitativamente.",
  "objeto": "Artículo 1 resumido",
  "articulado": [ {"n": "Artículo 1", "titulo": "Objeto", "texto": "..."} ],   // 6 a 12 artículos + disposiciones
  "disposiciones": [ {"tipo": "Complementaria Final", "n": "Primera", "texto": "Reglamentación en 90 días hábiles por ..."} ],
  "costo_beneficio": "Análisis costo-beneficio 80-150 palabras; indicar si genera gasto público y cómo se financia (pliego, sin demandar recursos adicionales al Tesoro, etc.)",
  "efecto_vigencia": "Qué normas modifica/complementa/deroga (solo normas reales).",
  "normas_relacionadas": [ {"norma": "Ley 31814, Ley que promueve el uso de la IA...", "url": "https://..."} ],
  "antecedentes": "Proyectos de ley previos (periodo 2021-2026) relacionados SOLO si se verificó su número; si no, 'Por verificar en SPLEY'.",
  "referencias_internacionales": [ {"pais": "Chile", "norma": "Ley 21.663 Marco de Ciberseguridad", "url": "https://..."} ],
  "comision_sugerida": "Ciencia, Innovación y Tecnología",   // comisión ordinaria dictaminadora principal
  "comision_secundaria": "Transportes y Comunicaciones",    // o null
  "plan2050": ["inteligencia-artificial", "peru-en-la-era-digital"],   // ids de data/plan2050_comisiones.json (1-3)
  "ods": [9, 16],
  "prioridad": "alta",                  // alta | media
  "costo_fiscal": "nulo",               // nulo | bajo | medio
  "plazo": "corto",                     // corto (<1 año implementar) | mediano | largo
  "indicador_exito": "Métrica verificable a 2031",
  "tags": ["datos", "Estado"],
  "fuentes": [ {"titulo": "...", "url": "https://..."} ]   // 2-5 URLs reales y verificadas
}
```

Reglas: anti-overclaiming (son PROPUESTAS ciudadanas, no proyectos presentados), no inventar números de ley ni de proyecto,
no duplicar lo que ya es ley vigente (en ese caso proponer modificación puntual citando la norma), no mencionar a ningún político,
español peruano formal legislativo, técnica legislativa del Manual de Técnica Legislativa del Congreso.

## Campos v2 (fase 2: editores tras la revisión especializada)

```json
"implicados": {
  "normas_modificadas": [ {"norma": "Ley 29733, Ley de Protección de Datos Personales", "articulo": "art. 32", "accion": "modifica | incorpora | deroga | complementa | eleva_rango", "url": "https://..."} ],
  "entidades": [ {"entidad": "Autoridad Nacional de Protección de Datos Personales (ANPD)", "sigla": "ANPD", "sector": "MINJUSDH",
                  "rol": "rectora | ejecutora | supervisora | sancionadora | financiadora | reglamentadora | regulada | beneficiaria | consultiva",
                  "responsabilidad": "Qué debe hacer concretamente según la ley (con artículo)"} ],
  "sujetos_obligados": "Quiénes deben cumplir (entidades públicas, empresas de X tamaño, operadores, etc.)",
  "beneficiarios": "Quiénes se benefician y cuántos aproximadamente (con fuente si hay cifra)"
},
"impacto": {
  "tipo": "neutro | gasto | inversion | ahorro | recaudacion | mixto",
  "costo_estado": {
    "rango": "S/ 0 | S/ 5–12 millones/año | No cuantificable con información pública",
    "horizonte": "anual | único | 2027-2031",
    "supuestos": "Supuestos explícitos del cálculo (n.º entidades, costo unitario, fuente del costo unitario)",
    "financiamiento": "Presupuesto institucional del pliego X sin demandar recursos adicionales al Tesoro | FITEL | tasas | APP | Obras por Impuestos | cooperación"
  },
  "beneficio_estado": "Ahorros, recaudación, eficiencia — cuantificado solo si hay base; si no, cualitativo",
  "beneficio_sociedad": "Beneficios para ciudadanos/empresas — cuantificado solo si hay base",
  "inversion_privada": "Inversión privada que podría movilizar (o 'no aplica')",
  "costo_privado": "Costos de cumplimiento para privados/sujetos obligados",
  "riesgos": "Riesgos de implementación o efectos no deseados",
  "confianza": "alta | media | baja"
},
"revision_atendida": [ {"especialidad": "constitucional", "severidad": "alta", "hallazgo": "resumen corto", "accion": "corregido | parcial | no_aplicado", "nota": "qué se cambió o por qué no"} ]
```

Reglas fase 2: toda cifra de costo/beneficio es ESTIMACIÓN con supuestos explícitos y "confianza"; nunca presentar
como dato oficial. Si no hay base para cuantificar, decirlo. Mantener `costo_fiscal` (nulo/bajo/medio) coherente con
`impacto.costo_estado.rango`.
