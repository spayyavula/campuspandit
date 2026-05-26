#!/usr/bin/env node
/**
 * Prerenders the public marketing routes after `vite build`.
 *
 * Spins up a tiny static server on dist/, points puppeteer at each route,
 * waits for the React app to mount, and overwrites the static HTML with
 * the rendered DOM. This gives search engines and AI crawlers the actual
 * rendered content instead of the empty <div id="root"></div> shell.
 *
 * Only public, content-rich routes are prerendered. Auth-gated routes
 * (/coach, /crm, /admin, etc.) are skipped — they redirect to /auth
 * for unauthenticated visitors anyway.
 *
 * Run: npm run build:seo
 */

import http from 'node:http';
import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const PORT = 4173;

const ROUTES = [
  '/',
  '/for-students',
  '/blog',
  '/blog/running-a-coaching-center-like-a-saas',
  '/blog/jee-prep-the-honest-version',
  '/materials',
  '/roadmap',
  '/ideas',
  '/apply',
  '/apply/thanks',
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function startServer(shellHtml) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        let filePath = path.join(DIST, urlPath);
        if (!path.resolve(filePath).startsWith(path.resolve(DIST))) {
          res.writeHead(403);
          return res.end('Forbidden');
        }
        let stat;
        try {
          stat = await fs.stat(filePath);
        } catch {
          // SPA fallback — always serve the ORIGINAL shell, not whatever
          // dist/index.html currently contains. Otherwise after the first
          // route prerenders and overwrites dist/index.html, every later
          // route falls back to the previous route's prerendered content
          // and React's hydration race causes the wrong component to win.
          res.writeHead(200, { 'Content-Type': MIME['.html'] });
          return res.end(shellHtml);
        }
        if (stat && stat.isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }
        const data = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      } catch (err) {
        res.writeHead(500);
        res.end(String(err));
      }
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

async function prerenderRoute(browser, route) {
  const page = await browser.newPage();
  try {
    // Block all non-localhost requests. Third-party assets like Plausible
    // analytics and Google Fonts are loaded via <script defer> / <link>;
    // when their CDNs are slow or unreachable they stall DOMContentLoaded
    // (defer scripts MUST load before DCL fires). We only need our own
    // bundle + HTML for prerender — analytics + fonts are runtime concerns.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      try {
        const u = new URL(req.url());
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
          req.continue();
        } else {
          req.abort();
        }
      } catch {
        req.abort();
      }
    });

    const url = `http://localhost:${PORT}${route}`;
    console.log(`  → ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Wait for the React tree to mount — every public route renders an <h1>.
    await page.waitForSelector('h1', { timeout: 10_000 });

    // Wait for react-helmet-async to commit per-route head changes. Helmet
    // writes to <head> in a useEffect after React's first commit, so the h1
    // can be in the DOM before the per-route title/canonical/og are. Every
    // route's <Seo /> emits at least one meta with data-rh="true".
    await page.waitForSelector('[data-rh]', { timeout: 5_000 });

    // Snapshot the fully-rendered HTML.
    const html = await page.content();

    // Persist as <route>/index.html (root keeps dist/index.html).
    const outDir =
      route === '/' ? DIST : path.join(DIST, route.replace(/^\/|\/$/g, ''));
    if (route !== '/') {
      await fs.mkdir(outDir, { recursive: true });
    }
    const outFile = path.join(outDir, 'index.html');
    await fs.writeFile(outFile, html, 'utf8');
    console.log(`    saved ${path.relative(DIST, outFile)}`);
  } finally {
    await page.close();
  }
}

async function main() {
  if (!existsSync(DIST)) {
    console.error(`No dist/ directory at ${DIST}. Run \`npm run build\` first.`);
    process.exit(1);
  }
  // Cache the freshly-built shell BEFORE the first route prerender overwrites
  // dist/index.html — the static server's SPA fallback uses this cached copy
  // so non-root routes never receive a stale prerendered page as their shell.
  const shellHtml = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');
  console.log('Starting static server on port', PORT);
  const server = await startServer(shellHtml);
  console.log('Launching headless browser…');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    console.log(`Prerendering ${ROUTES.length} route(s):`);
    for (const route of ROUTES) {
      await prerenderRoute(browser, route);
    }
    console.log('Done.');
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
}

main().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
