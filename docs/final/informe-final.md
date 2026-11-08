# SISTEMA PROTOTIPO DE GESTIÓN TURÍSTICA PARA UNA AGENCIA DE VIAJES DE LA PAZ, INSPIRADO EN BOOKING.COM

**Universidad Mayor de San Andrés**  
**Facultad de Ciencias Puras y Naturales**  
**Carrera de Informática — Taller de Proyecto**

**Integrantes:** Condori Alcazar Sheyla Micaela; Masco Vargas Melani; Salazar Gisberth Alexandra Cristal.  
**Docente:** M.Sc. Grover Alex Rodriguez Ramirez.  
**Gestión:** 2/2026.  
**Lugar:** La Paz, Bolivia.

## Resumen

El proyecto desarrolla un prototipo académico para gestionar clientes, preferencias, proveedores, servicios turísticos, reservas, pagos simulados, cancelaciones, reembolsos, reclamos y reportes. Incorpora recomendación basada en contenido, control de acceso por roles y trazabilidad. La solución utiliza React, NestJS, TypeORM, MySQL y Docker. Los datos y las transacciones son sintéticos; no representan operaciones comerciales reales.

## CAPÍTULO I — MARCO REFERENCIAL

### 1.1 Introducción

La digitalización del turismo trasladó la búsqueda, comparación y reserva desde procesos manuales hacia plataformas integradas. Las agencias pequeñas necesitan centralizar catálogo, clientes y operaciones para responder con rapidez y trazabilidad. El proyecto toma a Booking.com como referencia funcional, sin pretender reproducir su escala, marca ni infraestructura.

La propuesta prioriza los problemas observables en una agencia: información dispersa, baja personalización, seguimiento manual de reservas, poca transparencia de estados y dificultad para atender postventa. El prototipo integra estos procesos y conserva evidencia suficiente para evaluar su funcionamiento.

### 1.2 Problema

#### 1.2.1 Antecedentes

Los antecedentes revisados coinciden en que la integración de datos y la digitalización fortalecen la competitividad de agencias y destinos. Los trabajos de Aguayo Maldonado (2015), García Oro et al. (2009), Miranda Aguilar y Valencia Herrera (2018), y Calderón Ballón y Careaga Veizaga (2020) respaldan la necesidad de herramientas integradas, marketing digital y personalización.

#### 1.2.2 Planteamiento

Las plataformas globales ofrecen búsqueda, reserva y personalización en un solo entorno. En contraste, una agencia local puede depender de hojas de cálculo, mensajería y registros separados. Esa fragmentación dificulta comparar servicios, controlar estados, responder reclamos y generar información para decisiones.

#### 1.2.3 Formulación

¿Cómo desarrollar un sistema prototipo que integre la gestión turística de una agencia de La Paz y permita demostrar búsqueda, recomendación, reserva, pago simulado y postventa con seguridad y trazabilidad?

### 1.3 Objetivos

#### 1.3.1 Objetivo general

Desarrollar un sistema prototipo de gestión turística que integre catálogo, clientes, recomendaciones, reservas, pagos simulados, postventa y reportes mediante una arquitectura reproducible.

#### 1.3.2 Objetivos específicos

1. Modelar usuarios, proveedores, destinos, servicios y operaciones.
2. Implementar autenticación y autorización por roles.
3. Permitir buscar, comparar y recomendar servicios.
4. Registrar reservas, itinerarios y pagos simulados.
5. Gestionar cancelaciones, reembolsos y reclamos.
6. Producir reportes y auditoría.
7. Verificar el prototipo mediante pruebas funcionales, unitarias, integración, navegación, interfaz y seguridad.

### 1.4 Justificación

La solución reduce dispersión de información y facilita demostrar un recorrido completo del cliente. Su valor académico reside en integrar análisis, UML, base de datos, programación, pruebas, Scrum y documentación reproducible.

### 1.5 Alcances y límites

El alcance comprende los 21 casos de uso aprobados. La operación es local y demostrativa, con datos sintéticos y máximo cinco sesiones simultáneas. Los pagos son simulados; no existe facturación fiscal, disponibilidad real, integración bancaria ni uso de datos personales reales.

### 1.6 Cronograma

El trabajo se organiza en cinco sprints: identidad y seguridad; catálogo y recomendación; reserva y pago; postventa; políticas, reportes y cierre. El expediente de cada sprint registra planificación, modelos, prueba, revisión, retrospectiva e incremento.

## CAPÍTULO II — MARCO TEÓRICO

### 2.1 Marco institucional y funcionamiento actual

La referencia institucional es una agencia turística de La Paz que necesita administrar información de viajeros, proveedores y servicios. El proceso convencional combina atención, consulta de oferta, cotización, reserva y seguimiento. El sistema propuesto centraliza esos pasos en una aplicación web.

### 2.2 Metodología y técnicas de prueba

Se adopta Scrum de manera académica. El Product Owner ordena el backlog, el Scrum Master facilita los eventos y las tres integrantes participan como Developers. Cada sprint selecciona casos, produce un incremento y documenta Review y Retrospective (Schwaber & Sutherland, 2020).

Las pruebas se dividen en unitarias, integración, funcionales, navegación, interfaz y seguridad. Cada resultado debe conservar fecha, comando, salida y versión del código.

### 2.3 Aporte informático

El aporte consiste en un sistema reproducible que combina reglas transaccionales, autorización por roles, recomendación explicable y modelos UML trazables. La recomendación pondera intereses, presupuesto, duración y etiquetas; no se presenta como inteligencia general ni utiliza datos reales.

### 2.4 Dominio turístico

El dominio incluye proveedor, destino, categoría, servicio, perfil de viajero, reserva, detalle, pago, cancelación, reembolso, reclamo y política comercial. Los estados permiten controlar el ciclo de cada operación y evitar transiciones incoherentes.

### 2.5 Tecnologías de software

React y Vite implementan la interfaz. NestJS y TypeScript implementan la API. TypeORM conecta el dominio con MySQL 8.4. Docker Compose inicia los componentes y Adminer permite inspeccionar la base. Git conserva versiones y evidencias.

### 2.6 Calidad de software

La evaluación se guía por ISO/IEC 25010: adecuación funcional, eficiencia, compatibilidad, usabilidad, fiabilidad, seguridad, mantenibilidad y portabilidad. Para la aplicación web se observan recorridos completos, claridad de errores, diseño responsive, tiempos de respuesta y accesibilidad básica.

### 2.7 Costo y beneficio

El análisis económico del documento inicial se considera un escenario académico. Sus costos, VAN, TIR y COCOMO dependen de supuestos que deben conservarse como tales. El prototipo no demuestra rentabilidad comercial; únicamente ofrece una base para medir horas, errores y tiempos antes de una adopción real.

### 2.8 Seguridad

La seguridad física protege los equipos y copias. La seguridad lógica utiliza identidades, contraseñas derivadas, JWT, permisos por rol y propiedad del recurso. MySQL opera con usuario de aplicación y puerto local. Las variables sensibles se excluyen de Git. Se registran acciones relevantes y se prueban accesos indebidos conforme a una selección de controles OWASP ASVS.

## CAPÍTULO III — MARCO APLICATIVO

### 3.1 Product Backlog

| ID | Caso de uso | Actor | Sprint | Criterio de aceptación |
|---|---|---|---:|---|
| PB-01 | Registrarse e iniciar sesión | Cliente | 1 | Crea cuenta e inicia sesión con rol autorizado. |
| PB-02 | Gestionar perfil y preferencias | Cliente | 1 | Actualiza datos, presupuesto, días e intereses. |
| PB-03 | Buscar y comparar servicios turísticos | Cliente | 2 | Filtra y compara servicios disponibles. |
| PB-04 | Consultar recomendaciones personalizadas | Cliente | 2 | Muestra hasta cinco resultados explicables. |
| PB-05 | Gestionar reservas | Cliente | 3 | Crea y consulta reserva coherente. |
| PB-06 | Consultar itinerario | Cliente | 3 | Muestra detalle, fecha y destino. |
| PB-07 | Realizar pago | Cliente | 3 | Registra pago simulado de reserva propia. |
| PB-08 | Cancelar reserva | Cliente | 4 | Solicita cancelación permitida. |
| PB-09 | Solicitar reembolso | Cliente | 4 | Vincula solicitud con pago y cancelación. |
| PB-10 | Consultar estado de reserva y pagos | Cliente | 3 | Restringe consulta a operaciones propias. |
| PB-11 | Registrar reclamo | Cliente | 4 | Crea reclamo trazable. |
| PB-12 | Gestionar usuarios | Administrador | 1 | Lista y cambia estado o rol autorizado. |
| PB-13 | Gestionar proveedores y servicios | Administrador | 2 | Mantiene catálogo y estados. |
| PB-14 | Gestionar políticas comerciales | Administrador | 5 | Configura reglas demostrativas. |
| PB-15 | Generar reportes | Administrador | 5 | Presenta indicadores filtrables. |
| PB-16 | Gestionar información de servicios turísticos | Proveedor | 2 | Mantiene sus servicios sujetos a validación. |
| PB-17 | Generar recomendaciones con IA | Sistema IA | 2 | Calcula resultados reproducibles. |
| PB-18 | Registrar y verificar transacciones | Pasarela simulada | 3 | Conserva referencia, monto y estado. |
| PB-19 | Gestionar cancelaciones y reembolsos | Soporte | 4 | Resuelve solicitud sin exceder pago. |
| PB-20 | Atender reclamos | Soporte | 4 | Asigna, actualiza y resuelve reclamo. |
| PB-21 | Proteger información y validar accesos | Sistema | 1 | Valida identidad, rol y propiedad. |

### 3.2 Roles Scrum

| Rol | Integrante | Responsabilidad |
|---|---|---|
| Product Owner | Sheyla | Prioriza y acepta el alcance. |
| Scrum Master | Alexandra | Facilita eventos y conserva evidencias. |
| Líder de integración | Melani | Integra frontend, API, base y versión ejecutable. |
| Developers | Las tres integrantes | Diseñan, programan, prueban y documentan. |

### 3.3 Sprint Planning

Cada sprint define objetivo, Product Backlog seleccionado, tareas, responsables, dependencia, criterio, prueba y evidencia. Los documentos detallados se encuentran en `docs/final/sprints`.

### 3.4 Sprint 1 — Identidad y seguridad

Selecciona PB-01, PB-02, PB-12 y PB-21. Produce acceso, perfil, permisos, auditoría y administración de usuarios. **Resultado verificado:** inicio de sesión con cuatro roles, cuatro usuarios visibles para administración, rechazo 403 para un cliente en reportes y 16 eventos de auditoría.

### 3.5 Sprint 2 — Catálogo y recomendación

Selecciona PB-03, PB-04, PB-13, PB-16 y PB-17. Produce catálogo, búsqueda, comparación y recomendación explicable. **Resultado verificado:** 12 servicios disponibles mediante el proxy web, cinco recomendaciones y seis servicios asociados a la cuenta proveedor.

### 3.6 Sprint 3 — Reserva y pago

Selecciona PB-05, PB-06, PB-07, PB-10 y PB-18. Produce reserva, itinerario, estado y pago simulado. **Resultado verificado:** creación de reserva y pago aprobado; el reporte administrativo contabilizó tres reservas.

### 3.7 Sprint 4 — Postventa

Selecciona PB-08, PB-09, PB-11, PB-19 y PB-20. Produce cancelación, reembolso y reclamos. **Resultado verificado:** solicitud y aprobación de reembolso, además de reclamo con estado final `resolved`.

### 3.8 Sprint 5 — Políticas, reportes y cierre

Selecciona PB-14 y PB-15, y ejecuta regresión sobre PB-01 a PB-21. Produce políticas, reportes, integración e instalación. **Resultado verificado:** política comercial inicial, reporte de tres reservas, Docker con base y API saludables, web HTTP 200 y Adminer activo.

### 3.9 Sprint Review

Cada Review compara el incremento con los criterios de aceptación. Los cinco incrementos fueron integrados el 8 de noviembre de 2026; el detalle verificable se conserva en los expedientes de sprint y la matriz de trazabilidad.

### 3.10 Sprint Retrospective

Cada Retrospective registra hechos, problemas y una acción con responsable. La integración confirmó la utilidad de Docker y dejó como acción ampliar cobertura automatizada y resolver tres dependencias moderadas transitivas de TypeORM.

### 3.11 Incrementos

Los incrementos se describen mediante versión, código, datos, pantallas, pruebas, diagramas, demostración y limitaciones. La API y la web aprobaron sus pruebas automatizadas y compilaciones; la aplicación integrada respondió mediante Docker.

### 3.12 Arquitectura

La arquitectura en capas separa presentación React compilada y servida por Nginx, API NestJS, servicios de dominio, TypeORM y MySQL. Nginx publica la SPA y redirige `/api` al backend. Docker Compose reproduce base, API, web y Adminer. Las reglas se validan en servidor; la interfaz no constituye una barrera de seguridad.

### 3.13 Diseño de datos

El modelo final contiene 19 tablas. A las 17 tablas iniciales se añadieron `provider_users` y `commercial_policies`. Los roles finales son `ADMIN`, `CUSTOMER`, `SUPPORT` y `PROVIDER`; se retiró `AGENT`. El esquema preserva claves foráneas, restricciones e índices.

### 3.14 Pruebas

La matriz de trazabilidad relaciona cada caso con su endpoint, datos, prueba y evidencia. Jest aprobó 1 de 1 pruebas de API; Vitest aprobó 1 de 1 pruebas web; ambas compilaciones aprobaron. El recorrido integrado verificó los 21 casos. El cliente recibió 403 al intentar reportes administrativos.

### 3.15 Desarrollo del programa

El repositorio organiza base, backend, frontend, documentación y Docker. El manual de instalación define variables, inicio, verificación y cierre. El manual de usuario describe los recorridos por rol. La web respondió HTTP 200 y el proxy devolvió 12 servicios.

### 3.16 Resultados de integración y limitaciones

El producto integrado utiliza 19 tablas, 12 servicios sintéticos y cuatro cuentas de demostración. El recorrido comprobó reserva, pago aprobado, reembolso aprobado, reclamo resuelto, seis servicios del proveedor, reportes y auditoría. La auditoría registró 16 eventos durante la verificación.

La cobertura automatizada es mínima: una prueba Jest y una prueba Vitest. El Anexo C conserva capturas de la pantalla de acceso, el panel administrador y el catálogo del cliente. `npm audit` no reportó vulnerabilidades en la web; la API conserva tres vulnerabilidades moderadas transitivas asociadas a TypeORM. La alerta alta de Multer fue eliminada mediante una versión corregida. Los pagos, disponibilidad y datos siguen siendo simulados y no deben presentarse como operación real.

## Bibliografía

Aguayo Maldonado, A. (2015). *Diseño de un Sistema Integrado de Gestión de Destinos Turísticos* [Tesis doctoral, Universidad de Málaga].

Calderón Ballón, N. B., & Careaga Veizaga, C. A. (2020). *El marketing digital como herramienta de negocios de las operadoras turísticas en la ciudad de La Paz* [Tesis de licenciatura, Universidad Mayor de San Andrés].

Fielding, R. T. (2000). *Architectural styles and the design of network-based software architectures* [Tesis doctoral, University of California, Irvine].

International Organization for Standardization & International Electrotechnical Commission. (2023). *ISO/IEC 25010:2023 Systems and software Quality Requirements and Evaluation — Product quality model*.

Jones, M., Bradley, J., & Sakimura, N. (2015). *JSON Web Token (JWT)* (RFC 7519). Internet Engineering Task Force.

Oracle Corporation. (s. f.). *MySQL documentation*.

OWASP Foundation. (s. f.). *Application Security Verification Standard*.

Pressman, R. S., & Maxim, B. R. (2021). *Ingeniería de software: un enfoque práctico* (9.ª ed.). McGraw-Hill.

Schwaber, K., & Sutherland, J. (2020). *La Guía Scrum*.

Sommerville, I. (2011). *Ingeniería de software* (9.ª ed.). Pearson.

