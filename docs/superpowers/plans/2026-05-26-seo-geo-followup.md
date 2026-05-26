# SEO/GEO Follow-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the sitemap-vs-robots.txt contradiction, give every public route its own `<head>` (title / description / canonical / OG) via `react-helmet-async`, and emit Article + BreadcrumbList JSON-LD on blog posts so each prerendered HTML carries route-specific SEO + GEO signals.

**Architecture:** Add `react-helmet-async` as the per-route `<head>` engine, hoisted via `<HelmetProvider>` in `main.tsx`. Introduce one reusable `<Seo />` component in `src/components/Seo.tsx`; every public route drops one at the top of its render. Verification uses a Node script that parses the prerendered HTML produced by `npm run build:seo` — that artifact is what search engines see, so asserting against it is more meaningful than jsdom unit tests.

**Tech Stack:** React 18 + Vite 5 + react-router-dom 6 (already in place); `react-helmet-async` (new, ~5 kB gz); Puppeteer prerender (`scripts/prerender.js`, already in place); plain Node script for verification (no test framework needed — none is installed and the spec did not call for one).

**Spec:** [`docs/superpowers/specs/2026-05-26-seo-geo-followup-design.md`](../specs/2026-05-26-seo-geo-followup-design.md)

**Branch target:** Per the spec, this should land on `main`. The current branch is `aws-platform`. Before starting, the executor should confirm which branch the user wants the commits on; the plan does not switch branches on its own.

---

## File Structure

**New files:**
- `src/components/Seo.tsx` — single reusable component, props `{ title, description, canonical, ogImage?, ogType?, noindex?, jsonLd? }`. Owns all per-route head emission.
- `scripts/verify-seo.mjs` — Node script that parses `dist/**/index.html` and asserts on title / canonical / JSON-LD presence. Reused as the verification step in every task that touches prerender output.

**Modified files:**
- `package.json` — add `react-helmet-async` to `dependencies`; add `verify:seo` script.
- `src/main.tsx` — wrap `<App />` in `<HelmetProvider>`.
- `src/components/LandingPage.tsx` — add `<Seo />` with B2B copy.
- `src/components/LandingPageStudent.tsx` — add `<Seo />` with student copy + BreadcrumbList JSON-LD.
- `src/components/Blog.tsx` — add `<Seo />` for blog index.
- `src/components/BlogPost.tsx` — add `<Seo />` with Article + BreadcrumbList JSON-LD.
- `src/components/PreparationMaterials.tsx` — add `<Seo />`.
- `src/components/Roadmap.tsx` — add `<Seo />`.
- `src/components/Ideas.tsx` — add `<Seo />`.
- `src/components/PilotApplication.tsx` — add `<Seo />`.
- `src/components/PilotApplicationThanks.tsx` — add `<Seo />` with `noindex`.
- `index.html` — insert commented Search Console + Bing Webmaster verification meta block just below `<meta name="robots">`.
- `public/sitemap.xml` — full rewrite to the 10 actually-public routes.

---

## Task 1: Add `react-helmet-async` and wrap `<App>` in `<HelmetProvider>`

**Why this task first:** Everything else depends on Helmet being available. Doing it alone first means a build failure here is isolated.

**Files:**
- Modify: `package.json` (add dep, add script)
- Modify: `src/main.tsx` (wrap in provider)

- [ ] **Step 1.1: Install `react-helmet-async`**

Run from repo root:

```bash
npm install react-helmet-async@2.0.5
```

Expected: `package.json` gains `"react-helmet-async": "^2.0.5"` under `dependencies`; `package-lock.json` updates. Exit code 0.

- [ ] **Step 1.2: Add `verify:seo` script to `package.json`**

In `package.json`, in the `"scripts"` block, add a new line right after the `"prerender"` line:

```json
"verify:seo": "node scripts/verify-seo.mjs",
```

So the relevant block reads:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "build:seo": "vite build && node scripts/prerender.js",
  "prerender": "node scripts/prerender.js",
  "verify:seo": "node scripts/verify-seo.mjs",
  "og:generate": "node scripts/generate-og-image.js",
  ...
}
```

- [ ] **Step 1.3: Wrap `<App />` in `<HelmetProvider>` in `src/main.tsx`**

Replace the entire contents of `src/main.tsx` with:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
```

- [ ] **Step 1.4: Run the build to confirm nothing breaks**

```bash
npm run build
```

Expected: build succeeds, no TypeScript errors, no React Strict Mode warnings about Helmet. Exit code 0. `dist/index.html` exists. The site still has the same head as before — no Helmet output yet because no component uses it.

- [ ] **Step 1.5: Commit**

```bash
git add package.json package-lock.json src/main.tsx
git commit -m "feat(seo): add react-helmet-async + HelmetProvider"
```

---

## Task 2: Create the SEO verification script

**Why this task before any HTML changes:** The script lets every later task check its own output. Writing it first means we can red-green each subsequent task.

**Files:**
- Create: `scripts/verify-seo.mjs`

- [ ] **Step 2.1: Create `scripts/verify-seo.mjs`**

Create the file with this exact content:

```javascript
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
```

- [ ] **Step 2.2: Run it to confirm it fails as expected (red)**

```bash
npm run build:seo
npm run verify:seo
```

Expected: `verify:seo` exits non-zero. Failures include `title "CampusPandit — White-Label..." missing substring "Is Your JEE/NEET..."` for `/for-students`, missing Article JSON-LD on blog posts, missing canonical for routes that don't have route-specific ones yet, sitemap missing the 10 expected URLs and still containing the forbidden ones. This is the baseline — it must fail here, because nothing has been implemented yet.

- [ ] **Step 2.3: Commit**

```bash
git add scripts/verify-seo.mjs
git commit -m "test(seo): add prerender output verification script"
```

---

## Task 3: Create the `<Seo />` component and wire it into `/` only (de-risk gate)

**Why scope to `/` first:** If Helmet doesn't show up in prerender output the way we expect, we want to know after touching 2 files, not 10. This single-route smoke is the explicit gate before fanning out.

**Files:**
- Create: `src/components/Seo.tsx`
- Modify: `src/components/LandingPage.tsx` (add `<Seo />` as first child of root element)

- [ ] **Step 3.1: Create `src/components/Seo.tsx`**

Create the file with this exact content:

```tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoProps {
  /** Full <title> text. Library does not append site name. */
  title: string;
  description: string;
  /** Absolute URL — used for canonical, og:url. */
  canonical: string;
  /** Defaults to /og-image.png (1200x630). */
  ogImage?: string;
  ogType?: 'website' | 'article';
  /** When true, emits <meta name="robots" content="noindex,follow"> (e.g. /apply/thanks). */
  noindex?: boolean;
  /** Additional JSON-LD blocks. Each becomes one <script type="application/ld+json">. */
  jsonLd?: object | object[];
}

const Seo: React.FC<SeoProps> = ({
  title,
  description,
  canonical,
  ogImage = 'https://www.campuspandit.ai/og-image.png',
  ogType = 'website',
  noindex = false,
  jsonLd,
}) => {
  const jsonLdBlocks = jsonLd
    ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd])
    : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {noindex && <meta name="robots" content="noindex,follow" />}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLdBlocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
};

export default Seo;
```

- [ ] **Step 3.2: Add `<Seo />` to `LandingPage.tsx`**

In `src/components/LandingPage.tsx`:

1. Add this import at the top (alongside other component imports):

```tsx
import Seo from './Seo';
```

2. Inside the component's returned JSX, as the **first child** of the outermost wrapping element (typically a `<div className="min-h-screen ...">` or fragment), insert:

```tsx
<Seo
  title="CampusPandit — White-Label Coaching Platform for JEE & NEET Centers | AI Tutor + Branded App"
  description="Run your coaching center like the big chains. CampusPandit gives small & mid-sized JEE/NEET centers a branded student app, an AI tutor for every learner, and one dashboard for the whole operation. Founder pilot — apply for one of ten 2026 slots."
  canonical="https://www.campuspandit.ai/"
/>
```

If the component returns a React fragment (`<>...</>`), put `<Seo />` as the first child of that fragment.

- [ ] **Step 3.3: Build and verify just the root route**

```bash
npm run build:seo
```

Expected: build succeeds, prerender runs all 10 routes, `dist/index.html` exists.

Then inspect the prerendered root manually:

```bash
node -e "const fs=require('fs');const h=fs.readFileSync('dist/index.html','utf8');console.log('title:',h.match(/<title[^>]*>([^<]*)<\/title>/)[1]);console.log('canonical:',(h.match(/<link[^>]+rel=\"canonical\"[^>]+href=\"([^\"]+)\"/)||[])[1]);"
```

Expected output:

```
title: CampusPandit — White-Label Coaching Platform for JEE & NEET Centers | AI Tutor + Branded App
canonical: https://www.campuspandit.ai/
```

This confirms Helmet → Puppeteer → static HTML pipeline works end-to-end. If the title still reads as whatever was in `index.html` originally, prerender is snapshotting before Helmet mounts — stop and debug before Task 4.

- [ ] **Step 3.4: Commit**

```bash
git add src/components/Seo.tsx src/components/LandingPage.tsx
git commit -m "feat(seo): add Seo component, wire into LandingPage"
```

---

## Task 4: Wire `<Seo />` into the remaining 8 public routes

**Pattern for every route in this task:**
1. Add `import Seo from './Seo';` at the top of the file.
2. Insert `<Seo ... />` as the first child of the root JSX element.
3. Keep the existing component logic untouched.

**Files (all modify):**
- `src/components/LandingPageStudent.tsx`
- `src/components/Blog.tsx`
- `src/components/BlogPost.tsx`
- `src/components/PreparationMaterials.tsx`
- `src/components/Roadmap.tsx`
- `src/components/Ideas.tsx`
- `src/components/PilotApplication.tsx`
- `src/components/PilotApplicationThanks.tsx`

- [ ] **Step 4.1: Add `<Seo />` to `LandingPageStudent.tsx`**

Add the import, then inside the root `<div className="min-h-screen bg-white">` (already at line 9), insert as first child:

```tsx
<Seo
  title="Is Your JEE/NEET Coaching Center Using the Right Tech? — CampusPandit"
  description="Students: if your coaching center still runs on WhatsApp, paper attendance, and Saturday tests, here's what they could be running instead. Tell them about CampusPandit — branded app, AI Coach, parent dashboard."
  canonical="https://www.campuspandit.ai/for-students"
/>
```

- [ ] **Step 4.2: Add `<Seo />` to `Blog.tsx`**

Inside the root `<div className="min-h-screen bg-white">` (line 12), insert as first child:

```tsx
<Seo
  title="CampusPandit Blog — Coaching Centers, JEE/NEET, and Building Edtech in India"
  description="Honest writing on running a coaching center, JEE/NEET prep, and the edtech stack behind CampusPandit."
  canonical="https://www.campuspandit.ai/blog"
/>
```

- [ ] **Step 4.3: Add `<Seo />` to `BlogPost.tsx` (basic — schema added in Task 5)**

In `BlogPost.tsx`, after the `if (!post) return ...` guard, before the `return (...)`, the post is available. Add the import, then inside the root `<div className="min-h-screen bg-white">` (line 13) insert as first child:

```tsx
<Seo
  title={`${post.title} — CampusPandit Blog`}
  description={post.seoDescription}
  canonical={`https://www.campuspandit.ai/blog/${post.slug}`}
  ogType="article"
/>
```

(Article + BreadcrumbList JSON-LD comes in Task 5; this task just gets a per-post title and canonical in.)

- [ ] **Step 4.4: Add `<Seo />` to `PreparationMaterials.tsx`**

Insert as first child of the component's root element:

```tsx
<Seo
  title="JEE & NEET Preparation Materials — Free PYQ-Indexed Resources | CampusPandit"
  description="Free preparation materials for JEE Main, JEE Advanced, and NEET UG aspirants — chapter notes, PYQ-weighted topic lists, and mock paper templates."
  canonical="https://www.campuspandit.ai/materials"
/>
```

- [ ] **Step 4.5: Add `<Seo />` to `Roadmap.tsx`**

Insert as first child of the component's root element:

```tsx
<Seo
  title="Product Roadmap — CampusPandit"
  description="What we're shipping next on CampusPandit and what's queued behind it. Built in public for the Founding 10 cohort."
  canonical="https://www.campuspandit.ai/roadmap"
/>
```

- [ ] **Step 4.6: Add `<Seo />` to `Ideas.tsx`**

Insert as first child of the component's root element:

```tsx
<Seo
  title="Feature Requests & Ideas — CampusPandit"
  description="Vote on feature requests for the CampusPandit coaching center platform, or submit your own. Roadmap drivers come from here."
  canonical="https://www.campuspandit.ai/ideas"
/>
```

- [ ] **Step 4.7: Add `<Seo />` to `PilotApplication.tsx`**

Insert as first child of the component's root element:

```tsx
<Seo
  title="Apply for the Founding 10 — CampusPandit Pilot Cohort"
  description="Apply for one of ten 2026 founder slots. Free for the first three months, up to 100 students, founder pricing locked in for life. Branded app live in 7 days."
  canonical="https://www.campuspandit.ai/apply"
/>
```

- [ ] **Step 4.8: Add `<Seo />` to `PilotApplicationThanks.tsx` with `noindex`**

Insert as first child of the component's root element:

```tsx
<Seo
  title="Application Received — CampusPandit"
  description="Your founder pilot application is in. We'll reply within 2 business days with next steps."
  canonical="https://www.campuspandit.ai/apply/thanks"
  noindex
/>
```

- [ ] **Step 4.9: Rebuild and run verification**

```bash
npm run build:seo
npm run verify:seo
```

Expected: most title and canonical checks now pass. Failures remaining: missing Article and BreadcrumbList on blog posts (Task 5), sitemap still has wrong URLs (Task 6). The 8 added routes should report ✓ on title, canonical, and base JSON-LD count.

- [ ] **Step 4.10: Commit**

```bash
git add src/components/LandingPageStudent.tsx src/components/Blog.tsx src/components/BlogPost.tsx src/components/PreparationMaterials.tsx src/components/Roadmap.tsx src/components/Ideas.tsx src/components/PilotApplication.tsx src/components/PilotApplicationThanks.tsx
git commit -m "feat(seo): per-route head via Seo component on 8 public routes"
```

---

## Task 5: Article + BreadcrumbList JSON-LD on blog posts and `/for-students`

**Files:**
- Modify: `src/components/BlogPost.tsx` (replace the `<Seo />` from Task 4.3 with one that includes Article + BreadcrumbList)
- Modify: `src/components/LandingPageStudent.tsx` (replace the `<Seo />` from Task 4.1 with one that includes BreadcrumbList)

- [ ] **Step 5.1: Replace `<Seo />` block in `BlogPost.tsx` with the version that builds JSON-LD**

Find the `<Seo ... />` block added in Task 4.3 and replace it with this. Insert these `const` declarations just above the `return (...)` so the JSON-LD objects are built once per render:

```tsx
const article = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  description: post.seoDescription,
  datePublished: post.date,
  dateModified: post.date,
  author: {
    '@type': 'Organization',
    name: 'CampusPandit',
    url: 'https://www.campuspandit.ai',
  },
  publisher: {
    '@type': 'Organization',
    name: 'CampusPandit',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.campuspandit.ai/icons/icon-512x512.png',
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `https://www.campuspandit.ai/blog/${post.slug}`,
  },
};

const breadcrumbs = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.campuspandit.ai/' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.campuspandit.ai/blog' },
    { '@type': 'ListItem', position: 3, name: post.title, item: `https://www.campuspandit.ai/blog/${post.slug}` },
  ],
};
```

Then the `<Seo />` becomes:

```tsx
<Seo
  title={`${post.title} — CampusPandit Blog`}
  description={post.seoDescription}
  canonical={`https://www.campuspandit.ai/blog/${post.slug}`}
  ogType="article"
  jsonLd={[article, breadcrumbs]}
/>
```

- [ ] **Step 5.2: Add BreadcrumbList to `LandingPageStudent.tsx`**

Find the `<Seo ... />` from Task 4.1. Just above the component's `return (...)`, add this constant:

```tsx
const studentBreadcrumbs = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.campuspandit.ai/' },
    { '@type': 'ListItem', position: 2, name: 'For Students', item: 'https://www.campuspandit.ai/for-students' },
  ],
};
```

Then update the `<Seo />` block to include it:

```tsx
<Seo
  title="Is Your JEE/NEET Coaching Center Using the Right Tech? — CampusPandit"
  description="Students: if your coaching center still runs on WhatsApp, paper attendance, and Saturday tests, here's what they could be running instead. Tell them about CampusPandit — branded app, AI Coach, parent dashboard."
  canonical="https://www.campuspandit.ai/for-students"
  jsonLd={studentBreadcrumbs}
/>
```

- [ ] **Step 5.3: Rebuild and verify**

```bash
npm run build:seo
npm run verify:seo
```

Expected: the two blog post routes now pass `Article JSON-LD present` and `BreadcrumbList JSON-LD present`. The remaining failure is sitemap — addressed in Task 6.

- [ ] **Step 5.4: Commit**

```bash
git add src/components/BlogPost.tsx src/components/LandingPageStudent.tsx
git commit -m "feat(seo): Article + BreadcrumbList JSON-LD on blog posts and /for-students"
```

---

## Task 6: Rewrite `public/sitemap.xml`

**Files:**
- Modify: `public/sitemap.xml` (full rewrite)

- [ ] **Step 6.1: Replace `public/sitemap.xml` contents**

Replace the entire file with:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://www.campuspandit.ai/</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en-IN" href="https://www.campuspandit.ai/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://www.campuspandit.ai/" />
  </url>
  <url>
    <loc>https://www.campuspandit.ai/for-students</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en-IN" href="https://www.campuspandit.ai/for-students" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://www.campuspandit.ai/for-students" />
  </url>
  <url>
    <loc>https://www.campuspandit.ai/apply</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.campuspandit.ai/blog/running-a-coaching-center-like-a-saas</loc>
    <lastmod>2026-05-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.campuspandit.ai/blog/jee-prep-the-honest-version</loc>
    <lastmod>2026-05-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.campuspandit.ai/blog</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.campuspandit.ai/materials</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.campuspandit.ai/roadmap</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.campuspandit.ai/ideas</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.campuspandit.ai/apply/thanks</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

- [ ] **Step 6.2: Rebuild and verify**

```bash
npm run build:seo
npm run verify:seo
```

Expected: all checks pass, including `sitemap: 10 URLs OK, no forbidden URLs`. Exit code 0.

If `verify:seo` still fails on anything, stop and fix the failing slice before continuing. The verification script is the contract.

- [ ] **Step 6.3: Commit**

```bash
git add public/sitemap.xml
git commit -m "fix(seo): rewrite sitemap to match actual public routes"
```

---

## Task 7: Add verification meta stubs to `index.html`

**Files:**
- Modify: `index.html` (insert commented block just below `<meta name="robots">` at line 14)

- [ ] **Step 7.1: Insert verification meta block in `index.html`**

Find the `<meta name="robots" ...>` line in `index.html` (currently line 14). Immediately after that line, insert these 4 lines (preserve existing indentation — 4 spaces):

```html
    <!-- Search engine verification — paste tokens from Search Console (https://search.google.com/search-console) and Bing Webmaster (https://www.bing.com/webmasters) then uncomment -->
    <!-- <meta name="google-site-verification" content="PASTE_HERE" /> -->
    <!-- <meta name="msvalidate.01" content="PASTE_HERE" /> -->
```

- [ ] **Step 7.2: Final rebuild + verify**

```bash
npm run build:seo
npm run verify:seo
```

Expected: all checks still pass.

- [ ] **Step 7.3: Spot-check three prerendered files manually**

```bash
node -e "['for-students/index.html','blog/jee-prep-the-honest-version/index.html','apply/thanks/index.html'].forEach(f=>{const h=require('fs').readFileSync('dist/'+f,'utf8');console.log('===',f,'===');console.log('  title:',(h.match(/<title[^>]*>([^<]*)<\/title>/)||[])[1]);console.log('  canonical:',(h.match(/<link[^>]+rel=\"canonical\"[^>]+href=\"([^\"]+)\"/)||[])[1]);console.log('  jsonLd blocks:',(h.match(/<script[^>]+type=\"application\/ld\\+json\"[^>]*>/g)||[]).length);console.log('  noindex:',/noindex/.test(h));});"
```

Expected output (line breaks added for readability):

```
=== for-students/index.html ===
  title: Is Your JEE/NEET Coaching Center Using the Right Tech? — CampusPandit
  canonical: https://www.campuspandit.ai/for-students
  jsonLd blocks: 5
  noindex: false
=== blog/jee-prep-the-honest-version/index.html ===
  title: JEE prep: the honest version — CampusPandit Blog
  (or whatever the post's title resolves to)
  canonical: https://www.campuspandit.ai/blog/jee-prep-the-honest-version
  jsonLd blocks: 6
  noindex: false
=== apply/thanks/index.html ===
  title: Application Received — CampusPandit
  canonical: https://www.campuspandit.ai/apply/thanks
  jsonLd blocks: 4
  noindex: true
```

- [ ] **Step 7.4: Final commit**

```bash
git add index.html
git commit -m "feat(seo): add Search Console + Bing Webmaster verification slots"
```

---

## Self-Review (done by the planner)

**Spec coverage:**
- §2 Goal: sitemap fix → Task 6 ✓
- §2 Goal: per-route head → Tasks 3+4 ✓
- §2 Goal: Article + Publisher JSON-LD on blog → Task 5 ✓
- §2 Goal: BreadcrumbList on blog + /for-students → Task 5 ✓
- §2 Goal: verification meta slots → Task 7 ✓
- §3 D1 (react-helmet-async): Task 1.1 ✓
- §3 D3 (Seo component shape): Task 3.1 ✓
- §3 D4 (Article fields from frontmatter): Task 5.1 ✓
- §3 D6 (commented placeholders): Task 7.1 ✓
- §3 D7 (Breadcrumb scope): Task 5 covers blog posts + /for-students, others skipped ✓
- §3 D8 (sameAs stays empty): no task touches it, deliberately ✓
- §6 verification: encoded into `scripts/verify-seo.mjs` (Task 2) + Task 7.3 manual spot-check ✓

**Placeholder scan:** No `TBD`, no `TODO`, no "similar to above" — every code block is the actual code, every command shows expected output.

**Type consistency:** `SeoProps` interface in Task 3.1 matches every `<Seo />` invocation in Tasks 4-5. `BlogPost` field names (`title`, `slug`, `date`, `seoDescription`) match the interface in `src/data/blog-index.ts` (verified during planning).

**Known unknown still open (per spec §9):** Live build pipeline (does prod run `build:seo` or `build`?). Plan does not address — user follow-up. Once Task 7 ships, this becomes the gating question for "does any of this reach production?"

---

## References

- Spec: [`docs/superpowers/specs/2026-05-26-seo-geo-followup-design.md`](../specs/2026-05-26-seo-geo-followup-design.md)
- Prerender pipeline: [`scripts/prerender.js`](../../../scripts/prerender.js)
- Blog data: [`src/data/blog-index.ts`](../../../src/data/blog-index.ts)
- App routes: [`src/App.tsx`](../../../src/App.tsx) lines 111-119
