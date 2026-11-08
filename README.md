# AndesGo — sistema prototipo de gestión turística

Producto académico para una agencia de viajes de La Paz, inspirado funcionalmente en Booking.com. Implementa 21 casos de uso: acceso por roles, perfil y preferencias, catálogo, búsqueda, comparación, recomendación explicable, reservas, itinerarios, pagos simulados, postventa, soporte, políticas, reportes y auditoría.

Los datos, pagos y reservas son sintéticos. El sistema no realiza operaciones comerciales reales.

## Arquitectura

- Frontend: React, Vite y TypeScript.
- API: NestJS, TypeScript, JWT y TypeORM.
- Base de datos: MySQL 8.4 con 19 tablas.
- Ejecución: Docker Compose.
- Administración de datos: Adminer.
- Roles: `ADMIN`, `CUSTOMER`, `SUPPORT` y `PROVIDER`.

## Inicio rápido con Docker

Requisito: Docker Desktop iniciado.

1. En una instalación nueva, copiar `.env.example` como `.env` y reemplazar las contraseñas y `JWT_SECRET`.
2. Construir e iniciar todo el producto:

   ```powershell
   docker compose up -d --build
   docker compose ps
   ```

3. En la primera ejecución, crear los datos de demostración:

   ```powershell
   cd apps/api
   npm.cmd install
   npm.cmd run seed-demo
   cd ../..
   ```

4. Abrir:

   - Aplicación: [http://localhost:5173](http://localhost:5173)
   - API: [http://localhost:3000/api/health](http://localhost:3000/api/health)
   - Adminer: [http://localhost:8080](http://localhost:8080)

## Cuentas de demostración

Todas utilizan la contraseña `Demo1234!` y existen únicamente para la presentación local.

| Rol | Correo |
|---|---|
| Administrador | `admin@andesgo.demo` |
| Cliente/Viajero | `cliente@andesgo.demo` |
| Personal de atención | `soporte@andesgo.demo` |
| Proveedor turístico | `proveedor@andesgo.demo` |

## Verificación

### API

```powershell
cd apps/api
npm.cmd install
npm.cmd test
npm.cmd run build
```

### Frontend

```powershell
cd apps/web
npm.cmd install
npm.cmd test
npm.cmd run build
```

### Base de datos

```powershell
Get-Content -Raw database/scripts/verify.sql |
  docker compose exec -T db sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

La base se publica únicamente en `127.0.0.1:3307`. Los scripts de `database/init` se ejecutan al crear el volumen por primera vez.

### Recorrido integral del producto

Con los contenedores activos y las cuentas de demostración cargadas:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify_product.ps1
```

El verificador ejecuta 11 pasos y falla con código distinto de cero si algún recorrido no cumple: salud, cuatro roles, catálogo, recomendaciones, reserva e itinerario, pago, cancelación y reembolso, reclamo, gestión del proveedor, reporte administrativo y denegación RBAC `403`.

## Adminer

Abrir [http://localhost:8080](http://localhost:8080) e ingresar con:

- Sistema: `MySQL`.
- Servidor: `db`.
- Usuario, contraseña y base: valores `MYSQL_USER`, `MYSQL_PASSWORD` y `MYSQL_DATABASE` de `.env`.

Seleccionar una tabla y pulsar **Seleccionar datos**. Para la defensa conviene mostrar `roles`, `app_users`, `tourist_services`, `bookings`, `payments`, `refunds`, `complaints` y `audit_logs`.

## Documentación y entrega

- [Informe final Word](Informe_Final_Sistema_Agencia_Viajes.docx)
- [Fuente maestra del informe](docs/final/informe-final.md)
- [Plan de trabajo](docs/plan-trabajo-segunda-presentacion.md)
- [Matriz de los 21 casos](docs/final/trazabilidad/matriz-casos-pruebas.md)
- [Expedientes de los cinco sprints](docs/final/sprints)
- [Manual de instalación](docs/final/manuales/manual-instalacion.md)
- [Manual de usuario](docs/final/manuales/manual-usuario.md)
- [Guion de demostración](docs/final/manuales/guion-demostracion.md)
- [Guía interactiva de usuarios y tablas](docs/guia-usuarios-y-tablas.html)
- [Presentación final interactiva](docs/final/presentacion/index.html)
- [Arquitectura interactiva](docs/final/diagramas/arquitectura-interactiva.html)
- [Evidencias visuales](docs/final/evidencias)

Cada sprint contiene Planning, Sprint Backlog, Review, Retrospective, Incremento, pruebas y siete modelos: casos de uso, clases, navegación, presentación, proceso, datos y arquitectura.

## Detener sin perder datos

```powershell
docker compose stop
```

Para reanudar:

```powershell
docker compose start
```

`docker compose down -v` elimina el volumen y todos los datos. Solo debe utilizarse cuando se quiera reinicializar deliberadamente la demostración.

## Limitaciones conocidas

- Pagos, pasarela, disponibilidad y reservas son simulados.
- El recomendador es basado en contenido y explicable; no usa datos personales reales.
- El prototipo se validó para ejecución local y hasta cinco sesiones de demostración.
- `npm audit --omit=dev` conserva tres alertas moderadas transitivas de TypeORM cuya corrección automática propone una actualización incompatible; la web no reporta vulnerabilidades.
