import puppeteer from '../apps/web/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const browserPath = process.env.BROWSER_PATH;
if (!browserPath) throw new Error('Defina BROWSER_PATH con el ejecutable Chromium');

const browser = await puppeteer.launch({
  executablePath: browserPath,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

async function loginAndCapture(email, route, output) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('input[name="email"]', { timeout: 15000 });
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', 'Demo1234!');
  await Promise.all([
    page.waitForSelector('.app-shell', { timeout: 15000 }),
    page.click('form button[type="submit"], form button'),
  ]);
  await page.goto(`http://127.0.0.1:5173${route}`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: output, fullPage: true });
  await page.close();
}

try {
  await loginAndCapture(
    'admin@andesgo.demo',
    '/admin/reportes',
    'docs/final/evidencias/panel-administrador.png',
  );
  await loginAndCapture(
    'cliente@andesgo.demo',
    '/catalogo',
    'docs/final/evidencias/catalogo-cliente.png',
  );
  process.stdout.write('Capturas autenticadas creadas.\n');
} finally {
  await browser.close();
}
