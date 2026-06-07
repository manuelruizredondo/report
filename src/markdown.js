import MarkdownIt from 'markdown-it';
import attrs from 'markdown-it-attrs';
import anchor from 'markdown-it-anchor';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  // Cada salto de línea del editor (Enter) se convierte en un <br> real en la
  // diapositiva, para poder controlar manualmente dónde se parten las líneas.
  breaks: true,
})
  .use(attrs)
  .use(anchor, { permalink: false, tabIndex: false });

// Añade data-ls / data-le (línea de inicio/fin en el Markdown) a los bloques,
// para poder editar en la vista previa y volcar el cambio al origen.
// La línea base se pasa por env.baseLine (cada diapositiva empieza en otra línea).
function lineNumberPlugin(mdInstance) {
  const blocks = ['paragraph_open', 'heading_open', 'list_item_open', 'blockquote_open'];
  for (const name of blocks) {
    const original =
      mdInstance.renderer.rules[name] ||
      function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
      };
    mdInstance.renderer.rules[name] = function (tokens, idx, options, env, self) {
      const token = tokens[idx];
      if (token.map) {
        const base = (env && env.baseLine) || 0;
        token.attrSet('data-ls', String(base + token.map[0]));
        token.attrSet('data-le', String(base + token.map[1] - 1));
      }
      return original(tokens, idx, options, env, self);
    };
  }
}
md.use(lineNumberPlugin);

export function renderMarkdown(source, baseLine = 0) {
  return md.render(source ?? '', { baseLine });
}

export default renderMarkdown;
