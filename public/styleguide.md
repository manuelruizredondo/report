---
eyebrow: Design System
title: Styleguide del documento
subtitle: Referencia visual de todos los componentes para diseñar la marca
brand: Tu Marca
client: Uso interno
date: 7 de junio de 2026
version: 1.0
author: Equipo de diseño
---

# 1. Encabezados

Esta es la jerarquía de títulos. Úsalos para estructurar el documento de mayor a menor.

# H1 — Título de documento / sección principal
## H2 — Sección
### H3 — Subsección
#### H4 — Apartado

---

# 2. Texto y énfasis

Párrafo de cuerpo estándar. Aquí se aprecia el **tamaño base**, la **interlínea** y el
**ancho de medida** del texto. Conviene que una línea ronde los 70–90 caracteres para
una lectura cómoda en A4.

Dentro del texto puedes usar **negrita**, *cursiva*, ***negrita y cursiva***,
`código en línea` y [enlaces](https://ejemplo.com). También ~~texto tachado~~ si lo
necesitas.

> Cita destacada. Útil para resaltar una idea, un objetivo o una frase de impacto. Sale
> como un bloque con fondo suave.

---

# 3. Listas

**No ordenada:**

- Primer punto de la lista.
- Segundo punto, algo más largo para ver cómo envuelve el texto en una segunda línea.
- Tercer punto.
  - Subpunto anidado.
  - Otro subpunto anidado.

**Ordenada:**

1. Paso uno.
2. Paso dos.
3. Paso tres.
   1. Subpaso anidado.
   2. Subpaso anidado.

---

# 4. Avisos (callouts)

Para resaltar información, añade `{.callout .info}` o `{.callout .warn}` al final del
párrafo.

Bloque informativo: contexto, una nota o una aclaración para el cliente. {.callout .info}

Bloque de atención: un plazo, una condición o algo que requiere acción. {.callout .warn}

---

# 5. Tablas

| Concepto        | Descripción                          | Importe   |
| --------------- | ------------------------------------ | --------- |
| Descubrimiento  | Auditoría y definición de requisitos | 3.000 €   |
| Diseño          | Arquitectura y prototipos            | 4.500 €   |
| Desarrollo      | Implementación iterativa             | 12.000 €  |
| **Total**       |                                      | **19.500 €** |

---

# 6. Código

Texto con `código en línea` y bloque de código con resaltado monoespaciado:

```js
function generarPDF(markdown, designSystem) {
  const html = render(markdown);
  return aplicar(designSystem, html).toPDF({ format: 'A4' });
}
```

---

# 7. Imágenes

Las imágenes se ajustan al ancho de la página manteniendo proporción:

<img alt="Imagen de ejemplo" src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='240'><rect width='800' height='240' fill='%23f4f4f5'/><rect x='0' y='0' width='6' height='240' fill='%23f70154'/><text x='400' y='130' font-family='sans-serif' font-size='22' fill='%2318181b' text-anchor='middle'>Imagen / gráfico de ejemplo</text></svg>" />

---

# 8. Separador y salto de página

La línea horizontal (`---`) separa bloques dentro de la misma página. El bloque siguiente
fuerza el inicio de una **página nueva**:

<div class="page-break"></div>

# 9. Página nueva

Este encabezado debería aparecer al principio de una hoja A4 nueva, gracias al salto de
página anterior. Útil para anexos, secciones largas o portadas internas.

> Fin del styleguide. Edita `design/tokens.css` (marca) y `design/document.css`
> (maquetación) para diseñar cada uno de estos componentes.
