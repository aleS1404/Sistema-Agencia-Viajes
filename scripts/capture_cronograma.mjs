import { pathToFileURL } from 'node:url';
import path from 'node:path';
import puppeteer from '../apps/web/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const browserPath = process.env.BROWSER_PATH;
if (!browserPath) throw new Error('Defina BROWSER_PATH con el ejecutable Chromium');

const root = process.cwd();
const source = path.join(root, 'docs', 'final', 'evidencias', 'cronograma-sprints.html');
const output = path.join(root, 'docs', 'final', 'evidencias', 'cronograma-sprints.png');
const browser = await puppeteer.launch({ executablePath: browserPath, headless: true, args: ['--no-sandbox', '--disable-gpu'] });

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1800, height: 1120, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(source).href, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: output, fullPage: true });
  process.stdout.write(`${output}\n`);
} finally {
  await browser.close();
}
