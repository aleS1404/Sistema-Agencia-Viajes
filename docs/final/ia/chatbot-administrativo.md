# Asistente administrativo basado en intenciones

## Objetivo

Permitir que el administrador formule preguntas frecuentes en lenguaje natural sencillo y obtenga una respuesta basada en datos actuales: reservas, ingresos, usuarios, reclamos, destino principal, servicio más reservado y riesgo de cancelación.

## Arquitectura

La pantalla `AdminAssistantPage` envía el texto a `POST /api/admin/assistant`. La API normaliza mayúsculas y tildes, reconoce una intención mediante reglas auditables y consulta `report`, `cancellationRisks` o agregaciones por destino. La respuesta incluye `intent`, texto, datos estructurados, acciones navegables, preguntas sugeridas, confianza y modo de operación.

El diagrama explorable está en [arquitecturas/chatbot-administrativo.html](arquitecturas/chatbot-administrativo.html).

## Intenciones implementadas

| Intención | Expresiones orientativas | Fuente |
|---|---|---|
| `bookings` | reserva, confirmada, pendiente | reporte administrativo |
| `revenue` | ingreso, venta, recaudación | pagos aprobados o parcialmente reembolsados |
| `users` | usuario, cliente, proveedor, rol | usuarios y roles |
| `open_complaints` | reclamo, queja, soporte | reclamos abiertos o en progreso |
| `top_service` | servicio, popular, más reservado | ítems de reserva y servicios |
| `top_destination` | destino, ciudad, lugar | reservas agrupadas por destino |
| `cancellation_risk` | riesgo, cancelación, cancelar | indicador heurístico |
| `help` | cualquier otra pregunta | explicación del alcance |

## Decisión tecnológica

No se conecta a ChatGPT ni a una API externa. Esta decisión hace la demostración reproducible, evita costos y mantiene los datos dentro del entorno Docker. En el informe debe llamarse “asistente por intenciones” o “asistente de datos”, no modelo generativo.

## Seguridad y límites

- Solo `ADMIN` puede invocarlo.
- El texto acepta entre 2 y 300 caracteres.
- No ejecuta SQL enviado por el usuario ni acciones destructivas.
- Las acciones devueltas son enlaces internos; el administrador decide si navega.
- No toma decisiones de negocio y muestra su alcance académico.

## Pruebas y evidencia

El verificador consulta “¿Cuántos reclamos están abiertos?”, exige intención `open_complaints`, respuesta no vacía y declaración del modo. La captura se encuentra en `docs/final/evidencias/asistente-administrador.png`.
