// Renders og.png (1200x630) and logo-512.png from tools/*.html with Playwright.
// Run when the branding changes: PLAYWRIGHT=<path to playwright module> node tools/render-images.mjs
// then compress (see README).
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const jobs = [
  { src: 'tools/og-hub.html', out: 'og.png', width: 1200, height: 630 },
  { src: 'tools/logo.html', out: 'logo-512.png', width: 512, height: 512 },
];
const browser = await chromium.launch();
for (const j of jobs) {
  const page = await browser.newPage({ viewport: { width: j.width, height: j.height } });
  await page.goto(pathToFileURL(join(root, j.src)).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(root, j.out) });
  await page.close();
}
await browser.close();
