# Generador de documentación (Markdown → PDF)

Interfaz web para convertir Markdown en documentos PDF para clientes, aplicando tu
propio diseño y design system. Renderiza con Chrome headless (Puppeteer) para máxima
fidelidad visual.

## Uso

```bash
npm install      # solo la primera vez (descarga Chromium)
npm start        # arranca en http://localhost:4321
```

Abre `http://localhost:4321`, elige o crea un proyecto en la barra lateral, escribe tu
Markdown (se **autoguarda**), y pulsa **Vista previa** o **Descargar PDF**.

Para cambiar el puerto: `PORT=8080 npm start`.

## Proyectos (listado)

La barra lateral izquierda lista todos tus documentos como proyectos:

- **+** crea un proyecto vacío; **Crear desde ejemplo** parte de la plantilla; **Subir .md**
  importa un archivo como nuevo proyecto.
- Haz clic en un proyecto para abrirlo y editarlo. Los cambios se **guardan solos**.
- El **nombre** de cada proyecto se toma automáticamente del `title` del frontmatter (o del
  primer encabezado). Cambia el título y el nombre del listado se actualiza.
- La **×** elimina el proyecto (pide confirmación).

Cada proyecto se guarda como un archivo JSON en `data/` (un archivo por proyecto). Esa
carpeta está en `.gitignore`; haz copia de seguridad de `data/` si quieres conservarlos.

## Cómo escribir los documentos

### Portada (frontmatter opcional)

Empieza el archivo con un bloque de metadatos. Si incluyes `title`, se genera una
portada automática:

```markdown
---
eyebrow: Propuesta de servicios
title: Plan de Transformación Digital
subtitle: Hoja de ruta y alcance del proyecto
brand: Tu Marca
client: Cliente Ejemplo S.L.
date: 5 de junio de 2026
version: 1.0
author: Manuel Ruiz
logo: https://.../logo.png
---
```

`brand`/`client` también alimentan el pie de página con numeración.

### Contenido

Markdown estándar: encabezados, listas, tablas, código, citas, imágenes.

Extras del design system:

- **Callouts:** añade `{.callout .info}` o `{.callout .warn}` al final de un párrafo.
- **Salto de página:** `<div class="page-break"></div>`.
- **Clases/atributos:** cualquier `{.clase #id}` se engancha al CSS (markdown-it-attrs).

## Personalizar el diseño  ← aquí va TU design system

Todo el aspecto visual del PDF vive en dos archivos:

| Archivo | Qué controla |
| --- | --- |
| `design/tokens.css` | Colores, tipografías, espaciado, tamaños, márgenes de página. **Empieza por aquí.** |
| `design/document.css` | Maquetación: encabezados, tablas, portada, callouts, saltos de página. |

Cuando me pases tu diseño y tu design system, traduzco tus tokens a `design/tokens.css`
y ajusto `design/document.css` para clavar la maquetación.

## Estructura

```
server.js            Servidor web (Express): /api/preview, /api/pdf y /api/projects
src/
  markdown.js        Markdown → HTML (markdown-it + plugins)
  frontmatter.js     Parser de metadatos de portada
  template.js        Ensambla el HTML completo con el design system
  pdf.js             HTML → PDF (Puppeteer)
  store.js           Guardado de proyectos (CRUD sobre data/)
design/
  tokens.css         Design system (editar para tu marca)
  document.css       Maquetación del documento + simulación A4 en pantalla
public/              Interfaz web (sidebar de proyectos + editor + vista previa)
data/                Proyectos guardados (un .json por proyecto; en .gitignore)
```
