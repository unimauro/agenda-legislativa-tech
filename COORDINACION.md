# Decisiones de coordinación (fase 2: editores)

Cada editor es dueño de UN archivo `data/propuestas/<eje>.json`. Estas decisiones resuelven cruces entre ejes;
aplícalas aunque un revisor haya sugerido otra cosa. Si una propuesta depende de una figura creada en otra
propuesta, debe poder aplicarse sola: usa "el instrumento que haga sus veces" o remite a la norma vigente.

## Criterios transversales (obligatorios)
1. **Iniciativa de gasto (art. 79 + STC 00018-2023-PI/TC, Sentencia 158/2026, fund. 113-118):** ninguna propuesta
   puede imponer gasto presente o futuro. Si la medida necesita recursos: (a) reformular como meta indicativa dentro
   de la programación multianual, sujeta a disponibilidad presupuestal, o (b) mantenerla pero declarar en
   `impacto.costo_estado.financiamiento` y en la exposición de motivos que "requiere coordinación con el Poder Ejecutivo,
   fuente de financiamiento identificada e informe previo de sostenibilidad fiscal del MEF antes del dictamen". Ajusta
   `costo_fiscal` en consecuencia.
2. **No crear organismos nuevos ni pliegos** (art. 28 Ley 29158, iniciativa del Ejecutivo). Reformular como
   fortalecimiento/autonomía técnica-funcional de un órgano existente, o como disposición que "encarga al Poder
   Ejecutivo evaluar y, de ser el caso, proponer". Aplica a IA-11 (ANPD), CIB-01 (agencia ciber), CON-08 (CONIDA ya
   es la agencia espacial: DL 1134 art. 19; Ley 32571), y cualquier otra.
3. **Leyes orgánicas (art. 106; mayoría calificada en ambas cámaras):** cuando se toquen JNE/ONPE/RENIEC, PJ, MP, SBS
   (Ley 26702), gobiernos regionales/locales, etc., modificar expresamente la ley orgánica y anotarlo en
   `efecto_vigencia` ("requiere votación de ley orgánica").
4. **Tributos y beneficios tributarios:** tasa y elementos esenciales en la ley (art. 74); beneficios con Norma VII
   del Código Tributario (máx. 3 años, una sola prórroga) e informe previo MEF. ECO-11: la plataforma solo actúa como
   agente de retención de aportes elegidos por el trabajador; no hay contribución nueva.
5. **Reserva tributaria y secreto bancario (art. 2.5):** no publicar información individual de contribuyentes (ECO-14:
   solo agregados o autodeclaración de la empresa). ECO-06: excepción expresa al art. 140 Ley 26702 con consentimiento.
6. **Leyes derogadas:** Ley 28303 y Ley 28613 fueron derogadas por Ley 31250 (modificada por DL 1727). Ley 29868
   derogada por Ley 30228. Ley 29022 vigente hasta ~2032 por Ley 31456. Constitución art. 14-A (Ley 31878) ya
   garantiza el acceso a internet. Ley 30096 art. 11 numeral 5 ya fue ocupado por Ley 32314 → usar numeral 6.
7. **Técnica legislativa (Guía de la Cámara de Diputados, ago-2026):** "Se modifica…/Se incorpora…", texto íntegro del
   artículo modificado, artículos incorporados 4-A/4-B, orden DCF → DCT → DCM → DCD, derogación expresa, reglamentación
   a cargo del Poder Ejecutivo, régimen sancionador tipificado en la ley con autoridad competente (TUO Ley 27444 art. 248).
8. **Datos y seguridad:** aplicar las correcciones de seguridad de alta severidad (excepciones de publicidad para
   personal de inteligencia/PNP/FFAA/INPE/fiscales en GOB-05; evaluación de reidentificación en IA-04; control de
   accesos y bitácora en interoperabilidad GOB-01 y salud TAL-06; no criminalizar la investigación de seguridad de
   buena fe en CIB-04/IA-10; no apagones de internet en CON-01).
9. **Comisiones:** usar los nombres oficiales de las 16 comisiones de la Cámara de Diputados 2026–2031
   (`data/contexto_legislativo.json` → comisiones_diputados). "Presupuesto" no dictamina leyes ordinarias.

## Reparto de materias entre propuestas (quién es "dueño")
| Materia | Dueño | Las demás… |
|---|---|---|
| Datos abiertos y sus excepciones | IA-04 | CON-09, TAL-08/09/10, GOB-11 remiten al régimen de IA-04 |
| Portabilidad de datos | IA-12 (regla general, Ley 29733) | ECO-06 = regla especial financiera; TAL-06 remite a IA-12 |
| Gestión algorítmica del trabajo | IA-13 | ECO-11 remite a IA-13 |
| Infraestructura crítica | Régimen ACN (DS 106-2017-PCM) + CIB-02 | CON-10, CON-11, CON-14 remiten; no crean categorías nuevas |
| Notificación de incidentes | CIB-03 | sin plazos propios en otras |
| Conectividad de escuelas y postas (metas) | CON-13 | TAL-01, CON-03 remiten |
| Alertas tempranas y SISMATE (Ley 30472) | TAL-10 | CON-14 se limita a resiliencia de redes y remite a TAL-10 |
| Datos de transporte (GTFS) | GOB-11 | TAL-11 remite a GOB-11 |
| Iniciación de pagos | ECO-06 (registro/supervisión SBS) | ECO-07 = estándares técnicos de interoperabilidad del BCRP para sistemas de pago, sin registro propio |
| Registro de empresas tech | ECO-13 | ECO-01 remite |
| Accesibilidad digital (estándar y plazos) | TAL-13 | GOB-09, TAL-02 remiten |
| Currículo digital/IA | TAL-01 | TAL-14, CIB-10, TAL-05 remiten |
| Criterio de género en becas STEM | TAL-05 | TAL-03 remite |
| Recursos de espectro | CON-06 no reduce aportes al fondo de servicio universal (CON-02) | — |

## Decisiones adicionales (cruces detectados por concordancia normativa A)
10. **TUO de la Ley 27444:** el D.S. 004-2019-JUS fue sustituido por el **D.S. 006-2026-JUS** (El Peruano, 30-abr-2026) según el
    revisor normativo; cítalo así y verifica la numeración contra el nuevo TUO (el art. 66 tiene numerales 1-15; no existe 66.23).
11. Ley 28094 art. 42-A ya existe (Ley 31046) → IA-07 debe usar otro número verificado o una disposición. Ley 30096 tiene
    art. 9-A (Ley 32451) → CIB-04 no puede crear un 8-A que choque. Pena de extorsión informática no menor que art. 200 CP.

| Materia | Dueño | Las demás… |
|---|---|---|
| Registro de algoritmos públicos | IA-01 | IA-02, IA-09, IA-14 remiten al registro de IA-01 |
| Revisión humana en decisiones administrativas | IA-02 (plazo único) | IA-09 solo para jurisdicción; IA-13 laboral; ECO-11 remite a IA-13 |
| Sandbox regulatorio de IA | IA-03 (general) | respeta sandboxes sectoriales (SBS) y ECO-06 |
| Corpus de lenguas originarias | IA-06 prevalece sobre IA-04 | IA-04 exceptúa datos de pueblos indígenas |
| Titularidad del software con fondos públicos | GOB-03 (regla general: código abierto) | excepciones: GOB-04 (compra pública de innovación: titular el proveedor + licencia perpetua gratuita al Estado + depósito de código), ECO-05 (resultados de investigación; software abierto salvo protección justificada) |
| Localización de datos públicos | GOB-13 (por clasificación: solo datos críticos/reservados en territorio nacional) | IA-05, IA-14 remiten |
| Inventario de centros de datos | GOB-13 = públicos (SGTD); CON-10 = privados (MTC) | — |
| Oficial/responsable de datos | Usar el Oficial de Gobierno de Datos existente | IA-04 no crea cargo nuevo |
| Potestad sancionadora ciber | Regulador sectorial sanciona a sus regulados; CNSD solo donde no hay regulador; non bis in idem | CIB-01 y CIB-02 coherentes |
| Plazos de incidentes | CIB-03 armonizado con 48 h del DS 126-2025-PCM y DS 016-2024-JUS | CIB-14 reporta pagos de rescate vía la ventanilla de CIB-03 |
| SMS/remitentes alfanuméricos | CIB-06 | CIB-05 remite |
| Periodo de actualizaciones de seguridad | CIB-07 | TAL-12 remite |
| Puestos digitales en SERVIR | GOB-14 (familia de talento digital) | CIB-12 = subfamilia de ciberseguridad dentro de GOB-14 |
| DNI digital/billetera | CIB-08 parte del D.S. 098-2025-PCM vigente, solo agrega lo que falta | — |

## Decisiones para los ejes SOB y DER (fase C)
Principio: las 84 propuestas ya revisadas y publicadas MANTIENEN su materia; las nuevas (SOB/DER) se adaptan y remiten.

| Materia | Dueño | SOB/DER… |
|---|---|---|
| Reconocimiento de emociones y geolocalización en el trabajo; decisiones automatizadas en el empleo | IA-13 | DER-05 remite a IA-13 en esos puntos, usa las mismas excepciones y gravedades; DER-05 regula el resto del monitoreo digital y EXCLUYE el registro técnico de eventos de seguridad (EDR, DLP, logs) no usado para evaluar desempeño; fiscaliza SUNAFIL (privado) y SERVIR (público) según arts. 25-26 Ley 31572 |
| Repositorio de publicidad política pagada y contenido sintético electoral | IA-07 (JNE/JEE) | DER-03 NO crea otro repositorio político: regula transparencia general de grandes plataformas (moderación, recomendación, publicidad no electoral) y remite a IA-07; prohíbe que Indecopi juzgue el mérito de decisiones de moderación |
| Punto único de contacto / representante legal de plataformas | DER-03 | IA-07, DER-07 y CIB-10 se entienden referidas a él (no se modifican ahora) |
| Reidentificación (prohibición y sanción) y entornos seguros de datos | IA-10 (ANPD) | SOB-05 remite; el INS solo sanciona registro, ética y transferencias; los datos genómicos son datos personales sensibles aunque estén seudonimizados; nada de Ley 27811 (Decisión 391 CAN excluye material humano) |
| Desindexación y datos de personas fallecidas | DER-04 | Disposiciones patrimoniales solo por testamento; la presunción de interés público de información sobre función pública/corrupción NO decae por el paso del tiempo ni por decreto supremo |
| Adhesión digital a iniciativas ciudadanas | DER-08 | Modifica Ley 26859 (art. 223-H) y leyes orgánicas de ONPE/RENIEC con votación orgánica; admite DNIe (CIB-08) y firma remota (CIB-09); auditoría de sistemas electorales remite a CIB-13 |
| Criptografía poscuántica | SOB-06 (hoja de ruta) | Inventario de defensa/inteligencia queda en MINDEF/DINI; RENIEC con plan propio para el DNIe |
| Consulta al mercado en compras | SOB-08 vía numeral nuevo del art. 47 de la Ley 32069 (no ley paralela) | GOB-04 innovación, GOB-03 software, IA-14 cláusulas IA; excluir compras de defensa/inteligencia/orden interno de la publicidad anticipada |
| Drones | SOB-03 | Normas ASTM F3411 / EN 4709-002 para identificación remota; habilitar a autoridades competentes para neutralizar drones no autorizados sobre activos críticos |
| Carga de vehículos eléctricos | SOB-04 | Parte del DS 036-2023-EM (OCPP ya existe); requisitos de ciberseguridad mínimos; multas por art. 110 del Código del Consumidor |
| ZEEP | SOB-02 | Solo solicitudes nuevas (estabilidad art. 25 Ley 32449; la autorización es indefinida); proceso mínimo fijado en la ley |
| Trazabilidad de minerales | TAL-09 | SOB-01 remite |
