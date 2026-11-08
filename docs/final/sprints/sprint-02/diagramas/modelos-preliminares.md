# Sprint 2 — Modelos del sprint

Fuentes editables contrastadas con los endpoints, capas y esquema físico integrados el 8 de noviembre de 2026.

## 1. Casos de uso seleccionados

~~~mermaid
flowchart LR
  Cliente --> Buscar[Buscar y comparar servicios]
  Cliente --> Consultar[Consultar recomendaciones]
  Admin --> Catalogo[Gestionar proveedores y servicios]
  Proveedor --> Info[Gestionar información de servicios]
  IA[Sistema de IA] --> Recomendar[Generar recomendaciones]
  Buscar --> Recomendar
  Consultar --> Recomendar
~~~

## 2. Modelo conceptual de clases

~~~mermaid
classDiagram
  class Provider { +id +tradeName +status }
  class Destination { +city +department +country }
  class Category { +code +name }
  class TouristService { +code +name +priceBob +capacity +status }
  class Interest { +code +name }
  class Recommendation { +score +reasons }
  Provider "1" --> "*" TouristService
  Destination "1" --> "*" TouristService
  Category "1" --> "*" TouristService
  TouristService "*" --> "*" Interest
  TouristService --> Recommendation
~~~

## 3. Modelo de navegación

~~~mermaid
flowchart LR
  Panel --> Busqueda
  Busqueda --> Resultados
  Resultados --> Comparar
  Resultados --> Detalle
  Detalle --> Recomendaciones
  Panel --> AdminCatalogo
  Panel --> PortalProveedor
~~~

## 4. Modelo de presentación

~~~mermaid
flowchart TB
  CatalogPage --> FilterBar
  CatalogPage --> ServiceCards
  ServiceCards --> CompareDrawer
  ServiceCards --> DetailModal
  DetailModal --> RecommendationReasons
  AdminPage --> ServiceForm
~~~

## 5. Modelo de proceso

~~~mermaid
flowchart TD
  A[Recibir filtros y perfil] --> B[Aplicar restricciones]
  B --> C[Calcular coincidencia de intereses]
  C --> D[Ordenar resultados]
  D --> E{Hay resultados}
  E -- Sí --> F[Mostrar hasta cinco con razones]
  E -- No --> G[Mostrar alternativas y estado vacío]
~~~

## 6. Modelo de datos

### 6.1 E-R

~~~mermaid
erDiagram
  PROVIDERS ||--o{ PROVIDER_USERS : vincula
  PROVIDERS ||--o{ TOURIST_SERVICES : ofrece
  DESTINATIONS ||--o{ TOURIST_SERVICES : ubica
  SERVICE_CATEGORIES ||--o{ TOURIST_SERVICES : clasifica
  TOURIST_SERVICES ||--o{ SERVICE_INTERESTS : etiqueta
  INTERESTS ||--o{ SERVICE_INTERESTS : describe
~~~

### 6.2 Relacional

El modelo relacional se derivará del E-R y se documentará con PK, FK, nulabilidad y unicidad después de validar el esquema del incremento.

### 6.3 Físico

El modelo físico final se obtendrá de database/init y las entidades TypeORM. Estado: VALIDADO CONTRA EL ESQUEMA INTEGRADO DE 19 TABLAS.

## 7. Arquitectura del incremento

~~~mermaid
flowchart LR
  React --> CatalogAPI
  React --> RecommendationAPI
  CatalogAPI --> CatalogService
  RecommendationAPI --> RecommendationService
  RecommendationService --> CatalogService
  CatalogService --> TypeORM
  TypeORM --> MySQL[(MySQL)]
~~~

