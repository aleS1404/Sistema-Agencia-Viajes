# Sprint 1 — Modelos del sprint

Fuentes editables contrastadas con los endpoints, capas y esquema físico integrados el 8 de noviembre de 2026.

## 1. Casos de uso seleccionados

~~~mermaid
flowchart LR
  Cliente --> Registro[Registrarse e iniciar sesión]
  Cliente --> Perfil[Gestionar perfil y preferencias]
  Admin[Administrador] --> Usuarios[Gestionar usuarios]
  Sistema --> Acceso[Proteger información y validar accesos]
  Registro --> Acceso
  Perfil --> Acceso
  Usuarios --> Acceso
~~~

## 2. Modelo conceptual de clases

~~~mermaid
classDiagram
  class Role { +id +code +name }
  class User { +id +email +passwordHash +status }
  class CustomerProfile { +maxBudgetBob +availableDays +notes }
  class Interest { +id +code +name }
  class AuditLog { +action +entityType +createdAt }
  Role "1" --> "*" User
  User "1" --> "0..1" CustomerProfile
  CustomerProfile "*" --> "*" Interest
  User "1" --> "*" AuditLog
~~~

## 3. Modelo de navegación

~~~mermaid
flowchart LR
  Inicio --> Login
  Inicio --> Registro
  Login --> Panel
  Panel --> Perfil
  Panel --> Preferencias
  Panel --> Usuarios
  Usuarios --> Edicion[Estado y rol]
~~~

## 4. Modelo de presentación

~~~mermaid
flowchart TB
  AppShell --> MenuRol
  AppShell --> LoginForm
  AppShell --> RegisterForm
  AppShell --> ProfileForm
  AppShell --> UsersTable
  UsersTable --> StatusActions
~~~

## 5. Modelo de proceso

~~~mermaid
flowchart TD
  A[Enviar credenciales] --> B{Formato válido}
  B -- No --> E[Mostrar error]
  B -- Sí --> C{Credenciales correctas}
  C -- No --> E
  C -- Sí --> D[Emitir JWT y registrar auditoría]
  D --> F[Autorizar por rol y propiedad]
~~~

## 6. Modelo de datos

### 6.1 E-R

~~~mermaid
erDiagram
  ROLES ||--o{ APP_USERS : asigna
  APP_USERS ||--o| CUSTOMER_PROFILES : posee
  CUSTOMER_PROFILES ||--o{ CUSTOMER_INTERESTS : declara
  INTERESTS ||--o{ CUSTOMER_INTERESTS : clasifica
  APP_USERS ||--o{ AUDIT_LOGS : ejecuta
~~~

### 6.2 Relacional

El modelo relacional se derivará del E-R y se documentará con PK, FK, nulabilidad y unicidad después de validar el esquema del incremento.

### 6.3 Físico

El modelo físico final se obtendrá de database/init y las entidades TypeORM. Estado: VALIDADO CONTRA EL ESQUEMA INTEGRADO DE 19 TABLAS.

## 7. Arquitectura del incremento

~~~mermaid
flowchart LR
  Browser[React] --> API[NestJS API]
  API --> Auth[Auth y RBAC]
  Auth --> Domain[Servicios de dominio]
  Domain --> ORM[TypeORM]
  ORM --> DB[(MySQL)]
  API --> Audit[Auditoría]
~~~

