# Sprint 2 — Incremento

**Objetivo:** Administrar el catálogo y entregar búsquedas, comparaciones y recomendaciones personalizadas.

**Estado:** PROBADO E INTEGRADO el 8 de noviembre de 2026.

| Componente | Resultado | Evidencia |
|---|---|---|
| Código | IMPLEMENTADO | Catálogo, filtros, proveedor y recomendación explicable. |
| API y pantallas | INTEGRADO | 12 servicios mediante proxy web; 5 recomendaciones; 6 servicios asociados al proveedor. |
| Datos/migraciones | IMPLEMENTADO | Esquema final de 19 tablas. |
| Pruebas | PROBADO | Jest 1/1, Vitest 1/1, builds y recorrido integrado. |
| Diagramas | VALIDADO | diagramas/modelos-preliminares.md |
| Limitaciones | DOCUMENTADO | Datos sintéticos; la recomendación no usa un servicio externo de IA. |

**Mejora final incorporada:** las tarjetas de catálogo y recomendación muestran ilustraciones SVG locales para La Paz, Copacabana y Coroico, con texto alternativo y carga diferida. La mejora corresponde a PB-03 y PB-04 y no agrega un caso de uso.

