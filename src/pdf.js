import puppeteer from 'puppeteer';

let browserPromise = null;

// Reutiliza una sola instancia de Chromium entre peticiones (más rápido).
function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserPromise;
}

export async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}

function footerTemplate(data) {
  const brand = data?.brand || data?.client || '';
  return `
    <div style="width:100%; font-size:8px; color:#8a93a3; font-family:Inter,Arial,sans-serif;
                padding:0 16mm; display:flex; justify-content:space-between; align-items:center;">
      <span>${brand ? brand.replace(/[<>&]/g, '') : ''}</span>
      <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
    </div>`;
}

// Convierte HTML completo -> Buffer PDF.
export async function htmlToPdf(html, data = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    // Diapositivas 16:9 apaisadas, a sangre (sin márgenes ni cabecera/pie).
    const pdf = await page.pdf({
      width: '1280px',
      height: '720px',
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    // Puppeteer devuelve un Uint8Array; lo normalizamos a Buffer para enviarlo como binario.
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export default htmlToPdf;
