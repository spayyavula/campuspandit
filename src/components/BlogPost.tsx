import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { postBySlug } from '../data/blog-index';
import Seo from './Seo';

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/blog" replace />;
  const post = postBySlug(slug);
  if (!post) return <Navigate to="/blog" replace />;

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

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title={`${post.title} — CampusPandit Blog`}
        description={post.seoDescription}
        canonical={`https://www.campuspandit.ai/blog/${post.slug}`}
        ogType="article"
        jsonLd={[article, breadcrumbs]}
      />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <Link to="/blog" className="text-sm text-primary-500 hover:underline mb-6 inline-block">
          ← All posts
        </Link>
        <article>
          <p className="text-sm text-neutral-500 mb-3">{post.date}</p>
          <h1 className="text-4xl font-bold text-neutral-900 mb-8">{post.title}</h1>
          <div className="space-y-4 text-neutral-700 leading-relaxed">
            <ReactMarkdown>{post.body}</ReactMarkdown>
          </div>
        </article>
      </main>
    </div>
  );
};

export default BlogPost;
