#!/usr/bin/env node
/**
 * Generates the 1200×630 OG image at public/og-image.png using puppeteer.
 *
 * Run: node scripts/generate-og-image.js
 *
 * The image is referenced by index.html as https://campuspandit.com/og-image.png
 * and is what Twitter, Facebook, LinkedIn, WhatsApp, etc. show as the link preview.
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'og-image.png');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }
  body { width: 1200px; height: 630px; overflow: hidden; }
  .card {
    width: 1200px; height: 630px;
    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 60%, #0f172a 100%);
    color: white;
    padding: 80px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
  }
  .card::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 90% 10%, rgba(255,255,255,0.12), transparent 40%),
      radial-gradient(circle at 10% 100%, rgba(16,185,129,0.18), transparent 50%);
    pointer-events: none;
  }
  .brand { display: flex; align-items: center; gap: 18px; position: relative; z-index: 1; }
  .logo {
    width: 56px; height: 56px;
    background: white;
    border-radius: 14px;
    display: grid; place-items: center;
    color: #1e40af; font-weight: 800; font-size: 28px;
  }
  .brand-name { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
  h1 {
    font-size: 88px; line-height: 1.05; font-weight: 800; letter-spacing: -0.03em;
    position: relative; z-index: 1; max-width: 940px;
  }
  .accent { color: #34d399; }
  .footer {
    display: flex; align-items: center; gap: 24px;
    position: relative; z-index: 1;
    font-size: 22px; opacity: 0.95;
  }
  .chip {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 10px 20px;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 999px;
    font-weight: 600;
    backdrop-filter: blur(6px);
  }
  .dot { width: 8px; height: 8px; background: #34d399; border-radius: 50%; }
</style>
</head>
<body>
  <div class="card">
    <div class="brand">
      <div class="logo">CP</div>
      <div class="brand-name">CampusPandit</div>
    </div>
    <h1>Run your coaching center<br/>like the <span class="accent">big chains.</span><br/>Without becoming one.</h1>
    <div class="footer">
      <div class="chip"><span class="dot"></span> Branded student app</div>
      <div class="chip"><span class="dot"></span> AI tutor per student</div>
      <div class="chip"><span class="dot"></span> Center dashboard</div>
    </div>
  </div>
</body>
</html>`;

async function main() {
  console.log('Launching headless browser…');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: OUT_PATH, type: 'png', omitBackground: false });
    console.log(`Wrote ${OUT_PATH}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Failed to generate og-image:', err);
  process.exit(1);
});
