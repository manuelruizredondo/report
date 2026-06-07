import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderMarkdown } from './markdown.js';
import { parseFrontmatter } from './frontmatter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const designDir = join(__dirname, '..', 'design');

function loadCss() {
  const tokens = readFileSync(join(designDir, 'tokens.css'), 'utf8');
  const doc = readFileSync(join(designDir, 'document.css'), 'utf8');
  return `${tokens}\n${doc}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildCover(data) {
  if (!data.title) return '';
  const meta = [
    ['Cliente', data.client],
    ['Fecha', data.date],
    ['Versión', data.version],
    ['Autor', data.author],
  ]
    .filter(([, v]) => v !== undefined && v !== '')
    .map(
      ([label, v]) => `
        <div class="cover__meta-item">
          <span class="cover__meta-label">${label}</span>
          <span class="cover__meta-value">${escapeHtml(v)}</span>
        </div>`
    )
    .join('');

  return `
  <section class="slide slide--cover">
    <div class="slide__inner">
      <div class="cover__top">${escapeHtml(data.brand || '')}</div>
      <div class="cover__center">
        ${data.eyebrow ? `<div class="cover__eyebrow">${escapeHtml(data.eyebrow)}</div>` : ''}
        <h1 class="cover__title">${escapeHtml(data.title)}</h1>
        ${data.subtitle ? `<p class="cover__subtitle">${escapeHtml(data.subtitle)}</p>` : ''}
      </div>
      <div class="cover__meta">${meta}</div>
    </div>
  </section>`;
}

function slideTypeClass(html) {
  return /class="[^"]*\bsection\b/.test(html) ? 'slide slide--section' : 'slide slide--content';
}

// Marcador de dos columnas: se sustituye por una línea en blanco (preserva la numeración).
const COLS_RE = /^[ \t]*:::[ \t]*(columns|cols|2col|dos-columnas)[ \t]*$/im;

// Divide el cuerpo en diapositivas por separadores `---` (rodeados de líneas en blanco),
// devolviendo también la línea de inicio de cada parte dentro del cuerpo.
function splitSlidesWithLines(content) {
  const lines = content.split('\n');
  const sep = /^[ \t]*-{3,}[ \t]*$/;
  const parts = [];
  let cur = [];
  let curStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const isSep =
      sep.test(lines[i]) &&
      (i === 0 || lines[i - 1].trim() === '') &&
      (i === lines.length - 1 || lines[i + 1].trim() === '');
    if (isSep) {
      parts.push({ startLine: curStart, text: cur.join('\n') });
      cur = [];
      curStart = i + 1;
    } else {
      cur.push(lines[i]);
    }
  }
  parts.push({ startLine: curStart, text: cur.join('\n') });
  return parts.filter((p) => p.text.trim());
}

export function buildDocumentHtml(markdownSource) {
  const src = markdownSource ?? '';
  const { data, content } = parseFrontmatter(src);
  const fmPrefixLen = src.length - content.length;
  const fmLineCount = src.slice(0, fmPrefixLen).split('\n').length - 1;

  const cover = buildCover(data);

  const slides = splitSlidesWithLines(content)
    .map((part) => {
      const twoCol = COLS_RE.test(part.text);
      const cleaned = part.text.replace(COLS_RE, ''); // deja línea en blanco -> no cambia numeración
      const baseLine = fmLineCount + part.startLine;
      const lineCount = part.text.split('\n').length;
      const slStart = baseLine;
      const slEnd = baseLine + lineCount - 1;
      const html = renderMarkdown(cleaned, baseLine);
      let cls = slideTypeClass(html);
      const isContent = cls.includes('slide--content');
      if (twoCol && isContent) cls += ' slide--twocol';
      const toolbar = isContent
        ? `<div class="slide__toolbar"><button class="slide__btn" data-action="toggle-cols">${
            twoCol ? '▭ Una columna' : '▥ Dos columnas'
          }</button></div>`
        : '';
      return `<section class="${cls}" data-sl-start="${slStart}" data-sl-end="${slEnd}" data-twocol="${
        twoCol ? 1 : 0
      }">${toolbar}<div class="slide__inner">${html}</div></section>`;
    })
    .join('\n');

  const css = loadCss();
  const brandMark = (data.brand ? String(data.brand) : '').replace(/["\\]/g, '');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.title || 'Documento')}</title>
  <style>${css}</style>
</head>
<body style='--brand-mark: "${brandMark}"'>
  <div class="page-viewport">
    <div class="page-stack">
      ${cover}
      ${slides}
    </div>
  </div>
  ${editorScript()}
</body>
</html>`;
}

// Script de pantalla: escala al ancho + edición de saltos de línea en la vista previa.
function editorScript() {
  return `<script>
  (function () {
    var root = document.documentElement;

    // ---- Ajuste al ancho del panel ----
    // Escala a partir del ancho REAL conocido (--slide-w), no de la medición ya
    // escalada: así llena el ancho de forma estable en cualquier navegador.
    function fit() {
      var vp = document.querySelector('.page-viewport');
      if (!vp) return;
      var natural = parseFloat(getComputedStyle(root).getPropertyValue('--slide-w')) || 1280;
      var avail = vp.clientWidth - 48; // menos el padding lateral del visor
      if (avail <= 0) return;
      root.style.setProperty('--scale', Math.max(0.2, avail / natural)); // llena el ancho (puede ampliar)
    }
    window.addEventListener('resize', fit);
    window.addEventListener('load', fit);
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(fit);
      var vp0 = document.querySelector('.page-viewport');
      if (vp0) ro.observe(vp0);
    }
    fit();
    requestAnimationFrame(fit);
    setTimeout(fit, 200);

    // ---- Edición en la vista previa (saltos de línea) ----
    function inlineMd(node) {
      var out = '';
      node.childNodes.forEach(function (n) {
        if (n.nodeType === 3) out += n.nodeValue;
        else if (n.nodeName === 'BR') out += '<br>';
        else if (n.nodeName === 'STRONG' || n.nodeName === 'B') out += '**' + inlineMd(n) + '**';
        else if (n.nodeName === 'EM' || n.nodeName === 'I') out += '*' + inlineMd(n) + '*';
        else if (n.nodeName === 'CODE') out += '\\\`' + inlineMd(n) + '\\\`';
        else if (n.nodeName === 'A') out += '[' + inlineMd(n) + '](' + (n.getAttribute('href') || '') + ')';
        else out += inlineMd(n);
      });
      return out;
    }
    function serializeBlock(el) {
      var tag = el.tagName.toLowerCase();
      var text = inlineMd(el).replace(/\\u00a0/g, '&nbsp;').trim();
      var prefix = '';
      if (tag === 'h1') prefix = '# ';
      else if (tag === 'h2') prefix = '## ';
      else if (tag === 'h3') prefix = '### ';
      else if (tag === 'h4') prefix = '#### ';
      else if (tag === 'li') prefix = el.parentElement && el.parentElement.tagName === 'OL' ? '1. ' : '- ';
      var suffix = '';
      var cl = el.classList;
      if (cl.contains('eyebrow')) suffix = ' {.eyebrow}';
      else if (cl.contains('label')) suffix = ' {.label}';
      else if (cl.contains('section')) suffix = ' {.section}';
      else if (cl.contains('callout')) suffix = ' {.callout' + (cl.contains('warn') ? ' .warn' : ' .info') + '}';
      return prefix + text + suffix;
    }
    function insertBreak() {
      var sel = getSelection();
      if (!sel.rangeCount) return;
      var r = sel.getRangeAt(0);
      r.deleteContents();
      var br = document.createElement('br');
      r.insertNode(br);
      r.setStartAfter(br);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
    }
    function setupEditing() {
      document.querySelectorAll('.slide [data-ls]').forEach(function (el) {
        if (!/^(P|H1|H2|H3|H4|LI)$/.test(el.tagName)) return;
        el.setAttribute('contenteditable', 'true');
        el.spellcheck = false;
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); insertBreak(); }
        });
        el.addEventListener('focus', function () { el._orig = serializeBlock(el); });
        el.addEventListener('blur', function () {
          var now = serializeBlock(el);
          if (now === el._orig) return; // sin cambios -> no re-render, no salto
          parent.postMessage({
            source: 'doc-preview', type: 'edit',
            ls: +el.dataset.ls, le: +el.dataset.le, md: now,
          }, '*');
        });
      });
    }
    setupEditing();

    // ---- Botón de dos columnas por diapositiva ----
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.slide__btn') : null;
      if (!btn) return;
      var section = btn.closest('.slide');
      if (!section) return;
      parent.postMessage({
        source: 'doc-preview', type: 'toggle-cols',
        slStart: +section.dataset.slStart,
        slEnd: +section.dataset.slEnd,
        on: section.dataset.twocol !== '1',
      }, '*');
    });
  })();
  </script>`;
}

export function buildDocument(markdownSource) {
  const { data } = parseFrontmatter(markdownSource);
  return { html: buildDocumentHtml(markdownSource), data };
}

export default buildDocumentHtml;
