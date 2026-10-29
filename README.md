# Prototipo de gestión turística

Primera base técnica del marco aplicativo: una base MySQL reproducible con Docker para el catálogo, usuarios por rol, preferencias, reservas simuladas, pagos, cancelaciones, reembolsos, reclamos y auditoría.

## Puesta en marcha

Requisitos: Docker Desktop con el motor iniciado. En este equipo la imagen validada ocupa aproximadamente 227 MB; Docker evita instalar MySQL directamente, aunque la imagen y el volumen sí utilizan espacio en disco.

1. En una instalación nueva, copiar `.env.example` como `.env` y cambiar ambas contraseñas. En este directorio ya existe un `.env` local de demostración ignorado por Git; debe reemplazarse antes de compartir o desplegar el sistema.
2. Iniciar la base:

   ```powershell
   docker compose up -d db
   docker compose ps
   ```

3. Verificar los datos sintéticos:

   ```powershell
   Get-Content -Raw database/scripts/verify.sql | docker compose exec -T db sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
   ```

   Las variables se leen dentro del contenedor, por lo que el comando también funciona si se cambiaron los valores del archivo `.env`.

La base queda accesible solo desde el equipo local en `127.0.0.1:3307` por defecto. Los scripts de `database/init` se ejecutan únicamente cuando se crea el volumen por primera vez.

Para detener sin perder datos:

```powershell
docker compose stop
```

Para volver a iniciar la base ya creada:

```powershell
docker compose start
```

`docker compose down -v` elimina también el volumen y todos los datos de prueba; debe usarse únicamente cuando se quiera reinicializar la base.

## Decisión técnica pendiente

El documento principal contiene dos stacks incompatibles. El apartado 2.5 define React, NestJS, TypeORM y MySQL; los apartados finales de seguridad mencionan Django, PostgreSQL y GNU/Linux. Esta primera entrega sigue el apartado 2.5. Antes de implementar el backend, el equipo debe aprobar un único stack y corregir el documento.

La planificación y el análisis de los tres documentos están en [docs/marco-aplicativo-parte-1.md](docs/marco-aplicativo-parte-1.md).

