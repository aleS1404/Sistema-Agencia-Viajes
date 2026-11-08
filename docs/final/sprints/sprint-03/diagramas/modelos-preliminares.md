# Sprint 3 — Modelos del sprint

Fuentes editables contrastadas con los endpoints, capas y esquema físico integrados el 8 de noviembre de 2026.

## 1. Casos de uso seleccionados

~~~mermaid
flowchart LR
  Cliente --> Reserva[Gestionar reservas]
  Cliente --> Itinerario[Consultar itinerario]
  Cliente --> Pago[Realizar pago]
  Cliente --> Estado[Consultar estado de reserva y pagos]
  Pasarela --> Verificar[Registrar y verificar transacciones]
  Pago --> Verificar
~~~

## 2. Modelo conceptual de clases

~~~mermaid
classDiagram
  class Booking { +code +status +totalAmount +bookedAt }
  class BookingItem { +quantity +unitPrice +serviceDate }
  class TouristService { +name +priceBob +capacity }
  class Payment { +referenceCode +method +status +amount }
  Booking "1" --> "1..*" BookingItem
  BookingItem "*" --> "1" TouristService
  Booking "1" --> "*" Payment
~~~

## 3. Modelo de navegación

~~~mermaid
flowchart LR
  DetalleServicio --> ResumenReserva
  ResumenReserva --> Confirmacion
  Confirmacion --> Pago
  Pago --> Comprobante
  Comprobante --> Estado
  Estado --> Itinerario
~~~

## 4. Modelo de presentación

~~~mermaid
flowchart TB
  BookingPage --> ItemList
  BookingPage --> TotalCard
  BookingPage --> DateInput
  PaymentPage --> MethodSelector
  PaymentPage --> ResultBanner
  ItineraryPage --> Timeline
~~~

## 5. Modelo de proceso

~~~mermaid
flowchart TD
  A[Seleccionar servicio y fecha] --> B[Validar capacidad]
  B --> C{Disponible}
  C -- No --> X[Rechazar]
  C -- Sí --> D[Crear reserva pendiente]
  D --> E[Registrar pago simulado]
  E --> F{Aprobado}
  F -- Sí --> G[Confirmar reserva]
  F -- No --> H[Mantener pendiente]
~~~

## 6. Modelo de datos

### 6.1 E-R

~~~mermaid
erDiagram
  APP_USERS ||--o{ BOOKINGS : cliente
  BOOKINGS ||--|{ BOOKING_ITEMS : contiene
  TOURIST_SERVICES ||--o{ BOOKING_ITEMS : reservado
  BOOKINGS ||--o{ PAYMENTS : recibe
~~~

### 6.2 Relacional

El modelo relacional se derivará del E-R y se documentará con PK, FK, nulabilidad y unicidad después de validar el esquema del incremento.

### 6.3 Físico

El modelo físico final se obtendrá de database/init y las entidades TypeORM. Estado: VALIDADO CONTRA EL ESQUEMA INTEGRADO DE 19 TABLAS.

## 7. Arquitectura del incremento

~~~mermaid
flowchart LR
  React --> BookingAPI
  BookingAPI --> BookingService
  BookingService --> PaymentService
  BookingService --> Tx[Transacción TypeORM]
  PaymentService --> Tx
  Tx --> MySQL[(MySQL)]
  BookingService --> Audit
~~~

