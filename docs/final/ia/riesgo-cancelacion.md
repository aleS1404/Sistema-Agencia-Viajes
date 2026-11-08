# Indicador explicable de riesgo de cancelación

## Objetivo

Ordenar reservas activas para que el administrador identifique casos que conviene revisar. El indicador es preventivo y explicable: siempre devuelve puntaje, nivel y factores; nunca cancela una reserva automáticamente.

## Arquitectura

`GET /api/admin/cancellation-risk` y el dashboard llaman a `DomainService.cancellationRisks`. El servicio combina reserva, cliente, fecha de servicio, pagos, cancelaciones anteriores y reclamos. Después aplica reglas ponderadas, limita el resultado a 100 y ordena de mayor a menor. La tabla React presenta los factores usados.

El diagrama explorable está en [arquitecturas/riesgo-cancelacion.html](arquitecturas/riesgo-cancelacion.html).

## Modelo conceptual del puntaje

El puntaje parte de 10 y suma señales observables:

| Señal | Peso máximo |
|---|---:|
| Reserva pendiente | 10 |
| Sin pago aprobado | 15 |
| Cancelaciones previas | 30 |
| Reclamos asociados | 15 |
| Importe igual o mayor a Bs 800 | 10 |
| Salida dentro de tres días | 15 |
| Reserva con más de 30 días de anticipación | 5 |

Clasificación: `low` menor a 35, `medium` desde 35 y `high` desde 60. Los pesos son heurísticos académicos; no provienen de entrenamiento sobre personas reales.

## Relación con los casos de uso

No crea un caso de uso adicional ni altera los 21 del Product Backlog. Extiende PB-08 y PB-19 en Sprint 4, porque utiliza cancelaciones y postventa, y se integra visualmente con PB-15 en Sprint 5.

## Ética, privacidad y decisión humana

El indicador no usa atributos sensibles ni inferidos. Como los datos son sintéticos, no permite validar sesgo o precisión en operación real. Un nivel alto significa “revisar”, no “rechazar”. Si el sistema evolucionara a producción sería obligatorio validar datos, calibrar umbrales, medir falsos positivos y habilitar revisión humana y apelación.

## Pruebas y evidencia

La verificación integral exige que el dashboard entregue la colección de riesgos. La evidencia visual está incluida al final de `panel-administrador.png`.
