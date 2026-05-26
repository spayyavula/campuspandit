# SEO/GEO Follow-up Design — Sitemap, Per-Route Heads, Article Schema

**Date:** 2026-05-26
**Status:** Approved, ready for implementation plan
**Branch target:** `main` (independent of `aws-platform`; AWS migration will rebase off it)
**Builds on:** commit `913c0959` (feat(landing+seo): JEE/NEET positioning + JSON-LD + prerender pipeline)

## 1. Context

The 2026-05-21 SEO/GEO rework (commit `913c0959`) shipped solid foundations: index.html has 4 JSON-LD blocks (Organization, SoftwareApplication, WebSite, FAQPage), robots.txt explicitly allows 14 AI crawlers including GPTBot/ClaudeBot/PerplexityBot, and `scripts/prerender.js` generates static HTML for 10 public routes via Puppeteer.

A May 2026 audit surfaced three concrete gaps:

1. **Sitemap-vs-robots contradiction.** `public/sitemap.xml` lists 5 URLs of which 4 (`/tutors`, `/courses`, `/tutor/register`, `/auth`) are `Disallow`'d in robots.txt or behave as `ParkedRoute` redirects to `/`. None of the 10 actually-public routes the prerender pipeline produces (`/for-students`, `/blog`, 2 blog posts, `/materials`, `/roadmap`, `/ideas`, `/apply`, `/apply/thanks`) appear in the sitemap. Net effect: search engines have no map of the content that exists, and are pointed at content that doesn't.
2. **Single `<head>` for the whole SPA.** `index.html` carries one B2B-targeted title and description. Routes like `/for-students` and `/blog/<post>` need their own — but the React tree never sets them, so prerendered HTML for every route inherits the B2B head. The student page can't rank for student queries; blog posts can't rank for their own topics.
3. **Blog posts have no Article schema.** `BlogPost.tsx` renders title + body but emits no per-post structured data. Article + BreadcrumbList schema is the cheapest GEO lift available — author, datePublished, headline are signals AI search engines weight heavily, and the frontmatter already carries all three.

This spec closes those three gaps. It does not revisit the 2026-05-21 design choices.

## 2. Goals and non-goals

### Goals

- Restore correct sitemap → 10 prerendered routes, no disallowed URLs, real `<lastmod>` dates from blog frontmatter.
- Give every public route its own title / description / canonical / OG meta, with no regression to existing static `<head>` content.
- Emit Article + Publisher JSON-LD on `/blog/<slug>` routes from existing frontmatter (no manual data entry).
- Emit BreadcrumbList JSON-LD on blog posts and `/for-students`.
- Add commented Search Console + Bing Webmaster verification slots in `index.html`.

### Non-goals

- Building real backlinks, off-page authority, or social profiles (`sameAs` stays `[]`; fabricating URLs is worse than leaving it empty).
- Verifying that the live build pipeline runs `build:seo` rather than `build` — out of scope per user choice; documented as known unknown in §9.
- Adding new public routes (e.g., `/find-tutors`, `/browse-courses`) to replace the parked `/tutors` and `/courses` — that's a product decision tracked in [[landing-seo-followups]].
- Changing the existing index.html JSON-LD blocks (Organization, SoftwareApplication, WebSite, FAQPage). They are the page-level defaults; per-route JSON-LD is additive.
- Changing prerender route list, robots.txt, or Plausible setup.

## 3. Decisions

| ID | Decision | Choice |
|----|----------|--------|
| D1 | Library for per-route `<head>` | `react-helmet-async`. ~5 kB gz, one runtime dep, React 18 + Strict Mode safe, well-tested with Puppeteer prerender. Rejected: rolling our own DOM-mutating effect (correctness risk on hydration), `next/head` (we're on Vite). |
| D2 | Where to keep page-level defaults | Stay in `index.html`. Helmet overrides `<title>`/`<meta description>`/`<link canonical>` per-route at mount; existing JSON-LD scripts stay as default-on-every-page baseline. Additive model — per-route JSON-LD via Helmet runs alongside, not instead of, the defaults. |
| D3 | Where to put the SEO API | New file `src/components/Seo.tsx` — single component, props `{title, description, canonical, ogImage?, ogType?, jsonLd?}`. Every route gets one `<Seo />` at the top of its render. No per-route hooks, no context, no provider beyond Helmet's own. |
| D4 | Blog post Article schema source | Pure derivation from `src/data/blog-index.ts` frontmatter (`title`, `slug`, `date`, `seoDescription`). No hand-entered author per post; `author` is `Organization: CampusPandit`. `dateModified` = `datePublished` until we have edit tracking. |
| D5 | Sitemap generator | Continue checking-in `public/sitemap.xml` by hand. We have 10 stable URLs and 2 blog posts; the file is ~40 lines. A generator script is overkill until the route count moves. |
| D6 | Verification meta tags | Add as **commented** placeholders in `index.html`. Empty `content=""` would be valid HTML but ambiguous — commented form makes "paste your token here" unmistakable. |
| D7 | BreadcrumbList scope | Blog posts + `/for-students` only. `/`, `/apply`, `/apply/thanks`, `/materials`, `/roadmap`, `/ideas` are single-level and breadcrumbs would be cosmetic. |
| D8 | `sameAs` empty array | Leave as `[]`. Add a TODO note pointing at [[landing-seo-followups]]. Filling it with fabricated profile URLs hurts entity disambiguation more than absence does. |

## 4. Target structure

```
src/
  components/
    Seo.tsx                    [NEW] one reusable component, all public routes use it
    LandingPage.tsx            modify: add <Seo /> with B2B copy
    LandingPageStudent.tsx     modify: add <Seo /> with student copy + BreadcrumbList
    Blog.tsx                   modify: add <Seo /> for blog index
    BlogPost.tsx               modify: add <Seo /> with Article + BreadcrumbList JSON-LD
    PreparationMaterials.tsx   modify: add <Seo />
    Roadmap.tsx                modify: add <Seo />
    Ideas.tsx                  modify: add <Seo />
    PilotApplication.tsx       modify: add <Seo />
    PilotApplicationThanks.tsx modify: add <Seo /> with noindex
  main.tsx                     modify: wrap <App> in <HelmetProvider>

index.html                     modify: insert commented verification meta block

public/
  sitemap.xml                  rewrite: 10 routes, drop disallowed, add hreflang

package.json                   modify: add react-helmet-async dependency
```

### `Seo.tsx` API sketch

```tsx
interface SeoProps {
  title: string;                 // full <title> text; library does not append site name
  description: string;
  canonical: string;             // absolute URL
  ogImage?: string;              // defaults to /og-image.png
  ogType?: 'website' | 'article';
  noindex?: boolean;             // /apply/thanks
  jsonLd?: object | object[];    // additional JSON-LD blocks for this route
}
```

Component emits a `<Helmet>` block with: `<title>`, `<meta name="description">`, `<link rel="canonical">`, `og:title` / `og:description` / `og:url` / `og:type` / `og:image`, `twitter:title` / `twitter:description` / `twitter:image`, optional `<meta name="robots" content="noindex,follow">` when `noindex`, and one `<script type="application/ld+json">` per JSON-LD object.

### Route-specific copy (final, ready to paste)

| Route | `<title>` | `<meta description>` |
|---|---|---|
| `/` | unchanged from current index.html | unchanged |
| `/for-students` | `Is Your JEE/NEET Coaching Center Using the Right Tech? — CampusPandit` | `Students: if your coaching center still runs on WhatsApp, paper attendance, and Saturday tests, here's what they could be running instead. Tell them about CampusPandit — branded app, AI Coach, parent dashboard.` |
| `/blog` | `CampusPandit Blog — Coaching Centers, JEE/NEET, and Building Edtech in India` | `Honest writing on running a coaching center, JEE/NEET prep, and the edtech stack behind CampusPandit.` |
| `/blog/<slug>` | `${post.title} — CampusPandit Blog` | `${post.seoDescription}` |
| `/materials` | `JEE & NEET Preparation Materials — Free PYQ-Indexed Resources \| CampusPandit` | `Free preparation materials for JEE Main, JEE Advanced, and NEET UG aspirants — chapter notes, PYQ-weighted topic lists, and mock paper templates.` |
| `/roadmap` | `Product Roadmap — CampusPandit` | `What we're shipping next on CampusPandit and what's queued behind it. Built in public for the Founding 10 cohort.` |
| `/ideas` | `Feature Requests & Ideas — CampusPandit` | `Vote on feature requests for the CampusPandit coaching center platform, or submit your own. Roadmap drivers come from here.` |
| `/apply` | `Apply for the Founding 10 — CampusPandit Pilot Cohort` | `Apply for one of ten 2026 founder slots. Free for the first three months, up to 100 students, founder pricing locked in for life. Branded app live in 7 days.` |
| `/apply/thanks` | `Application Received — CampusPandit` | `Your founder pilot application is in. We'll reply within 2 business days with next steps.` (also `noindex`) |

### Sitemap content (final)

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

### Article + Breadcrumb JSON-LD (emitted from `BlogPost.tsx`)

```js
const article = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": post.title,
  "description": post.seoDescription,
  "datePublished": post.date,
  "dateModified": post.date,
  "author": {
    "@type": "Organization",
    "name": "CampusPandit",
    "url": "https://www.campuspandit.ai"
  },
  "publisher": {
    "@type": "Organization",
    "name": "CampusPandit",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.campuspandit.ai/icons/icon-512x512.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": `https://www.campuspandit.ai/blog/${post.slug}`
  }
};

const breadcrumbs = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.campuspandit.ai/" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.campuspandit.ai/blog" },
    { "@type": "ListItem", "position": 3, "name": post.title, "item": `https://www.campuspandit.ai/blog/${post.slug}` }
  ]
};
```

`/for-students` BreadcrumbList is a 2-item variant of the same shape.

## 5. Implementation order

1. Add `react-helmet-async` dependency, wrap `<App>` in `<HelmetProvider>` in `src/main.tsx`. Verify `npm run build` still succeeds — no behaviour change yet.
2. Create `src/components/Seo.tsx` with the API from §4. Unit-level smoke: render in `LandingPage` only, run `npm run build:seo`, open `dist/index.html`, confirm title is unchanged from current production. This proves Helmet integrates with prerender before we touch other routes.
3. Add `<Seo />` to the remaining 8 public routes using the copy table from §4. Run `npm run build:seo` and spot-check `dist/for-students/index.html`, `dist/blog/jee-prep-the-honest-version/index.html`, `dist/apply/index.html` for correct title, description, canonical.
4. Add Article + BreadcrumbList JSON-LD to `BlogPost.tsx` via the `jsonLd` prop. Spot-check that both `<script type="application/ld+json">` blocks appear in `dist/blog/<slug>/index.html`.
5. Add BreadcrumbList JSON-LD to `LandingPageStudent.tsx`.
6. Rewrite `public/sitemap.xml` with the content in §4.
7. Add the commented verification meta block to `index.html` just below `<meta name="robots">`.
8. Final verification per §7. Commit as a single `feat(seo)` change with a short description.

Steps 1-2 form the de-risk gate: if Helmet doesn't show up in prerender output the way we expect, we stop before touching 8 files. Steps 3-6 are mechanical after that.

## 6. Verification before claiming done

- `npm install` succeeds and `package-lock.json` shows `react-helmet-async` at a single version.
- `npm run build:seo` completes with no errors and produces all 10 expected `dist/<route>/index.html` files.
- Per-route head spot-check on three prerendered files (`dist/for-students/index.html`, `dist/blog/jee-prep-the-honest-version/index.html`, `dist/apply/index.html`): correct `<title>`, correct `<meta name="description">`, correct `<link rel="canonical">` matching the route, no leftover B2B-only copy.
- `dist/blog/jee-prep-the-honest-version/index.html` contains an Article JSON-LD block and a BreadcrumbList JSON-LD block, both validating against schema.org shape by inspection.
- `dist/apply/thanks/index.html` contains `<meta name="robots" content="noindex,follow">`.
- `dist/sitemap.xml` (copied from `public/`) contains exactly the 10 URLs from §4, contains no disallowed URLs (`/tutors`, `/courses`, `/auth`, `/tutor/register`), and parses as valid XML.
- No console errors in `npm run dev` for any public route — Helmet's mount/unmount lifecycle has no React Strict Mode warnings.

Verification is local-only. Live Rich Results Test (https://search.google.com/test/rich-results) requires a deployed URL and is a post-merge step the user runs manually.

## 7. Risks

- **Helmet vs prerender timing.** If Puppeteer snapshots before Helmet writes to the DOM, prerendered HTML won't have route-specific heads. Mitigated by `scripts/prerender.js:96` using `waitUntil: 'networkidle0'` plus `waitForSelector('nav')` — Helmet runs in the same commit phase as nav mounts. Step 2 of §5 is the explicit gate that catches this before fanning out.
- **Duplicate JSON-LD from both static and Helmet sources.** `index.html` always-on blocks remain on every prerendered page (Organization, SoftwareApplication, WebSite, FAQPage), and per-route Helmet adds more. Schema.org and Google explicitly allow multiple `application/ld+json` blocks per document — not a bug. But if validation tools flag it, the cleanup is to move the SoftwareApplication block out of `index.html` and into `<Seo />` on `/` only.
- **`react-helmet-async` maintenance status.** Repo is in slower-maintenance mode but still works on React 18; widely used. If long-term support becomes a concern, `@dr.pogodin/react-helmet` is a drop-in fork.

## 8. Rollback

This is purely additive on the client. Reverting the implementation commit:
- Restores the wrong sitemap (no regression for users, just back to the audit baseline).
- Removes per-route heads (every route reverts to inheriting `index.html` head).
- Removes Article + BreadcrumbList schema.

No data migration, no infrastructure change, no third-party state. Single `git revert` is sufficient.

## 9. Known unknowns

- **Live build pipeline.** The 4-day-old [[landing-seo-followups]] memory said the Azure Static Web Apps workflow runs `build` not `build:seo`, citing `.github/workflows/azure-static-web-apps-ambitious-river-04fdcd510.yml`. That file does not exist in the working tree on `aws-platform` — either deleted in the AWS migration churn, or on a different branch, or the memory was wrong. **If the live pipeline still runs `build`, none of slice 2 or slice 3 will reach production** — prerender is the entire mechanism by which per-route heads become discoverable static HTML. User to confirm where the live site builds before considering this work shipped.
- **`sameAs` social profiles.** Tracked in [[landing-seo-followups]]. Add to `Organization` JSON-LD when LinkedIn and X handles exist.
- **Search Console + Bing Webmaster verification.** Commented placeholders are added; tokens are user-action work.

## 10. References

- Audit baseline: commit `913c0959` (feat(landing+seo): JEE/NEET positioning + JSON-LD + prerender pipeline)
- Prerender pipeline: [`scripts/prerender.js`](../../../scripts/prerender.js)
- Blog data: [`src/data/blog-index.ts`](../../../src/data/blog-index.ts)
- Princeton GEO research (Aggarwal et al., 2024): structured data + answer-first formatting drive AI citation rates; FAQPage and Article schema are highest-leverage formats.
- Landing/SEO follow-ups memory: [[landing-seo-followups]]
- B2B pivot positioning: [[b2b-pivot]]
