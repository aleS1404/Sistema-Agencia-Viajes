# Créditos y licencias de imágenes de destinos

Las fotografías se descargaron desde Wikimedia Commons y se guardaron localmente en `apps/web/public/destinations`. La aplicación muestra un enlace **Foto y licencia** sobre cada imagen para consultar su ficha original.

| Destino | Archivo local | Autor | Licencia | Fuente |
|---|---|---|---|---|
| La Paz / Illimani | `la-paz.jpg` | EEJCC | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Illimani_La_Paz.jpg) |
| Copacabana / lago Titicaca | `copacabana.jpg` | Entropy1963 | Dominio público | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Copacabana_Titicaca.jpg) |
| Coroico | `coroico.jpg` | Phil Whitehouse | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Coroico_vista_parcial_(La_Paz_-_Bolivia).jpg) |

## Tratamiento técnico

- Se descargaron versiones de 1280 píxeles para equilibrar nitidez y peso.
- Las imágenes conservan su proporción y se recortan visualmente con `object-fit: cover`; no se modifica el archivo original.
- Se cargan con `loading="lazy"`.
- Cada imagen incluye texto alternativo con el destino.
- `default.svg` permanece únicamente como respaldo para un destino sin fotografía asignada.

Consulta realizada el 8 de noviembre de 2026.
