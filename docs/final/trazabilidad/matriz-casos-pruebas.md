# Matriz de trazabilidad funcional

Estado actualizado el 8 de noviembre de 2026 desde código, pruebas automatizadas y recorrido integrado. No se incorporaron capturas porque todavía no fueron generadas.

| PB | Sprint | Caso | Actor | Módulo esperado | Datos principales | Prueba esperada | Evidencia | Estado |
|---|---:|---|---|---|---|---|---|---|
| PB-01 | 1 | Registrarse e iniciar sesión | Cliente | `POST /auth/register`, `POST /auth/login` | roles, app_users | login de cuatro roles | recorrido integrado | PROBADO |
| PB-02 | 1 | Gestionar perfil y preferencias | Cliente | `GET/PATCH /auth/me` | customer_profiles, customer_interests | funcional + integración | API y pantalla integradas | PROBADO |
| PB-03 | 2 | Buscar y comparar servicios | Cliente | `GET /catalog/services` | tourist_services | catálogo y filtros | proxy web devolvió 12 servicios | PROBADO |
| PB-04 | 2 | Consultar recomendaciones | Cliente | `GET /recommendations` | profiles, interests, services | respuesta personalizada | 5 recomendaciones devueltas | PROBADO |
| PB-05 | 3 | Gestionar reservas | Cliente | `GET/POST /bookings` | bookings, booking_items | creación y consulta | reserva creada; reporte totaliza 3 | PROBADO |
| PB-06 | 3 | Consultar itinerario | Cliente | `GET /bookings/:id/itinerary` | booking_items, services | consulta de itinerario propio | endpoint integrado | PROBADO |
| PB-07 | 3 | Realizar pago | Cliente | `POST /bookings/:id/payments` | payments, bookings | pago simulado | pago aprobado en recorrido | PROBADO |
| PB-08 | 4 | Cancelar reserva | Cliente | `POST /bookings/:id/cancellations` | cancellations, bookings | estados | solicitud creada | PROBADO |
| PB-09 | 4 | Solicitar reembolso | Cliente | `POST /bookings/:id/refunds` | refunds, cancellations, payments | límites de monto | solicitud y aprobación verificadas | PROBADO |
| PB-10 | 3 | Consultar estados | Cliente | `GET /bookings/:id/status` | bookings, payments | propiedad | endpoint protegido integrado | PROBADO |
| PB-11 | 4 | Registrar reclamo | Cliente | `POST /complaints` | complaints | funcional | reclamo creado y resuelto | PROBADO |
| PB-12 | 1 | Gestionar usuarios | Administrador | `GET/PATCH /admin/users/:id` | app_users, roles | autorización | administrador visualizó 4 usuarios | PROBADO |
| PB-13 | 2 | Gestionar proveedores y servicios | Administrador | `POST /admin/providers`, `POST/PATCH /services` | providers, tourist_services | CRUD + autorización | API integrada | PROBADO |
| PB-14 | 5 | Gestionar políticas | Administrador | `GET /policies`, `POST /admin/policies` | commercial_policies | CRUD + validación | endpoint y semilla STANDARD-24H | PROBADO |
| PB-15 | 5 | Generar reportes | Administrador | `GET /admin/reports` | consultas agregadas | funcional + autorización | reportó 3 reservas | PROBADO |
| PB-16 | 2 | Gestionar información de servicios | Proveedor | `GET /provider/services`, `POST/PATCH /services` | provider_users, tourist_services | propiedad | proveedor visualizó 6 servicios | PROBADO |
| PB-17 | 2 | Generar recomendaciones con IA | Sistema IA | `GET /recommendations` | service_interests | reproducibilidad | 5 resultados explicables | PROBADO |
| PB-18 | 3 | Verificar transacciones | Pasarela simulada | `POST /bookings/:id/payments` | payments | referencia + estados | transacción aprobada | PROBADO |
| PB-19 | 4 | Gestionar cancelaciones y reembolsos | Soporte | rutas `/support/cancellations` | cancellations, refunds | autorización + límites | reembolso aprobado | PROBADO |
| PB-20 | 4 | Atender reclamos | Soporte | `PATCH /support/complaints/:id` | complaints | estados + asignación | reclamo terminó `resolved` | PROBADO |
| PB-21 | 1 | Proteger información y accesos | Sistema | JWT, guardas y `/admin/audit` | app_users, audit_logs | seguridad | cliente recibió 403; 16 eventos | PROBADO |

