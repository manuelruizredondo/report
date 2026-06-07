# Guía: cómo escribir el Markdown (formato presentación 16:9)

El documento se genera como **diapositivas apaisadas 16:9** con el estilo Making Science /
Massimo Dutti (degradado morado→rosa, separadores morados, eyebrows rosas).

## 1. Portada (frontmatter)

La primera diapositiva es la **portada con degradado**, generada desde el frontmatter:

```markdown
---
eyebrow: Massimo Dutti
title: User Experience
subtitle: Data + UX / UI
brand: making science
client: Massimo Dutti
date: Mayo 2019
version: 1.0
author: Equipo UX
---
```

`brand` aparece arriba a la izquierda y como marca abajo a la derecha en todas las diapositivas.

## 2. Separar diapositivas

Cada diapositiva se separa con una línea `---` **rodeada de líneas en blanco**:

```markdown
Contenido de la diapositiva A.

---

Contenido de la diapositiva B.
```

> Importante: deja una línea en blanco antes y después del `---`, o se interpretará como
> subrayado de título (Markdown) en vez de separador.

## 3. Tipos de diapositiva

### Contenido (por defecto)
Fondo blanco, barra de degradado arriba, eyebrow rosa + título con filete:

```markdown
Enfoque táctico UX {.eyebrow}

# Propuesta

Reto: {.label}

Texto del cuerpo con **negritas** para resaltar.
```

- `{.eyebrow}` → etiqueta rosa pequeña sobre el título.
- `{.label}` → etiqueta rosa tipo "Reto:", "Objetivo:".

### Separador de sección (morado)
Añade `{.section}` al título. Toda la diapositiva pasa a morado, con el texto a la derecha:

```markdown
Enfoque estratégico UX {.eyebrow}

# Propuesta {.section}
```

## 4. Dos columnas automáticas (mucho texto)

**Desde la vista previa (lo más rápido):** pasa el ratón sobre una diapositiva y pulsa el
botón **▥ Dos columnas** (arriba a la izquierda). Vuelve a pulsarlo (**▭ Una columna**)
para deshacerlo. El botón solo aparece en pantalla, nunca en el PDF.

**Desde el Markdown:** marca la página escribiendo `:::columns` (en una línea, normalmente
al principio del slide). El texto fluye **automáticamente en dos columnas balanceadas**;
el eyebrow y el título se quedan a todo el ancho:

```markdown
:::columns

Contexto y diagnóstico {.eyebrow}

# Situación actual

Párrafo largo… el texto se reparte solo entre las dos columnas a medida que crece.

Otro párrafo… cuando se llena la primera columna, continúa en la segunda.
```

Acepta también `:::cols` o `:::2col`. Solo aplica a diapositivas de contenido.

## 5. Dos columnas manuales con panel gris

Si quieres controlar **qué va en cada columna** (p. ej. texto + un panel gris):

```markdown
# Proceso

<div class="cols">
<div>

Texto de la columna izquierda con **markdown** normal.

</div>
<div class="panel">

Objetivo: {.label}

- Punto uno
- Punto dos

</div>
</div>
```

> Dentro de los `<div>` deja **líneas en blanco** alrededor del contenido para que el
> Markdown se procese.

## 6. Saltos de línea y espacios

Para arreglar texto que se ve cortado o mal repartido:

- **Editar en la vista previa:** haz **clic** sobre cualquier texto de la diapositiva,
  coloca el cursor (o selecciona con el ratón) y pulsa **Enter** para insertar un salto
  justo ahí. El cambio se guarda solo en el Markdown (conservando negritas, enlaces y
  etiquetas como `{.eyebrow}`).

- **Salto de línea manual en el editor:** pulsa **Enter** donde quieras partir la línea.
  Cada Enter dentro de un párrafo se convierte en un salto real en la diapositiva.

  ```markdown
  Primera línea tal y como la quiero
  Segunda línea exactamente aquí
  ```

- **Partir un título:** los títulos (`#`) van en una sola línea, así que usa `<br>`:

  ```markdown
  # Plan de transformación<br>digital 2026
  ```

- **Mantener palabras juntas** (que no se separen al final de línea): usa un espacio
  duro `&nbsp;` entre ellas, p. ej. `Massimo&nbsp;Dutti`.

- **Equilibrado automático:** los títulos y párrafos ya reparten las líneas solos
  (`text-wrap: balance` / `pretty`) para evitar palabras huérfanas. Los saltos manuales
  mandan sobre el automático.

> Recuerda: cada diapositiva mide 720 px de alto. Si el texto se "corta" porque no cabe,
> repártelo en otra diapositiva (`---`) o ponlo en dos columnas (`:::columns`).

## 7. Resto de elementos

Listas, **negrita**, *cursiva*, `código`, tablas, citas, imágenes y bloques de código
funcionan igual. Recuerda que **cada diapositiva tiene altura fija (720px)**: si metes
demasiado contenido, se recorta. Reparte en varias diapositivas.

## 8. Diseñar el estilo

- **[design/tokens.css](design/tokens.css)** → colores (degradado, morado, rosa),
  tipografías y tamaños.
- **[design/document.css](design/document.css)** → maquetación de cada tipo de diapositiva.

Al tocar `design/*.css` basta con recargar la vista previa; al tocar `src/` o `server.js`
hay que reiniciar (`npm start`).
