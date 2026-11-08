# Ubicación en el informe final y asignación por sprint

## Decisión de ubicación

El informe actual termina el Marco Aplicativo en 3.16. La incorporación correcta es añadir cuatro apartados antes de la bibliografía, sin modificar la numeración de los 21 casos de uso.

| Sección del informe | Contenido que debe colocarse | Evidencia |
|---|---|---|
| **3.17 Dashboard administrativo y analítica predictiva** | objetivo, filtros, KPI, arquitectura, fórmula de regresión, resultados y limitaciones | `dashboard-predictivo.md`, captura del panel y arquitectura HTML |
| **3.18 Asistente administrativo basado en intenciones** | intenciones, flujo, seguridad, decisión de no usar API externa y alcance | `chatbot-administrativo.md`, captura del asistente y arquitectura HTML |
| **3.19 Indicador de riesgo de cancelación** | variables, pesos, umbrales, explicación, ética y revisión humana | `riesgo-cancelacion.md`, tabla visible en el dashboard y arquitectura HTML |
| **3.20 Mejora visual del catálogo** | estrategia de imágenes SVG locales, accesibilidad, carga diferida y relación con catálogo/recomendación | capturas de catálogo y recomendaciones |
| **Anexo C — Evidencia visual** | capturas actualizadas del dashboard, asistente, usuarios, catálogo y recomendaciones | `docs/final/evidencias` |
| **Anexo D — Arquitecturas interactivas** | enlaces o archivos HTML exportables de Archify | `docs/final/ia/arquitecturas` |

Si la institución exige un Capítulo IV de resultados, los resultados y limitaciones de 3.17 a 3.20 pueden resumirse en 4.1 “Resultados de la implementación” y 4.2 “Limitaciones y trabajo futuro”. En la estructura actual se conservan dentro del Capítulo III para no inventar un capítulo que no existe en el instructivo consolidado.

## Asignación por sprint

| Mejora | Sprint principal | Backlog relacionado | Justificación |
|---|---:|---|---|
| Imágenes de destinos | 2 | PB-03, PB-04 | Forma parte de catálogo, búsqueda y recomendación. |
| Indicador de riesgo | 4 | PB-08, PB-19 | Se construye sobre cancelaciones, pagos y postventa. |
| Integración del riesgo en dashboard | 5 | PB-15 | Se presenta como indicador administrativo. |
| Dashboard predictivo | 5 | PB-15 y extensión técnica de PB-17 | Amplía reportes con serie y estimación explicable. |
| Asistente administrativo | 5 | PB-15, controlado por PB-21 | Consulta reportes y exige autorización de administrador. |

Estas mejoras son tareas técnicas de los casos existentes. No deben numerarse como PB-22, PB-23 o PB-24, porque la corrección académica exige mantener exactamente los 21 casos del diagrama.

## Participación en Sprint Planning

- **Product Owner / Alexandra:** prioriza el valor demostrable, acepta límites y valida que las nuevas funciones no cambien los 21 casos.
- **Scrum Master / Sheyla:** confirma Definition of Done, riesgos, diagramas, criterios éticos y trazabilidad.
- **Líder de integración / Melani:** descompone frontend, API, consultas, Docker y dependencias técnicas.
- **Developers (las tres):** estiman tareas, definen pruebas, revisan los datos sintéticos y acuerdan evidencias.

## Tareas por integrante

| Sprint | Alexandra | Sheyla | Melani |
|---|---|---|---|
| 2 | valida destinos y evidencia visual | revisa accesibilidad y presentación | integra SVG, tarjetas y recomendaciones |
| 4 | define y documenta factores/pesos | revisa privacidad, reglas y prueba de umbrales | implementa consulta, cálculo y endpoint |
| 5 | valida KPI, prepara datos, capturas e informe | audita RBAC, diagramas y limitaciones | implementa dashboard, predicción, chatbot e integración Docker |

## Definition of Done aplicada

Código compilable, endpoint protegido, interfaz sin errores, datos sintéticos suficientes, prueba reproducible, limitación visible, captura, documentación, arquitectura validada por Archify y trazabilidad hacia un PB existente.
