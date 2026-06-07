const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const statusEl = document.getElementById('status');
const saveStatus = document.getElementById('saveStatus');
const previewBtn = document.getElementById('previewBtn');
const pdfBtn = document.getElementById('pdfBtn');
const newBtn = document.getElementById('newBtn');
const sampleBtn = document.getElementById('sampleBtn');
const fileInput = document.getElementById('fileInput');
const projectList = document.getElementById('projectList');

let projects = [];
let currentId = null;

function setStatus(text) { statusEl.textContent = text || ''; }
function setSave(text) { saveStatus.textContent = text || ''; }

const api = {
  list: () => fetch('/api/projects').then((r) => r.json()),
  get: (id) => fetch(`/api/projects/${id}`).then((r) => r.json()),
  create: (markdown = '') =>
    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown }),
    }).then((r) => r.json()),
  update: (id, markdown) =>
    fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown }),
    }).then((r) => r.json()),
  remove: (id) => fetch(`/api/projects/${id}`, { method: 'DELETE' }),
};

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) +
    ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function renderList() {
  projectList.innerHTML = '';
  if (!projects.length) {
    projectList.innerHTML = '<li class="project-empty">No hay proyectos todavía.</li>';
    return;
  }
  for (const p of projects) {
    const li = document.createElement('li');
    li.className = 'project-item' + (p.id === currentId ? ' is-active' : '');
    li.innerHTML = `
      <button class="project-item__main" type="button">
        <span class="project-item__name"></span>
        <span class="project-item__date">${fmtDate(p.updatedAt)}</span>
      </button>
      <button class="project-item__del" type="button" title="Eliminar">×</button>`;
    li.querySelector('.project-item__name').textContent = p.name || 'Sin título';
    li.querySelector('.project-item__main').addEventListener('click', () => selectProject(p.id));
    li.querySelector('.project-item__del').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteProject(p.id, p.name);
    });
    projectList.appendChild(li);
  }
}

async function refreshList() {
  projects = await api.list();
  renderList();
}

async function selectProject(id) {
  const p = await api.get(id);
  currentId = p.id;
  editor.value = p.markdown || '';
  renderList();
  renderPreview();
  setSave('');
  editor.focus();
}

async function newProject(markdown = '') {
  const p = await api.create(markdown);
  await refreshList();
  await selectProject(p.id);
}

async function deleteProject(id, name) {
  if (!confirm(`¿Eliminar el proyecto “${name || 'Sin título'}”? Esta acción no se puede deshacer.`)) return;
  await api.remove(id);
  if (currentId === id) currentId = null;
  await refreshList();
  if (!currentId && projects.length) await selectProject(projects[0].id);
  else if (!projects.length) { editor.value = ''; renderPreview(); }
}

// ---- Autoguardado ----
let saveTimer = null;
function scheduleSave() {
  if (!currentId) return;
  setSave('Editando…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveCurrent, 800);
}

async function saveCurrent() {
  if (!currentId) return;
  const p = await api.update(currentId, editor.value);
  setSave('Guardado ✓');
  // Actualiza el nombre en el listado sin reordenar bruscamente.
  const item = projects.find((x) => x.id === currentId);
  if (item && item.name !== p.name) {
    item.name = p.name;
    const active = projectList.querySelector('.project-item.is-active .project-item__name');
    if (active) active.textContent = p.name;
  }
}

// ---- Vista previa ----
async function renderPreview() {
  setStatus('Renderizando…');
  // Conserva la posición de scroll para no saltar arriba al re-renderizar.
  let prevScroll = 0;
  try { prevScroll = preview.contentWindow ? preview.contentWindow.scrollY : 0; } catch (_) {}
  try {
    const res = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: editor.value }),
    });
    preview.addEventListener(
      'load',
      () => {
        try {
          preview.contentWindow.scrollTo(0, prevScroll);
          setTimeout(() => { try { preview.contentWindow.scrollTo(0, prevScroll); } catch (_) {} }, 220);
        } catch (_) {}
      },
      { once: true }
    );
    preview.srcdoc = await res.text();
    setStatus('Actualizado');
  } catch (err) {
    setStatus('Error: ' + err.message);
  }
}

// ---- PDF ----
async function downloadPdf() {
  pdfBtn.disabled = true;
  setStatus('Generando PDF…');
  try {
    const res = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: editor.value }),
    });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    const blob = await res.blob();
    const match = (res.headers.get('Content-Disposition') || '').match(/filename="(.+?)"/);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = match ? match[1] : 'documento.pdf';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('PDF descargado');
  } catch (err) {
    setStatus('Error: ' + err.message);
  } finally {
    pdfBtn.disabled = false;
  }
}

// ---- Eventos ----
let previewTimer = null;
editor.addEventListener('input', () => {
  scheduleSave();
  clearTimeout(previewTimer);
  previewTimer = setTimeout(renderPreview, 600);
});

// Ediciones hechas directamente en la vista previa (saltos de línea): vuelcan al Markdown.
window.addEventListener('message', (e) => {
  const d = e.data;
  if (!d || d.source !== 'doc-preview') return;
  if (!currentId) return;

  // Alternar dos columnas en una diapositiva concreta (inserta/quita `:::columns`).
  if (d.type === 'toggle-cols') {
    const lines = editor.value.split('\n');
    const re = /^[ \t]*:::[ \t]*(columns|cols|2col|dos-columnas)[ \t]*$/i;
    const end = Math.min(d.slEnd, lines.length - 1);
    if (d.on) {
      // Inserta el marcador antes de la primera línea con texto de la diapositiva,
      // para no romper la línea en blanco que sigue al separador `---`.
      let idx = d.slStart;
      while (idx <= end && lines[idx].trim() === '') idx++;
      if (idx > end) idx = d.slStart;
      lines.splice(idx, 0, ':::columns', '');
    } else {
      for (let i = d.slStart; i <= end; i++) {
        if (re.test(lines[i])) {
          const removeBlank = lines[i + 1] !== undefined && lines[i + 1].trim() === '' ? 1 : 0;
          lines.splice(i, 1 + removeBlank);
          break;
        }
      }
    }
    editor.value = lines.join('\n');
    saveCurrent();
    renderPreview(); // cambia el layout; el scroll se conserva
    return;
  }

  if (d.type !== 'edit') return;
  const lines = editor.value.split('\n');
  if (d.ls < 0 || d.ls >= lines.length) return;
  const le = Math.min(Math.max(d.ls, d.le), lines.length - 1);
  const oldCount = le - d.ls + 1;
  const newLines = String(d.md).split('\n');
  lines.splice(d.ls, oldCount, ...newLines);
  editor.value = lines.join('\n');
  saveCurrent();

  // Resincroniza los números de línea en la vista previa SIN re-renderizar,
  // para no recargar el iframe ni perder el scroll/foco.
  const delta = newLines.length - oldCount;
  try {
    const doc = preview.contentDocument;
    if (doc) {
      doc.querySelectorAll('[data-ls]').forEach((el) => {
        const els = +el.dataset.ls;
        const ele = +el.dataset.le;
        if (els === d.ls) {
          el.dataset.le = String(d.ls + newLines.length - 1);
        } else if (els > le) {
          el.dataset.ls = String(els + delta);
          el.dataset.le = String(ele + delta);
        }
      });
    }
  } catch (_) {
    /* si falla, el próximo render manual resincroniza */
  }
});

previewBtn.addEventListener('click', renderPreview);
pdfBtn.addEventListener('click', downloadPdf);

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  location.href = '/login';
});
newBtn.addEventListener('click', () => newProject(''));

sampleBtn.addEventListener('click', async () => {
  const md = await fetch('/sample.md').then((r) => r.text());
  newProject(md);
});

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  await newProject(await file.text());
  fileInput.value = '';
});

// ---- Arranque ----
(async function init() {
  await refreshList();
  if (projects.length) {
    await selectProject(projects[0].id);
  } else {
    // Primer arranque: crea un proyecto de ejemplo para no empezar en vacío.
    const md = await fetch('/sample.md').then((r) => r.text());
    await newProject(md);
  }
})();
