# Checklist de entrega final

Fecha de verificación: 8 de noviembre de 2026.

## Producto

- [x] Aplicación web React disponible en `http://localhost:5173`.
- [x] API NestJS saludable en `http://localhost:3000/api/health`.
- [x] MySQL 8.4 con 19 tablas y datos sintéticos.
- [x] Adminer disponible en `http://localhost:8080`.
- [x] Cuatro roles operativos: administrador, cliente, atención y proveedor.
- [x] Los 21 casos de uso están trazados y probados.
- [x] Verificación integral automática: 11 de 11 pasos aprobados.
- [x] Control RBAC comprobado con respuesta `403` para acceso no autorizado.

## Scrum y modelado

- [x] Product Backlog con 21 elementos.
- [x] Cinco sprints con Planning, Backlog, incremento, pruebas, Review y Retrospective.
- [x] Siete modelos por sprint: casos de uso, clases, navegación, presentación, proceso, datos y arquitectura.
- [x] 35 diagramas renderizados en PNG y conservados también como fuente Mermaid.
- [x] Roles Scrum y responsabilidad de cada integrante documentados.

## Documentos y defensa

- [x] Informe final Word generado desde una fuente reproducible.
- [x] Informe actualizado validado como DOCX y con 40 imágenes embebidas.
- [x] Manual de instalación.
- [x] Manual de usuario.
- [x] Guion de demostración.
- [x] Matriz de trazabilidad de casos y pruebas.
- [x] Evidencias de acceso, catálogo y reporte administrativo.
- [x] Presentación final HTML navegable.
- [x] Arquitectura general HTML interactiva y exportable.

## Comandos antes de defender

```powershell
docker compose up -d --build
docker compose ps
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify_product.ps1
```

Después, abrir la aplicación, Adminer, la presentación y el informe. En Microsoft Word se recomienda actualizar el índice con `Ctrl+A` y `F9` antes de exportar o imprimir.
