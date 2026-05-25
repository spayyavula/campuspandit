import React, { useEffect, useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { api, ApiError } from '../lib/api';

type Audience = 'coaching_center' | 'prospective_cc_via_student' | 'both';

interface Idea {
  id: string;
  title: string;
  description: string | null;
  audience: Audience;
  upvotes: number;
  created_at: string;
}

const Ideas: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState<Audience>('coaching_center');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<Idea[]>([]);

  useEffect(() => {
    void loadPublished();
  }, []);

  async function loadPublished() {
    try {
      const data = await api.get<Idea[]>('/feature-requests');
      setPublished(data);
    } catch (e) {
      console.error('Failed to load published ideas:', e);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/feature-requests', {
        title: title.trim(),
        description: description.trim() || null,
        audience,
        submitter_email: email.trim() || null,
      });
    } catch (e) {
      setSubmitting(false);
      setError(e instanceof ApiError ? e.body : (e as Error).message);
      return;
    }
    setSubmitting(false);
    setSubmitted(true);
    setTitle(''); setDescription(''); setEmail('');
    // Plausible custom event (no-op until Plausible script is added in Phase 3.9.2)
    (window as { plausible?: (event: string, opts?: { props?: Record<string, string> }) => void }).plausible?.(
      'feature_request_submitted',
      { props: { audience } }
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">Ideas</h1>
        <p className="text-lg text-neutral-600 mb-10">
          What should CampusPandit build next? Coaching center owners and students both welcome.
        </p>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Submit an idea</h2>
          {submitted ? (
            <div className="p-6 bg-success-50 border border-success-200 rounded-lg">
              <p className="text-success-700 font-medium mb-2">Thanks — we&apos;ll review and publish soon.</p>
              <button onClick={() => setSubmitted(false)} className="text-sm text-primary-500 hover:underline">
                Submit another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  type="text" required minLength={3} maxLength={120}
                  value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Details (optional)</label>
                <textarea
                  rows={4} maxLength={2000}
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">This idea is for:</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  {(['coaching_center', 'prospective_cc_via_student', 'both'] as Audience[]).map(a => (
                    <label key={a} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio" name="audience" value={a}
                        checked={audience === a} onChange={() => setAudience(a)}
                      />
                      <span className="text-sm text-neutral-700">
                        {a === 'coaching_center' ? 'Coaching centers' : a === 'prospective_cc_via_student' ? 'Students' : 'Both'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Your email (optional — for follow-up)</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit" disabled={submitting}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition"
              >
                {submitting ? 'Submitting…' : 'Submit idea'}
              </button>
            </form>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Recently published ideas</h2>
          {published.length === 0 && <p className="text-neutral-500">No published ideas yet — yours could be the first.</p>}
          <ul className="space-y-4">
            {published.map(idea => (
              <li key={idea.id} className="p-5 border border-neutral-200 rounded-lg">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-semibold text-neutral-900">{idea.title}</h3>
                  <button
                    type="button" aria-disabled="true"
                    title="Sign in to upvote (coming soon)"
                    className="flex items-center gap-1 px-3 py-1 text-sm text-neutral-500 bg-neutral-100 rounded-full cursor-not-allowed"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {idea.upvotes}
                  </button>
                </div>
                {idea.description && <p className="text-sm text-neutral-600 mb-2">{idea.description}</p>}
                <p className="text-xs text-neutral-400">
                  {idea.audience === 'coaching_center' ? 'For coaching centers'
                   : idea.audience === 'prospective_cc_via_student' ? 'For students'
                   : 'For both'}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default Ideas;
