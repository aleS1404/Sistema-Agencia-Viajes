# Sprint 4 — Modelos del sprint

Fuentes editables contrastadas con los endpoints, capas y esquema físico integrados el 8 de noviembre de 2026.

## 1. Casos de uso seleccionados

~~~mermaid
flowchart LR
  Cliente --> Cancelar[Cancelar reserva]
  Cliente --> Reembolso[Solicitar reembolso]
  Cliente --> Reclamo[Registrar reclamo]
  Soporte --> Gestion[Gestionar cancelaciones y reembolsos]
  Soporte --> Atender[Atender reclamos]
  Cancelar --> Gestion
  Reembolso --> Gestion
  Reclamo --> Atender
~~~

## 2. Modelo conceptual de clases

~~~mermaid
classDiagram
  class Cancellation { +reason +status +requestedAt +resolvedAt }
  class Refund { +referenceCode +amount +status }
  class Complaint { +code +subject +status +resolution }
  class Booking { +status +totalAmount }
  class Payment { +status +amount }
  Cancellation "*" --> "1" Booking
  Refund "*" --> "1" Cancellation
  Refund "*" --> "1" Payment
  Complaint "*" --> "0..1" Booking
~~~

## 3. Modelo de navegación

~~~mermaid
flowchart LR
  EstadoReserva --> SolicitarCancelacion
  SolicitarCancelacion --> Seguimiento
  Seguimiento --> SolicitarReembolso
  EstadoReserva --> NuevoReclamo
  NuevoReclamo --> MisReclamos
  PanelSoporte --> Bandeja
  Bandeja --> Resolucion
~~~

## 4. Modelo de presentación

~~~mermaid
flowchart TB
  CancellationForm --> ReasonField
  RefundPanel --> AmountSummary
  ComplaintForm --> SubjectDescription
  SupportQueue --> Filters
  SupportQueue --> CaseDetail
  CaseDetail --> ResolutionForm
~~~

## 5. Modelo de proceso

~~~mermaid
flowchart TD
  A[Recibir solicitud] --> B{Rol y propiedad válidos}
  B -- No --> X[Rechazar acceso]
  B -- Sí --> C{Cumple política fija}
  C -- No --> Y[Rechazar solicitud]
  C -- Sí --> D[Aprobar cancelación]
  D --> E{Existe pago aprobado}
  E -- Sí --> F[Crear reembolso limitado]
  E -- No --> G[Cerrar sin reembolso]
~~~

## 6. Modelo de datos

### 6.1 E-R

~~~mermaid
erDiagram
  BOOKINGS ||--o{ CANCELLATIONS : origina
  APP_USERS ||--o{ CANCELLATIONS : solicita
  CANCELLATIONS ||--o{ REFUNDS : permite
  PAYMENTS ||--o{ REFUNDS : respalda
  APP_USERS ||--o{ COMPLAINTS : registra
  BOOKINGS ||--o{ COMPLAINTS : relaciona
~~~

### 6.2 Relacional

El modelo relacional se derivará del E-R y se documentará con PK, FK, nulabilidad y unicidad después de validar el esquema del incremento.

### 6.3 Físico

El modelo físico final se obtendrá de database/init y las entidades TypeORM. Estado: VALIDADO CONTRA EL ESQUEMA INTEGRADO DE 19 TABLAS.

## 7. Arquitectura del incremento

~~~mermaid
flowchart LR
  React --> SupportAPI
  SupportAPI --> CancellationService
  SupportAPI --> ComplaintService
  CancellationService --> RefundService
  RefundService --> PolicyRule
  ComplaintService --> MySQL[(MySQL)]
  RefundService --> MySQL
  SupportAPI --> Audit
~~~

