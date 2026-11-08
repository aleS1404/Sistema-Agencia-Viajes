# Sprint 4 — Incremento

**Objetivo:** Resolver la postventa con trazabilidad y separación entre cliente y soporte.

**Estado:** PROBADO E INTEGRADO el 8 de noviembre de 2026.

| Componente | Resultado | Evidencia |
|---|---|---|
| Código | IMPLEMENTADO | Cancelaciones, reembolsos, reclamos y bandeja de soporte. |
| API y pantallas | INTEGRADO | Reembolso solicitado y aprobado; reclamo finalizado como `resolved`. |
| Datos/migraciones | IMPLEMENTADO | Esquema final de 19 tablas. |
| Pruebas | PROBADO | Jest 1/1, Vitest 1/1, builds y recorrido integrado. |
| Diagramas | VALIDADO | diagramas/modelos-preliminares.md |
| Limitaciones | DOCUMENTADO | Políticas y operaciones son demostrativas; faltan capturas. |

**Mejora final incorporada:** indicador preventivo de cancelación basado en reserva pendiente, ausencia de pago, antecedentes sintéticos, reclamos, importe y proximidad de salida. Devuelve puntaje, nivel y factores; no toma decisiones automáticas. Su presentación se integra en Sprint 5.

