# ADR-001 — Arquitectura y alcance de la entrega

**Estado:** Aprobada para implementación.

## Contexto

Los documentos iniciales mencionaban dos combinaciones incompatibles: React/NestJS/TypeORM/MySQL y Django/PostgreSQL. La base implementada utiliza MySQL 8.4 y Docker.

## Decisión

Se utilizará arquitectura en capas:

1. Presentación: React y Vite.
2. API: NestJS y TypeScript.
3. Dominio: servicios de aplicación y reglas de negocio.
4. Persistencia: TypeORM y MySQL 8.4.
5. Infraestructura: Docker Compose y Adminer.

Los pagos son simulados. La recomendación es basada en contenido y se ejecuta dentro del backend. El catálogo y los perfiles son sintéticos. No se conecta una pasarela, un servicio externo de IA ni información real.

## Roles finales

- `ADMIN`: administración, políticas y reportes.
- `CUSTOMER`: perfil, búsqueda, reserva y postventa propia.
- `SUPPORT`: cancelaciones, reembolsos y reclamos.
- `PROVIDER`: mantenimiento de sus servicios sujeto a validación.

El rol histórico `AGENT` se retira para coincidir con el diagrama aprobado.

## Consecuencias

La base, el código, los diagramas, las pruebas y el informe deben usar los mismos nombres, estados y relaciones. Cualquier desviación se registra como limitación y no como funcionalidad terminada.

