import express from 'express';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildDocument } from './src/template.js';
import { htmlToPdf, closeBrowser } from './src/pdf.js';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from './src/store.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4321;

app.use(express.json({ limit: '5mb' }));

// ===================== LOGIN (contraseña simple) =====================
const PASSWORD = process.env.APP_PASSWORD || 'prueba';
const TOKEN = createHash('sha256').update('doc-pdf:' + PASSWORD).digest('hex');
const COOKIE = 'auth';

function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function isAuthed(req) {
  return getCookie(req, COOKIE) === TOKEN;
}

const LOGIN_HTML = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Acceso · Generador de documentación</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; height:100vh; display:flex; align-items:center; justify-content:center;
    background:#0f1115; color:#e7eaf0;
    font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
  .card { width:320px; padding:32px 28px; background:#171a21; border:1px solid #262b35;
    border-radius:14px; box-shadow:0 12px 48px rgba(0,0,0,.5); }
  .brand { display:flex; align-items:center; gap:10px; font-weight:700; margin-bottom:20px; }
  .dot { width:12px; height:12px; border-radius:50%; background:#f70154; box-shadow:0 0 12px #f70154; }
  label { display:block; font-size:13px; color:#8a93a3; margin-bottom:8px; }
  input { width:100%; padding:11px 12px; border-radius:8px; border:1px solid #262b35;
    background:#12151b; color:#e7eaf0; font-size:15px; outline:none; }
  input:focus { border-color:#f70154; }
  button { width:100%; margin-top:14px; padding:11px; border:none; border-radius:8px;
    background:#f70154; color:#fff; font-size:15px; font-weight:600; cursor:pointer; }
  button:hover { background:#cc0145; }
  .err { color:#ff6b8a; font-size:13px; min-height:18px; margin-top:10px; }
</style></head>
<body>
  <form class="card" id="f">
    <div class="brand"><span class="dot"></span> Generador de documentación</div>
    <label for="p">Contraseña</label>
    <input id="p" type="password" autofocus autocomplete="current-password" />
    <button type="submit">Entrar</button>
    <div class="err" id="e"></div>
  </form>
  <script>
    const f=document.getElementById('f'), e=document.getElementById('e');
    f.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      e.textContent='';
      const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({password:document.getElementById('p').value})});
      if(r.ok){ location.href='/'; }
      else { e.textContent='Contraseña incorrecta'; document.getElementById('p').select(); }
    });
  </script>
</body></html>`;

app.get('/login', (req, res) => {
  if (isAuthed(req)) return res.redirect('/');
  res.type('html').send(LOGIN_HTML);
});

app.post('/api/login', (req, res) => {
  if ((req.body.password || '') === PASSWORD) {
    const maxAge = 60 * 60 * 24 * 30; // 30 días
    res.setHeader('Set-Cookie', `${COOKIE}=${TOKEN}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`);
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Contraseña incorrecta' });
});

app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  res.json({ ok: true });
});

// Puerta: todo lo demás requiere estar autenticado.
app.use((req, res, next) => {
  if (isAuthed(req)) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'No autorizado' });
  return res.redirect('/login');
});

app.use(express.static(join(__dirname, 'public')));

// ---- Proyectos (CRUD) ----
app.get('/api/projects', async (req, res) => {
  try {
    res.json(await listProjects());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    res.json(await getProject(req.params.id));
  } catch (err) {
    res.status(404).json({ error: 'No encontrado' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    res.status(201).json(await createProject({ markdown: req.body.markdown }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    res.json(await updateProject(req.params.id, { markdown: req.body.markdown }));
  } catch (err) {
    res.status(404).json({ error: 'No encontrado' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    res.json(await deleteProject(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Vista previa: Markdown -> HTML (se carga en un iframe del navegador).
app.post('/api/preview', (req, res) => {
  try {
    const { markdown = '' } = req.body;
    const { html } = buildDocument(markdown);
    res.type('html').send(html);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Generación de PDF: Markdown -> PDF (descarga).
app.post('/api/pdf', async (req, res) => {
  try {
    const { markdown = '', filename } = req.body;
    const { html, data } = buildDocument(markdown);
    const pdf = await htmlToPdf(html, data);

    const safeName = (filename || data.title || 'documento')
      .toString()
      .replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]/g, '')
      .trim()
      .replace(/\s+/g, '-') || 'documento';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
    // res.end (no res.send) para enviar el Buffer como binario, sin negociación de contenido.
    res.end(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Arranca en PORT; si está ocupado, prueba los siguientes puertos automáticamente.
const MAX_TRIES = 15;
let activeServer = null;

function listen(port, attempt = 0) {
  const server = app.listen(port, () => {
    activeServer = server;
    if (port !== Number(PORT)) {
      console.log(`\n  (El puerto ${PORT} estaba ocupado, uso el ${port})`);
    }
    console.log(`\n  Generador de documentación en  http://localhost:${port}\n`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < MAX_TRIES) {
      listen(port + 1, attempt + 1);
    } else {
      console.error(err.message);
      process.exit(1);
    }
  });
}

listen(Number(PORT));

// Cierre limpio del navegador.
async function shutdown() {
  await closeBrowser();
  if (activeServer) activeServer.close(() => process.exit(0));
  else process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
