// Parser mínimo de frontmatter YAML simple (clave: valor) al inicio del Markdown.
// Soporta cadenas, números y booleanos. Suficiente para los metadatos de portada.
export function parseFrontmatter(source) {
  const text = source ?? '';
  const match = text.match(/^﻿?---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { data: {}, content: text };

  const data = {};
  for (const rawLine of match[1].split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else if (value === 'true' || value === 'false') {
      value = value === 'true';
    } else if (value !== '' && !isNaN(Number(value))) {
      value = Number(value);
    }
    data[key] = value;
  }

  return { data, content: text.slice(match[0].length) };
}

export default parseFrontmatter;
