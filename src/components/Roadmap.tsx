import React from 'react';
import { items, type RoadmapColumn, type RoadmapAudience } from '../data/roadmap';
import Seo from './Seo';

const COLUMNS: { id: RoadmapColumn; label: string; desc: string }[] = [
  { id: 'now', label: 'Now', desc: 'Active work this quarter.' },
  { id: 'next', label: 'Next', desc: 'On deck after current work.' },
  { id: 'later', label: 'Later', desc: 'Planned but not scheduled.' },
];

const AUDIENCE_BADGE: Record<RoadmapAudience, { label: string; bg: string; text: string }> = {
  coaching_center: { label: 'Coaching center', bg: 'bg-primary-50', text: 'text-primary-700' },
  prospective_cc_via_student: { label: 'Student', bg: 'bg-success-50', text: 'text-success-700' },
  both: { label: 'Both', bg: 'bg-secondary-50', text: 'text-secondary-700' },
};

const Roadmap: React.FC = () => (
  <div className="min-h-screen bg-white">
    <Seo
      title="Product Roadmap — CampusPandit"
      description="What we're shipping next on CampusPandit and what's queued behind it. Built in public for the Founding 10 cohort."
      canonical="https://www.campuspandit.ai/roadmap"
    />
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <h1 className="text-4xl font-bold text-neutral-900 mb-4">Roadmap</h1>
      <p className="text-lg text-neutral-600 mb-12">
        Public transparency on what we are building. Updated as we learn — no dates, only priority.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {COLUMNS.map(col => {
          const entries = items.filter(i => i.column === col.id);
          return (
            <div key={col.id} className="bg-neutral-50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-1">{col.label}</h2>
              <p className="text-sm text-neutral-500 mb-6">{col.desc}</p>
              <ul className="space-y-4">
                {entries.map(item => {
                  const badge = AUDIENCE_BADGE[item.audience];
                  return (
                    <li key={item.title} className="bg-white p-4 rounded-lg border border-neutral-200">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${badge.bg} ${badge.text} flex-shrink-0`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600">{item.description}</p>
                    </li>
                  );
                })}
                {entries.length === 0 && (
                  <li className="text-sm text-neutral-400 italic">Nothing here yet.</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </main>
  </div>
);

export default Roadmap;
