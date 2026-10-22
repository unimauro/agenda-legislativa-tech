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
