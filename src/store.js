import { readdir, readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { parseFrontmatter } from './frontmatter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');

async function ensureDir() {
  await mkdir(dataDir, { recursive: true });
}

// Solo permitimos los ids que generamos nosotros (uuid v4) -> evita path traversal.
function fileFor(id) {
  const safe = String(id).replace(/[^a-f0-9-]/gi, '');
  if (!safe) throw new Error('id inválido');
  return join(dataDir, `${safe}.json`);
}

// El nombre del proyecto se deriva del documento: título del frontmatter,
// si no, el primer encabezado, si no, "Sin título".
function deriveName(markdown) {
  const { data, content } = parseFrontmatter(markdown || '');
  if (data.title) return String(data.title).trim();
  const heading = (content || '').match(/^\s*#{1,6}\s+(.+)$/m);
  if (heading) return heading[1].trim();
  return 'Sin título';
}

function nowISO() {
  return new Date().toISOString();
}

async function readProject(id) {
  const raw = await readFile(fileFor(id), 'utf8');
  return JSON.parse(raw);
}

export async function listProjects() {
  await ensureDir();
  const files = (await readdir(dataDir)).filter((f) => f.endsWith('.json'));
  const projects = [];
  for (const file of files) {
    try {
      const p = JSON.parse(await readFile(join(dataDir, file), 'utf8'));
      projects.push({ id: p.id, name: p.name, updatedAt: p.updatedAt, createdAt: p.createdAt });
    } catch {
      /* ignora archivos corruptos */
    }
  }
  // Más recientes primero.
  projects.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  return projects;
}

export async function getProject(id) {
  await ensureDir();
  return readProject(id);
}

export async function createProject({ markdown = '' } = {}) {
  await ensureDir();
  const ts = nowISO();
  const project = {
    id: randomUUID(),
    name: deriveName(markdown),
    markdown,
    createdAt: ts,
    updatedAt: ts,
  };
  await writeFile(fileFor(project.id), JSON.stringify(project, null, 2), 'utf8');
  return project;
}

export async function updateProject(id, { markdown } = {}) {
  const project = await readProject(id);
  if (markdown !== undefined) {
    project.markdown = markdown;
    project.name = deriveName(markdown);
  }
  project.updatedAt = nowISO();
  await writeFile(fileFor(id), JSON.stringify(project, null, 2), 'utf8');
  return project;
}

export async function deleteProject(id) {
  const file = fileFor(id);
  if (existsSync(file)) await unlink(file);
  return { ok: true };
}
