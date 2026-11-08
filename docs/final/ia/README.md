# Módulos de analítica e inteligencia administrativa

Este expediente documenta tres implementaciones solicitadas para el cierre de AndesGo y la mejora visual del catálogo. Todas operan con datos sintéticos de MySQL, están protegidas para el rol `ADMIN` y evitan afirmar capacidades de inteligencia artificial que el prototipo no posee.

| Implementación | Resultado | Sprint | Documento | Arquitectura interactiva |
|---|---|---:|---|---|
| Dashboard y predicción | KPI, filtros, alertas y regresión lineal de demanda | 5 | [dashboard-predictivo.md](dashboard-predictivo.md) | [dashboard-predictivo.html](arquitecturas/dashboard-predictivo.html) |
| Asistente administrativo | Consulta por intenciones sobre datos actuales | 5 | [chatbot-administrativo.md](chatbot-administrativo.md) | [chatbot-administrativo.html](arquitecturas/chatbot-administrativo.html) |
| Riesgo de cancelación | Puntaje 0–100, nivel y factores explicables | 4, integrado en 5 | [riesgo-cancelacion.md](riesgo-cancelacion.md) | [riesgo-cancelacion.html](arquitecturas/riesgo-cancelacion.html) |
| Imágenes de destinos | Ilustraciones SVG locales de La Paz, Copacabana y Coroico | 2 | [integracion-informe-y-sprints.md](integracion-informe-y-sprints.md) | No requiere arquitectura separada |

La guía de ubicación en el informe final y la asignación por sprint se encuentra en [integracion-informe-y-sprints.md](integracion-informe-y-sprints.md).

## Acceso demostrativo

1. Ejecutar `docker compose up -d --build`.
2. Abrir `http://localhost:5173`.
3. Ingresar como `admin@andesgo.demo` con `Demo1234!`.
4. Abrir **Dashboard** o **Asistente IA** en el menú lateral.

## Validación reproducible

```powershell
npm.cmd --prefix apps/api run build
npm.cmd --prefix apps/web run build
npm.cmd --prefix apps/web test -- --run
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify_product.ps1
```

El verificador integral comprueba 13 recorridos, incluidos dashboard, siete puntos de predicción, riesgo de cancelación, asistente y denegación RBAC.
