# Sprint 5 — Modelos del sprint

Fuentes editables contrastadas con los endpoints, capas y esquema físico integrados el 8 de noviembre de 2026.

## 1. Casos de uso seleccionados

~~~mermaid
flowchart LR
  Admin --> Politicas[Gestionar políticas comerciales]
  Admin --> Reportes[Generar reportes]
  Politicas --> Seguridad[Proteger información]
  Reportes --> Seguridad
  Seguridad --> Auditoria[Consultar trazabilidad]
~~~

## 2. Modelo conceptual de clases

~~~mermaid
classDiagram
  class CommercialPolicy { +code +name +daysBefore +refundPercent +active }
  class ReportQuery { +dateFrom +dateTo +status }
  class Booking { +status +totalAmount }
  class Payment { +status +amount }
  class Refund { +status +amount }
  class Complaint { +status }
  CommercialPolicy --> Booking
  ReportQuery --> Booking
  ReportQuery --> Payment
  ReportQuery --> Refund
  ReportQuery --> Complaint
~~~

## 3. Modelo de navegación

~~~mermaid
flowchart LR
  AdminPanel --> Politicas
  AdminPanel --> Reportes
  AdminPanel --> Auditoria
  Reportes --> Filtros
  Filtros --> Indicadores
  Indicadores --> Detalle
~~~

## 4. Modelo de presentación

~~~mermaid
flowchart TB
  Dashboard --> KPIGrid
  Dashboard --> StatusChart
  Dashboard --> DateFilters
  PoliciesPage --> PolicyForm
  PoliciesPage --> PolicyTable
  AuditPage --> AuditTable
~~~

## 5. Modelo de proceso

~~~mermaid
flowchart TD
  A[Elegir rango y filtros] --> B[Validar rol administrador]
  B --> C{Autorizado}
  C -- No --> X[Denegar]
  C -- Sí --> D[Agregar reservas y pagos]
  D --> E[Agregar postventa]
  E --> F[Mostrar indicadores y fecha de corte]
~~~

## 6. Modelo de datos

### 6.1 E-R

~~~mermaid
erDiagram
  COMMERCIAL_POLICIES ||--o{ CANCELLATIONS : condiciona
  APP_USERS ||--o{ AUDIT_LOGS : genera
  BOOKINGS ||--o{ PAYMENTS : agrega
  BOOKINGS ||--o{ CANCELLATIONS : agrega
  CANCELLATIONS ||--o{ REFUNDS : agrega
  BOOKINGS ||--o{ COMPLAINTS : agrega
~~~

### 6.2 Relacional

El modelo relacional se derivará del E-R y se documentará con PK, FK, nulabilidad y unicidad después de validar el esquema del incremento.

### 6.3 Físico

El modelo físico final se obtendrá de database/init y las entidades TypeORM. Estado: VALIDADO CONTRA EL ESQUEMA INTEGRADO DE 19 TABLAS.

## 7. Arquitectura del incremento

~~~mermaid
flowchart LR
  Browser[React] --> API[NestJS]
  API --> Auth[JWT y RBAC]
  API --> Modules[Servicios de dominio]
  Modules --> ORM[TypeORM]
  ORM --> DB[(MySQL)]
  Adminer --> DB
  Compose[Docker Compose] --> Browser
  Compose --> API
  Compose --> DB
  API --> Audit[Auditoría]
~~~

