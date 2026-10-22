# Protocolo de priorización — Visión Perú 2036

**Visión (marco honesto):** que el Perú **lidere el crecimiento del PBI** entre las economías emergentes durante
2026–2036 (crecimiento real sostenido del orden de 6–7 % anual, como los episodios de Corea, Irlanda, Polonia, Vietnam
o el Chile de los 90) y **duplique su PBI per cápita al 2036**, con inclusión territorial. NO es "liderar el PBI
mundial" (el Perú es ~0,3 % de la economía mundial; eso no es alcanzable en 10 años). Verifica y cita las cifras base
que uses (FMI WEO, Banco Mundial, BCRP).

**Insumo:** `data/prioridad/insumo.json` (100 propuestas compactas; `borrador: true` = aún sin revisión jurídica).
Para detalle de una propuesta: `data/propuestas/<eje>.json` filtrando por id (no cargues todo).

**Salida:** `data/prioridad/<lente>.json` (solo tu archivo):
```json
{
  "lente": "economista_crecimiento",
  "criterios": [{"clave": "productividad", "descripcion": "...", "peso": 0.3}],
  "tesis": "250-400 palabras: qué debe priorizar el Perú para crecer como líder y por qué, con evidencia citada",
  "puntajes": [
    {"id": "IA-01", "criterios": {"productividad": 4, "...": 3}, "score": 72,
     "justificacion": "≤ 40 palabras, concreta", "habilita": ["IA-04"], "requiere": ["GOB-01"]}
  ],
  "vacios": [{"titulo": "Ley que ...", "por_que": "qué falta para la visión", "eje_sugerido": "econ"}],
  "fuentes": [{"titulo": "...", "url": "https://..."}]
}
```
- Puntúa las **100** propuestas. Criterios en escala 1–5; `score` 0–100 = promedio ponderado normalizado por tus pesos.
- `habilita`/`requiere`: solo relaciones reales y fuertes entre propuestas (máx. 4 por propuesta); se usan para dibujar
  la red de la visión. Si tu lente no es de dependencias, puedes dejarlas vacías.
- `vacios`: 3–8 propuestas que FALTAN para la visión (sin duplicar las 100).
- Escribe el archivo de forma incremental (cada ~25 propuestas). Usa una carpeta propia en el scratchpad para scripts.
- Anti-overclaiming: no inventes cifras; si estimas, dilo. Sin nombres de políticos ni partidos.
