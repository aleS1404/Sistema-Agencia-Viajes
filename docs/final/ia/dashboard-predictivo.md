# Dashboard administrativo y predicción de demanda

## Objetivo

Concentrar la información que el administrador necesita para una demostración: reservas, confirmaciones, ingresos aprobados, ticket promedio, cancelaciones, reclamos, servicios y usuarios. Los filtros de fecha, destino, estado y horizonte se procesan en el servidor.

## Arquitectura

El componente React `ReportsPage` envía filtros autenticados a `GET /api/admin/dashboard`. `JwtAuthGuard` y `RolesGuard` restringen el acceso a `ADMIN`. `DomainService.dashboard` agrega datos de `bookings`, `booking_items`, `payments`, `cancellations`, `complaints`, `tourist_services`, `destinations`, `app_users` y `roles`. La respuesta reúne KPI, series diarias, demanda por destino, servicios principales, alertas, predicción y riesgo.

El diagrama explorable está en [arquitecturas/dashboard-predictivo.html](arquitecturas/dashboard-predictivo.html). Permite tema claro/oscuro, zoom, inspección de componentes y exportación.

## Modelo predictivo

Se aplica regresión lineal simple sobre el número diario de reservas de hasta 60 días. Para cada día se usa el índice temporal `x` y las reservas `y`. La pendiente se calcula con:

`m = (n·Σxy − Σx·Σy) / (n·Σx² − (Σx)²)`

La proyección diaria es `ŷ = b + m·x`, limitada a valores no negativos. El ingreso futuro se estima multiplicando reservas proyectadas por el ticket promedio del periodo. La confianza orientativa combina ajuste `R²` y cantidad de días con observaciones; no es una probabilidad estadística certificada.

## Entradas y salidas

- Entradas: `dateFrom`, `dateTo`, `destinationId`, `status`, `forecastDays` (1 a 30).
- Salidas: ocho KPI, reservas por estado, serie diaria, demanda por destino, servicios principales, alertas y proyección.
- Interfaz: `/admin/reportes`.
- Endpoint: `GET /api/admin/dashboard`.

## Limitaciones y uso responsable

El historial es pequeño y sintético. El modelo no incorpora estacionalidad, clima, promociones ni eventos. Por eso la interfaz muestra de forma permanente: “Estimación académica basada en datos sintéticos; no constituye una predicción comercial”. El resultado sirve para explicar una arquitectura analítica, no para comprometer ventas o recursos reales.

## Pruebas y evidencia

- Compilación NestJS y React aprobada.
- Verificación integral: siete puntos para un horizonte solicitado de siete días.
- Captura: `docs/final/evidencias/panel-administrador.png`.
- Acceso de cliente rechazado por RBAC en rutas administrativas.
