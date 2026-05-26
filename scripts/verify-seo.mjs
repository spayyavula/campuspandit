#!/usr/bin/env node
/**
 * Parses prerendered HTML in dist/ and asserts on title, canonical, and JSON-LD
 * presence for each public route. Run after `npm run build:seo`.
 *
 * Exits non-zero on the first assertion failure. Prints a summary of all checks.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const SITE = 'https://www.campuspandit.ai';

/** Per-route expectations. titleIncludes is a substring; canonical is exact. */
const ROUTES = [
  { path: '/', file: 'index.html', titleIncludes: 'White-Label Coaching Platform', canonical: `${SITE}/`, jsonLdMin: 4 },
  { path: '/for-students', file: 'for-students/index.html', titleIncludes: 'Is Your JEE/NEET Coaching Center', canonical: `${SITE}/for-students`, jsonLdMin: 5 },
  { path: '/blog', file: 'blog/index.html', titleIncludes: 'CampusPandit Blog', canonical: `${SITE}/blog`, jsonLdMin: 4 },
  { path: '/blog/running-a-coaching-center-like-a-saas', file: 'blog/running-a-coaching-center-like-a-saas/index.html', titleIncludes: 'CampusPandit Blog', canonical: `${SITE}/blog/running-a-coaching-center-like-a-saas`, jsonLdMin: 6, requiresArticle: true, requiresBreadcrumb: true },
  { path: '/blog/jee-prep-the-honest-version', file: 'blog/jee-prep-the-honest-version/index.html', titleIncludes: 'CampusPandit Blog', canonical: `${SITE}/blog/jee-prep-the-honest-version`, jsonLdMin: 6, requiresArticle: true, requiresBreadcrumb: true },
  { path: '/materials', file: 'materials/index.html', titleIncludes: 'JEE & NEET Preparation Materials', canonical: `${SITE}/materials`, jsonLdMin: 4 },
  { path: '/roadmap', file: 'roadmap/index.html', titleIncludes: 'Product Roadmap', canonical: `${SITE}/roadmap`, jsonLdMin: 4 },
  { path: '/ideas', file: 'ideas/index.html', titleIncludes: 'Feature Requests & Ideas', canonical: `${SITE}/ideas`, jsonLdMin: 4 },
  { path: '/apply', file: 'apply/index.html', titleIncludes: 'Apply for the Founding 10', canonical: `${SITE}/apply`, jsonLdMin: 4 },
  { path: '/apply/thanks', file: 'apply/thanks/index.html', titleIncludes: 'Application Received', canonical: `${SITE}/apply/thanks`, jsonLdMin: 4, requiresNoindex: true },
];

const SITEMAP_FILE = 'sitemap.xml';
const SITEMAP_EXPECTED_URLS = ROUTES.map(r => SITE + r.path);
const SITEMAP_FORBIDDEN_URLS = [
  `${SITE}/tutors`,
  `${SITE}/courses`,
  `${SITE}/tutor/register`,
  `${SITE}/auth`,
];

const failures = [];

function fail(route, msg) {
  failures.push(`  ✗ ${route}: ${msg}`);
}

function pass(route, msg) {
  console.log(`  ✓ ${route}: ${msg}`);
}

async function readDist(rel) {
  return fs.readFile(path.join(DIST, rel), 'utf8');
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : null;
}

function extractCanonical(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  return m ? m[1].trim() : null;
}

function countJsonLd(html) {
  const matches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>/gi);
  return matches ? matches.length : 0;
}

function hasJsonLdOfType(html, type) {
  // crude but adequate: look for "@type": "<type>" in any <script application/ld+json> block
  const blocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  return blocks.some(b => new RegExp(`"@type"\\s*:\\s*"${type}"`).test(b));
}

function hasNoindex(html) {
  return /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex[^"']*["']/i.test(html);
}

async function verifyRoute(route) {
  let html;
  try {
    html = await readDist(route.file);
  } catch {
    fail(route.path, `dist/${route.file} not found`);
    return;
  }

  const title = extractTitle(html);
  if (!title) fail(route.path, 'no <title> tag');
  else if (!title.includes(route.titleIncludes)) fail(route.path, `title "${title}" missing substring "${route.titleIncludes}"`);
  else pass(route.path, `title OK`);

  const canonical = extractCanonical(html);
  if (canonical !== route.canonical) fail(route.path, `canonical "${canonical}" !== "${route.canonical}"`);
  else pass(route.path, `canonical OK`);

  const jsonLdCount = countJsonLd(html);
  if (jsonLdCount < route.jsonLdMin) fail(route.path, `expected at least ${route.jsonLdMin} JSON-LD blocks, found ${jsonLdCount}`);
  else pass(route.path, `JSON-LD count OK (${jsonLdCount})`);

  if (route.requiresArticle && !hasJsonLdOfType(html, 'Article')) {
    fail(route.path, 'missing Article JSON-LD');
  } else if (route.requiresArticle) {
    pass(route.path, 'Article JSON-LD present');
  }

  if (route.requiresBreadcrumb && !hasJsonLdOfType(html, 'BreadcrumbList')) {
    fail(route.path, 'missing BreadcrumbList JSON-LD');
  } else if (route.requiresBreadcrumb) {
    pass(route.path, 'BreadcrumbList JSON-LD present');
  }

  if (route.requiresNoindex && !hasNoindex(html)) {
    fail(route.path, 'missing noindex robots meta');
  } else if (route.requiresNoindex) {
    pass(route.path, 'noindex robots meta present');
  }
}

async function verifySitemap() {
  let xml;
  try {
    xml = await readDist(SITEMAP_FILE);
  } catch {
    fail('sitemap', `dist/${SITEMAP_FILE} not found`);
    return;
  }
  for (const url of SITEMAP_EXPECTED_URLS) {
    if (!xml.includes(`<loc>${url}</loc>`)) fail('sitemap', `missing <loc>${url}</loc>`);
  }
  for (const url of SITEMAP_FORBIDDEN_URLS) {
    if (xml.includes(`<loc>${url}</loc>`)) fail('sitemap', `still contains forbidden <loc>${url}</loc>`);
  }
  if (failures.filter(f => f.includes('sitemap')).length === 0) pass('sitemap', `${SITEMAP_EXPECTED_URLS.length} URLs OK, no forbidden URLs`);
}

async function main() {
  console.log('Verifying prerendered SEO/GEO output in dist/');
  for (const route of ROUTES) {
    await verifyRoute(route);
  }
  await verifySitemap();
  if (failures.length === 0) {
    console.log('\nAll checks passed.');
    process.exit(0);
  }
  console.log('\nFailures:');
  for (const f of failures) console.log(f);
  process.exit(1);
}

main().catch(err => {
  console.error('verify-seo failed:', err);
  process.exit(2);
});
