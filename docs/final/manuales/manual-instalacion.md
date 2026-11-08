# Manual de instalación

**Estado:** validado con la versión integrada el 8 de noviembre de 2026.

## Requisitos

- Windows 10/11.
- Docker Desktop iniciado.
- Git para obtener el repositorio.

## Preparación

1. Copiar `.env.example` como `.env`.
2. Reemplazar las contraseñas de demostración.
3. Verificar que los puertos configurados estén libres.

## Inicio esperado

```powershell
docker compose up -d --build
docker compose ps
```

## Servicios esperados

- Aplicación web: `http://localhost:5173`.
- API: `http://localhost:3000/api`.
- Salud: `http://localhost:3000/api/health`.
- Adminer: `http://localhost:8080`.
- MySQL local: `127.0.0.1:3307`.

La base y la API superaron sus healthchecks; la web respondió HTTP 200 y Adminer quedó activo.

## Cierre

```powershell
docker compose stop
```

No ejecutar `docker compose down -v` durante una demostración, porque elimina el volumen y los datos.

