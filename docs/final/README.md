# Expediente de entrega final

Esta carpeta es la fuente documental de la segunda presentación. Mantiene separados los planes, la evidencia y los resultados verificados para evitar declarar trabajo no comprobado.

## Estado documental

- `informe-final.md`: fuente maestra narrativa.
- `trazabilidad/matriz-casos-pruebas.md`: relación entre los 21 casos, sprint, código, datos, pruebas y evidencia.
- `sprints/`: Planning, backlog, Review, Retrospective, incremento, pruebas y siete modelos de cada sprint.
- `manuales/`: instalación, usuario y demostración.
- `decisiones/`: decisiones de arquitectura y alcance.
- `evidencias/`: capturas verificadas del acceso, usuarios, reportes, catálogo y recomendaciones.
- `presentacion/`: defensa final interactiva en HTML y copia PDF de 16 diapositivas.
- `diagramas/`: arquitectura general interactiva y exportable.
- `ia/`: documentación y arquitecturas interactivas del dashboard predictivo, asistente y riesgo de cancelación.

Los 21 casos quedaron trazados como `PROBADO` el 8 de noviembre de 2026 mediante endpoints, pruebas y recorrido integrado. El informe actualizado incorpora 35 diagramas de sprint y seis capturas de la interfaz ejecutada.

## Generación del Word

```powershell
python scripts/generate_informe_final.py
```

El resultado se crea como `Informe_Final_Sistema_Agencia_Viajes.docx`. Si ese archivo está abierto en Word, el generador conserva la copia abierta y crea `Informe_Final_Sistema_Agencia_Viajes_Actualizado.docx`. El archivo histórico `Marco_Aplicativo_Capitulo_III.docx` no se modifica.

## Verificación reproducible

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify_product.ps1
```

El script comprueba los recorridos principales y el control de acceso de los cuatro roles contra la API levantada en Docker.

