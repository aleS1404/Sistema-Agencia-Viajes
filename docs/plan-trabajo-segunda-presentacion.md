# Plan de trabajo para la segunda presentación y entrega final

## 1. Conclusión de la revisión

El instructivo fija la entrega digital para el **lunes 9 de noviembre de 2026 hasta las 23:30** y la defensa presencial para el **martes 10 de noviembre de 2026**. La entrega debe contener el producto ejecutable y el informe final corregido. El Capítulo III debe demostrar Scrum mediante Product Backlog, roles, Sprint Planning, sprints, Sprint Review, Sprint Retrospective e incrementos documentados.

La corrección principal es obligatoria: el diagrama aprobado contiene **21 casos de uso**, por lo que el Product Backlog funcional debe contener **21 elementos trazables**, no 14 elementos agrupados. Las tareas técnicas, UML, pruebas y documentación se controlarán dentro del Sprint Backlog y la Definition of Done; no sustituirán casos de uso.

El proyecto actual aporta una base verificable: MySQL en Docker, 17 tablas, datos semilla, Adminer, un informe inicial y modelos generales. Todavía faltan el frontend, la API, la implementación demostrable de los 21 casos, los diagramas específicos de cada sprint, las pruebas, las actas Scrum y el informe final completo.

## 2. Decisiones que deben congelarse antes de programar

1. **Nombre del producto:** Sistema prototipo de gestión turística para una agencia de viajes de La Paz, inspirado en Booking.com.
2. **Arquitectura:** arquitectura en capas.
3. **Presentación:** React con Vite.
4. **API y negocio:** NestJS.
5. **Persistencia:** TypeORM y MySQL 8.4.
6. **Ejecución:** Docker Compose para base, Adminer, API y frontend.
7. **IA:** recomendación basada en contenido y similitud, ejecutada como servicio interno del backend para evitar otra infraestructura.
8. **Pagos:** simulados; no se almacenan tarjetas ni se conecta una pasarela real.
9. **Proveedor turístico:** el modelo actual solo lo guarda como entidad comercial, pero el diagrama lo presenta como actor directo. Para la entrega final se añadirá `PROVIDER` y se vinculará su cuenta con `providers`.
10. **Usuarios autenticables finales:** `ADMIN`, `CUSTOMER`, `SUPPORT` y `PROVIDER`. Se retirará `AGENT` del catálogo final porque el diagrama aprobado no le asigna casos de uso; cualquier función de atención se integrará en `SUPPORT`.

Estas decisiones eliminan la contradicción actual entre React/NestJS/MySQL y Django/PostgreSQL. Todo el informe final debe usar un solo stack.

### Brechas críticas verificadas

| Área | Estado actual | Corrección requerida |
|---|---|---|
| Programa | Base MySQL, Docker y Adminer | Crear frontend, API, seguridad, recomendación y recorridos funcionales. |
| Backlog | 14 elementos agrupados | Sustituirlo por los 21 casos del diagrama, uno a uno. |
| Diagramas | Modelos generales | Crear modelos específicos para cada sprint. |
| Scrum | Planificación escrita | Añadir Review, Retrospective e Incremento con evidencia real por sprint. |
| Pruebas | Verificación SQL básica | Añadir pruebas unitarias, funcionales, navegación, interfaz, integración y seguridad. |
| Word | Interlineado 1,5 y numeración interna inconsistente | Aplicar interlineado 2, sangría, márgenes de 2,54 cm y comenzar Product Backlog en 3.1. |
| Actores | Existe `AGENT`; falta `PROVIDER` | Retirar `AGENT`, añadir `PROVIDER` y actualizar base, código, UML e informe. |
| Informe | Capítulos y marco aplicativo separados | Consolidar capítulos I, II y III, índices y bibliografía APA. |

## 3. Product Backlog corregido: 21 casos de uso

| ID | Caso de uso / elemento del Product Backlog | Actor principal | Prioridad | Sprint | Criterio de aceptación mínimo |
|---|---|---|---|---:|---|
| PB-01 | Registrarse e iniciar sesión | Cliente/Viajero | Alta | 1 | El cliente crea una cuenta, inicia sesión y recibe acceso según su rol. |
| PB-02 | Gestionar perfil y preferencias | Cliente/Viajero | Alta | 1 | El cliente modifica sus datos, presupuesto, días e intereses. |
| PB-03 | Buscar y comparar servicios turísticos | Cliente/Viajero | Alta | 2 | Se filtran y comparan servicios por destino, categoría, precio y duración. |
| PB-04 | Consultar recomendaciones personalizadas | Cliente/Viajero | Alta | 2 | El cliente visualiza hasta cinco opciones y la razón de coincidencia. |
| PB-05 | Gestionar reservas | Cliente/Viajero | Alta | 3 | El cliente crea y consulta una reserva con total y estado coherentes. |
| PB-06 | Consultar itinerario | Cliente/Viajero | Alta | 3 | Una reserva confirmada muestra servicios, cantidades, fechas y destino. |
| PB-07 | Realizar pago | Cliente/Viajero | Alta | 3 | El cliente registra un pago simulado asociado a una reserva pendiente. |
| PB-08 | Cancelar reserva | Cliente/Viajero | Alta | 4 | El cliente solicita cancelación únicamente para una reserva permitida. |
| PB-09 | Solicitar reembolso | Cliente/Viajero | Alta | 4 | La solicitud se vincula con una cancelación aprobada y un pago existente. |
| PB-10 | Consultar estado de reserva y pagos | Cliente/Viajero | Alta | 3 | El cliente solo ve estados e importes de sus propias operaciones. |
| PB-11 | Registrar reclamo | Cliente/Viajero | Media | 4 | El cliente crea un reclamo con código, asunto, descripción y reserva opcional. |
| PB-12 | Gestionar usuarios | Administrador | Alta | 1 | El administrador lista, activa, bloquea y asigna roles autorizados. |
| PB-13 | Gestionar proveedores y servicios | Administrador | Alta | 2 | El administrador crea, edita y cambia el estado del catálogo. |
| PB-14 | Gestionar políticas comerciales | Administrador | Media | 5 | El administrador configura reglas demostrativas de cancelación y reembolso. |
| PB-15 | Generar reportes | Administrador | Media | 5 | El sistema presenta indicadores de reservas, pagos, cancelaciones y reclamos. |
| PB-16 | Gestionar información de servicios turísticos | Proveedor turístico | Media | 2 | El proveedor mantiene su información y sus cambios requieren validación administrativa. |
| PB-17 | Generar recomendaciones con IA | Sistema de IA | Alta | 2 | El sistema calcula recomendaciones reproducibles desde perfil e intereses. |
| PB-18 | Registrar y verificar transacciones | Pasarela de pagos simulada | Alta | 3 | Cada transacción conserva referencia única, monto, método y estado. |
| PB-19 | Gestionar cancelaciones y reembolsos | Personal de atención | Alta | 4 | Soporte aprueba o rechaza solicitudes y evita devolver más de lo pagado. |
| PB-20 | Atender reclamos | Personal de atención | Media | 4 | Soporte recibe, asigna, actualiza y documenta la resolución del reclamo. |
| PB-21 | Proteger información y validar accesos | Sistema / Administrador | Alta | 1 | El backend valida autenticación, rol, propiedad del recurso y registra auditoría. |

### Comprobación de cobertura

- Sprint 1: PB-01, PB-02, PB-12 y PB-21 — 4 casos.
- Sprint 2: PB-03, PB-04, PB-13, PB-16 y PB-17 — 5 casos.
- Sprint 3: PB-05, PB-06, PB-07, PB-10 y PB-18 — 5 casos.
- Sprint 4: PB-08, PB-09, PB-11, PB-19 y PB-20 — 5 casos.
- Sprint 5: PB-14 y PB-15 — 2 casos, más integración, calidad y cierre.
- Total: **21 de 21 casos asignados una sola vez**.

## 4. Roles Scrum y responsabilidades

| Responsabilidad | Integrante | Trabajo permanente |
|---|---|---|
| Product Owner | Sheyla | Ordenar backlog, aclarar reglas, aceptar incrementos y validar alcance. |
| Scrum Master | Alexandra | Facilitar eventos, registrar impedimentos y asegurar evidencias Scrum. |
| Líder de desarrollo e integración | Melani | Integrar frontend, backend, base y versiones ejecutables. |
| Developers | Sheyla, Melani y Alexandra | Diseñar, programar, probar, documentar y revisar cada incremento. |
| UML, arquitectura y seguridad | Sheyla, con apoyo del equipo | Mantener modelos y matriz de permisos coherentes con la implementación. |
| Desarrollo funcional | Melani, con apoyo del equipo | Implementar API, interfaz y recorridos de negocio. |
| IA, datos y métricas | Alexandra, con apoyo del equipo | Implementar recomendación, datos sintéticos, reportes y evaluación. |

## 5. Artefactos obligatorios para cada sprint

Cada sprint debe cerrar con **siete conjuntos de modelos**, además de sus pruebas y actas. El primer “Modelo conceptual” del instructivo se interpretará como modelo de requerimientos/casos de uso; el segundo, como modelo conceptual de clases.

1. Diagrama de casos de uso parcial: requisitos, actores y relaciones del sprint.
2. Modelo conceptual de clases: clases, atributos, relaciones e información del dominio.
3. Modelo de navegación: páginas, enlaces y restricciones por rol.
4. Modelo de presentación: interfaces, formularios, menús y componentes.
5. Modelo de proceso: diagrama de actividades con flujos, decisiones y errores.
6. Modelo de datos del incremento: tres entregables identificables, E-R, relacional y físico.
7. Vista de arquitectura del incremento: componentes, capas y cambios respecto al sprint anterior; si no cambia, se documentará expresamente.

Cada carpeta de sprint tendrá:

```text
docs/final/sprints/sprint-0N/
  sprint-planning.md
  sprint-backlog.md
  diagramas/
  pruebas/
  evidencias/
  sprint-review.md
  sprint-retrospective.md
  incremento.md
```

No se marcará un caso como terminado sin captura o resultado verificable, prueba aprobada y correspondencia con sus diagramas.

## 6. Plan detallado por sprint

### Sprint 1 — Identidad, perfiles, usuarios y seguridad

**Objetivo:** ofrecer acceso seguro por roles y permitir gestionar la identidad y preferencias del viajero.

**Backlog seleccionado:** PB-01, PB-02, PB-12 y PB-21.

**Desarrollo:** API de registro e inicio de sesión; hash de contraseñas; JWT; guardas por rol; perfil e intereses; administración de usuarios; auditoría; vistas de acceso, perfil y usuarios.

**Diagramas:**

1. CU-S1: cliente, administrador y acceso protegido.
2. CL-S1: `Role`, `User`, `CustomerProfile`, `Interest` y `AuditLog`.
3. NAV-S1: acceso, registro, perfil y administración de usuarios.
4. PRES-S1: formularios de registro/login/perfil y tabla de usuarios.
5. ACT-S1: registro, autenticación y rechazo de acceso no autorizado.
6. DAT-S1: E-R, modelo relacional y modelo físico de `roles`, `app_users`, `customer_profiles`, `interests`, `customer_interests` y `audit_logs`.
7. ARQ-S1: arquitectura base en capas y despliegue inicial con Docker.

**Responsables:** Sheyla define permisos y UML; Melani implementa API e interfaz; Alexandra prepara datos, pruebas de autorización y documentación del sprint.

**Pruebas:** unitarias de autenticación, funcionales de registro/perfil, integración API-MySQL y seguridad por rol/propiedad.

**Incremento:** un usuario puede registrarse, ingresar, actualizar su perfil y acceder únicamente a funciones autorizadas. PB-21 obtiene su aceptación inicial en este sprint; Sprint 5 ejecutará regresión y endurecimiento sin volver a asignar el caso.

### Sprint 2 — Catálogo, búsqueda y recomendación

**Objetivo:** administrar el catálogo y entregar búsquedas y recomendaciones personalizadas.

**Backlog seleccionado:** PB-03, PB-04, PB-13, PB-16 y PB-17.

**Desarrollo:** CRUD de proveedores, destinos, categorías y servicios; flujo de propuesta del proveedor; búsqueda y comparación; recomendación por intereses, presupuesto y duración; explicación del resultado; fotografías reales locales, accesibles, con carga diferida y atribución para La Paz, Copacabana y Coroico.

**Diagramas:**

1. CU-S2: cliente, administrador, proveedor y sistema de IA.
2. CL-S2: `Provider`, `Destination`, `Category`, `Service`, `Interest` y `Recommendation`.
3. NAV-S2: buscador, resultados, comparación, detalle, recomendación y administración de catálogo.
4. PRES-S2: filtros, tarjetas, comparador, detalle, formulario de servicio y panel de validación.
5. ACT-S2: búsqueda y generación de recomendaciones con alternativas sin coincidencia.
6. DAT-S2: E-R, relacional y físico de catálogo y relaciones de intereses de servicios.
7. ARQ-S2: incorporación de módulos de catálogo, búsqueda y recomendación a las capas existentes.

**Responsables:** Sheyla valida casos, navegación y reglas del catálogo; Melani implementa CRUD, filtros e interfaces; Alexandra implementa recomendación, datos sintéticos y métricas.

**Pruebas:** filtros, navegación, permisos de edición, validaciones de precio/capacidad y resultados del recomendador.

**Incremento:** el administrador mantiene el catálogo y el cliente busca, compara y recibe recomendaciones explicables.

### Sprint 3 — Reservas, itinerario y pagos simulados

**Objetivo:** completar el recorrido principal desde un servicio disponible hasta una reserva pagada y consultable.

**Backlog seleccionado:** PB-05, PB-06, PB-07, PB-10 y PB-18.

**Desarrollo:** creación de reserva e ítems; cálculo del total; itinerario; pago simulado; referencia y verificación; consulta de estados y propiedad del recurso.

**Diagramas:**

1. CU-S3: cliente y pasarela de pagos simulada.
2. CL-S3: `Booking`, `BookingItem`, `TouristService` y `Payment`.
3. NAV-S3: carrito/reserva, confirmación, pago, itinerario y estado.
4. PRES-S3: resumen de reserva, formulario de pago simulado, comprobante e itinerario.
5. ACT-S3: reservar, calcular total, pagar y confirmar o rechazar la transacción.
6. DAT-S3: E-R, relacional y físico de `bookings`, `booking_items` y `payments`.
7. ARQ-S3: flujo frontend–API–transacción MySQL para reserva y pago simulado.

**Responsables:** Sheyla define estados y reglas; Melani implementa transacciones y pantallas; Alexandra prepara datos, pruebas de importes y documentación trazable.

**Pruebas:** cálculo de totales, estados permitidos, referencia única, aislamiento entre clientes e integración reserva-pago.

**Incremento:** el cliente reserva, paga de forma simulada, consulta el estado y visualiza su itinerario.

### Sprint 4 — Cancelaciones, reembolsos y reclamos

**Objetivo:** resolver la postventa con trazabilidad y separación entre cliente y personal de atención.

**Backlog seleccionado:** PB-08, PB-09, PB-11, PB-19 y PB-20.

**Desarrollo:** solicitud y resolución de cancelación; solicitud y aprobación/rechazo de reembolso; regla mínima fija y versionada de postventa; registro, asignación y resolución de reclamos; historial de estados; indicador heurístico explicable de riesgo con puntaje, nivel y factores. La administración configurable de políticas corresponde a PB-14 en Sprint 5 y la visualización consolidada del riesgo a PB-15.

**Diagramas:**

1. CU-S4: cliente y personal de atención.
2. CL-S4: `Cancellation`, `Refund`, `Complaint`, `Booking`, `Payment` y `User`.
3. NAV-S4: solicitud, seguimiento, bandeja de soporte y resolución.
4. PRES-S4: formularios de cancelación/reclamo y panel de casos de soporte.
5. ACT-S4: cancelar y reembolsar con decisiones; registrar y atender reclamo.
6. DAT-S4: E-R, relacional y físico de `cancellations`, `refunds` y `complaints` con sus referencias.
7. ARQ-S4: incorporación del módulo de postventa y su acceso separado para cliente y soporte.

**Responsables:** Sheyla define reglas y controles; Melani implementa los flujos; Alexandra prueba montos/estados y mantiene evidencias e indicadores.

**Pruebas:** transiciones válidas, límites de reembolso, permisos de soporte, navegación de casos y auditoría.

**Incremento:** el cliente solicita postventa y soporte resuelve cada caso sin perder trazabilidad.

### Sprint 5 — Políticas, reportes, integración y cierre

**Objetivo:** proporcionar control administrativo, consolidar los 21 casos y producir una versión instalable y defendible.

**Backlog seleccionado:** PB-14 y PB-15; cierre transversal de PB-01 a PB-21.

**Desarrollo:** políticas comerciales configurables; dashboard filtrable; consultas agregadas; predicción académica mediante regresión lineal; integración del riesgo de cancelación; asistente administrativo por intenciones; endurecimiento de seguridad; corrección de defectos; datos completos de demostración; respaldo/restauración; manual e informe final. Estas funciones amplían PB-15 y PB-17 sin añadir casos al Product Backlog de 21 elementos.

**Diagramas:**

1. CU-S5: administrador, políticas y reportes.
2. CL-S5: `CommercialPolicy`, `ReportQuery`, `Booking`, `Payment`, `Refund` y `Complaint`.
3. NAV-S5: panel administrativo, políticas, reportes y auditoría.
4. PRES-S5: formulario de políticas, filtros, indicadores y gráficos.
5. ACT-S5: aplicar política y generar reporte filtrado.
6. DAT-S5: E-R, relacional y físico de políticas, auditoría y estructuras de reporte.
7. ARQ-S5: arquitectura en capas y despliegue Docker finales, con seguridad transversal.

**Modelos finales adicionales:** diagrama de arquitectura en capas, despliegue Docker, E-R completo, modelo relacional completo y mapa de trazabilidad de los 21 casos.

**Responsables:** Sheyla audita UML, seguridad y aceptación; Melani integra y prepara la versión ejecutable; Alexandra implementa métricas, consolida evidencias y coordina el cierre documental.

**Pruebas:** funcionales de los 21 casos, navegación, interfaz, unitarias, integración, regresión y endurecimiento de PB-21, respaldo/restauración e instalación limpia.

**Incremento:** versión candidata final, ejecutable con Docker, con informe, manual, evidencias y guion de defensa.

## 7. Sprint Planning, Review, Retrospective e incrementos

Para cada sprint se debe documentar lo siguiente:

### Sprint Planning

- Objetivo: por qué se ejecuta el sprint.
- Selección: qué elementos PB entran.
- Plan: cómo se implementarán y probarán.
- Responsables, estimación, dependencias, criterios de aceptación y evidencia esperada.

### Sprint Review

- Fecha y participantes.
- Casos demostrados.
- Resultado por criterio de aceptación: aprobado, observado o pendiente.
- Capturas, enlaces, consultas y pruebas ejecutadas.
- Retroalimentación y cambios solicitados.

### Sprint Retrospective

- Qué funcionó.
- Qué dificultó el trabajo.
- Qué se cambiará en el siguiente sprint.
- Acción concreta, responsable y fecha.

### Incremento

- Funciones incluidas.
- Endpoints y pantallas.
- Tablas o migraciones.
- Diagramas actualizados.
- Pruebas aprobadas.
- Instrucciones de demostración.
- Limitaciones conocidas.

## 8. Subagente de documentación durante el desarrollo

Se mantendrá un subagente dedicado a documentación. Su responsabilidad no será inventar avances, sino convertir evidencia técnica real en material del informe.

### Flujo de trabajo

1. Antes de cada módulo, recibe el caso de uso, criterio de aceptación y diagramas previstos.
2. Después de cada cambio, revisa `git diff`, archivos modificados, endpoints, migraciones y pruebas.
3. Actualiza la matriz `caso de uso → sprint → código → tabla → prueba → evidencia`.
4. Redacta Planning, Review, Retrospective e Incremento del sprint.
5. Marca cada elemento como `Planificado`, `En desarrollo`, `Probado`, `Documentado` o `Bloqueado`.
6. Solicita capturas cuando una afirmación no pueda comprobarse desde código o pruebas.
7. Mantiene citas y bibliografía APA separadas de las evidencias técnicas.
8. Al cierre, actualiza el generador del Word y verifica que el informe coincida con el repositorio.

### Reglas para evitar inconsistencias

- El agente principal controla código y decisiones de arquitectura.
- El subagente controla documentos de sprint, trazabilidad y borradores del informe.
- No se editan simultáneamente los mismos archivos.
- Ningún caso se declara terminado sin prueba o demostración.
- Cada figura debe tener número, título, fuente y referencia dentro del texto.
- Los resultados de Review y Retrospective deben reflejar hechos, no plantillas vacías.

## 9. Plan de recuperación hasta la entrega

Los cinco sprints son la estructura académica del desarrollo. Como la fecha actual es 7 de noviembre y la entrega vence el 9, se necesita además un plan corto de recuperación. No debe afirmarse que una iteración histórica fue completada si no existe evidencia; el informe debe distinguir entre planificación original y ejecución real.

| Bloque | Trabajo crítico | Salida verificable |
|---|---|---|
| 7 de noviembre | Congelar stack y alcance; corregir backlog a 21; preparar estructura frontend/API; cerrar identidad, permisos y catálogo base | Sprint 1 ejecutable y estructura documental completa |
| 8 de noviembre, mañana | Finalizar catálogo, búsqueda, comparación y recomendación; crear modelos de Sprint 2 | Incremento de catálogo/IA demostrable |
| 8 de noviembre, tarde/noche | Implementar reservas, itinerario, pagos, cancelaciones, reembolsos y reclamos | Incrementos de Sprint 3 y 4 con pruebas esenciales |
| 9 de noviembre, mañana | Políticas, reportes, auditoría, integración, datos de demostración y pruebas de los 21 casos | Release candidata y matriz de trazabilidad completa |
| 9 de noviembre, tarde | Corregir capítulos I y II; completar Capítulo III, APA, costos, calidad, seguridad y diagramas | Word y PDF finales |
| 9 de noviembre, 18:00–21:00 | Instalación limpia, ensayo de demostración, revisión cruzada y preparación de entrega | ZIP/repositorio, manual y guion de defensa |
| 9 de noviembre, antes de 21:30 | Subir a Classroom con dos horas de margen | Entrega confirmada antes de 23:30 |

Este calendario solo es viable para un **prototipo académico**: pagos simulados, catálogo sintético, recomendación explicable y sin integraciones productivas.

## 10. Informe final requerido

### Formato

- Márgenes de 2,54 cm.
- Times New Roman 12; títulos y subtítulos en 14.
- Interlineado doble y sangría de primera línea.
- Numeración continua; portada sin número y preliminares con romanos cuando corresponda.
- Número de página centrado en el pie.

### Contenido

1. Carátula e índices.
2. Capítulo I corregido: introducción, problema, antecedentes, objetivos, justificación, alcance/límites y cronograma, con APA.
3. Capítulo II corregido: institución/proceso actual, metodología y pruebas, aporte informático, tecnologías, ISO 25010, costo-beneficio/COCOMO y seguridad.
4. Capítulo III: 21 elementos del Product Backlog, roles Scrum, Planning, cinco sprints, Review, Retrospective e incrementos.
5. Seis modelos por sprint y modelos finales de arquitectura/datos.
6. Pruebas funcionales, navegación, interfaz, unitarias, integración y seguridad.
7. Desarrollo del programa, manual de instalación, manual de usuario y evidencias.
8. Bibliografía final en formato APA.

## 11. Definition of Done final

Un caso de uso está terminado cuando:

- tiene criterio de aceptación aprobado;
- funciona desde la interfaz y valida permisos en backend;
- persiste o consulta datos coherentes;
- posee prueba y evidencia;
- aparece en los diagramas de su sprint;
- está relacionado en la matriz de trazabilidad;
- se puede demostrar desde una instalación limpia;
- no contiene secretos ni datos reales;
- está documentado en Review, Incremento e informe final.

La entrega está terminada cuando `docker compose up -d` inicia el producto, los 21 casos tienen estado y evidencia, los modelos de cada sprint están incluidos, el Word/PDF cumple el instructivo y las tres integrantes pueden defender su parte.

## 12. Orden de ejecución recomendado

1. Corregir el backlog y la trazabilidad en el informe y generador Word.
2. Crear estructura monorepo de frontend y backend sin alterar la base existente.
3. Implementar Sprint 1 y su documentación antes de abrir funciones dependientes.
4. Implementar Sprint 2; luego Sprint 3; después Sprint 4.
5. Ejecutar Sprint 5 como integración real, no como acumulación de tareas sin probar.
6. Generar diagramas desde la evidencia del código y la base.
7. Ejecutar pruebas y capturar resultados.
8. Regenerar Word/PDF, revisar formato y referencias.
9. Ensayar una demostración de máximo 12–15 minutos con datos preparados.
10. Subir la entrega antes de las 21:30 del 9 de noviembre.
