import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { posts, type BlogAudience } from '../data/blog-index';
import Seo from './Seo';

const Blog: React.FC = () => {
  const [filter, setFilter] = useState<BlogAudience | 'all'>('all');
  const visible = filter === 'all'
    ? posts
    : posts.filter(p => p.audience === filter || p.audience === 'both');

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title="CampusPandit Blog — Coaching Centers, JEE/NEET, and Building Edtech in India"
        description="Honest writing on running a coaching center, JEE/NEET prep, and the edtech stack behind CampusPandit."
        canonical="https://www.campuspandit.ai/blog"
      />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <h1 className="text-4xl font-bold text-neutral-900 mb-6">Blog</h1>

        <div className="flex gap-2 mb-10">
          <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterChip label="Coaching centers" active={filter === 'coaching_center'} onClick={() => setFilter('coaching_center')} />
          <FilterChip label="Students" active={filter === 'prospective_cc_via_student'} onClick={() => setFilter('prospective_cc_via_student')} />
        </div>

        <ul className="space-y-8">
          {visible.map(p => (
            <li key={p.slug} className="border-b border-neutral-200 pb-8">
              <Link to={`/blog/${p.slug}`} className="block hover:opacity-80 transition">
                <p className="text-sm text-neutral-500 mb-2">{p.date}</p>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2">{p.title}</h2>
                <p className="text-neutral-600">{p.excerpt}</p>
              </Link>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="text-neutral-500">No posts in this category yet.</li>
          )}
        </ul>
      </main>
    </div>
  );
};

interface FilterChipProps { label: string; active: boolean; onClick: () => void; }
const FilterChip: React.FC<FilterChipProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm transition ${
      active ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
    }`}
  >
    {label}
  </button>
);

export default Blog;
