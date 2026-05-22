import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { postBySlug } from '../data/blog-index';

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/blog" replace />;
  const post = postBySlug(slug);
  if (!post) return <Navigate to="/blog" replace />;

  return (
    <div className="min-h-screen bg-white">
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
