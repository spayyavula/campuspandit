import React from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { materials, type MaterialSubject } from '../data/materials';

const SUBJECTS: MaterialSubject[] = ['Physics', 'Chemistry', 'Math', 'Biology', 'Mixed'];

const PreparationMaterials: React.FC = () => (
  <div className="min-h-screen bg-white">
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <h1 className="text-4xl font-bold text-neutral-900 mb-4">Preparation Materials</h1>
      <p className="text-lg text-neutral-600 mb-12">
        Free, official sources for JEE and NEET preparation. NCERT textbooks, OpenStax open-license books, and the
        authoritative past-year question paper archives from NTA.
      </p>

      {SUBJECTS.map(subject => {
        const entries = materials.filter(m => m.subject === subject);
        if (entries.length === 0) return null;
        return (
          <section key={subject} className="mb-12">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">{subject}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {entries.map(m => (
                <a key={m.url} href={m.url} target="_blank" rel="noopener noreferrer"
                   className="block p-5 border border-neutral-200 rounded-lg hover:border-primary-500 transition group">
                  <div className="flex items-start gap-3 mb-2">
                    {m.type === 'pdf'
                      ? <FileText className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      : <ExternalLink className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />}
                    <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600">{m.title}</h3>
                  </div>
                  <p className="text-sm text-neutral-600">{m.description}</p>
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  </div>
);

export default PreparationMaterials;
