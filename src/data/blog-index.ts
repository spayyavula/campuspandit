import runningSaaS from '../content/blog/2026-05-22-running-a-coaching-center-like-a-saas.md?raw';
import jeePrep from '../content/blog/2026-05-22-jee-prep-the-honest-version.md?raw';

export type BlogAudience = 'coaching_center' | 'prospective_cc_via_student' | 'both';

export interface BlogPost {
  title: string;
  slug: string;
  date: string;
  audience: BlogAudience;
  excerpt: string;
  seoDescription: string;
  body: string;
}

interface RawBlogPost {
  raw: string;
  slug: string;
}

const RAW_POSTS: RawBlogPost[] = [
  { raw: runningSaaS, slug: 'running-a-coaching-center-like-a-saas' },
  { raw: jeePrep, slug: 'jee-prep-the-honest-version' },
];

function parseFrontmatter(raw: string): BlogPost {
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!fmMatch) throw new Error('blog post missing frontmatter');
  const [, fm, body] = fmMatch;

  const get = (key: string): string => {
    const m = fm.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?\\s*$`, 'm'));
    if (!m) throw new Error(`blog post missing frontmatter key: ${key}`);
    return m[1].trim();
  };

  return {
    title: get('title'),
    slug: get('slug'),
    date: get('date'),
    audience: get('audience') as BlogAudience,
    excerpt: get('excerpt'),
    seoDescription: get('seo_description'),
    body: body.trim(),
  };
}

export const posts: BlogPost[] = RAW_POSTS
  .map(({ raw }) => parseFrontmatter(raw))
  .sort((a, b) => b.date.localeCompare(a.date));

export const postBySlug = (slug: string): BlogPost | undefined =>
  posts.find(p => p.slug === slug);
