import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseObserve } from '../utils/supabaseObserve';

const SUBJECT_OPTIONS = ['Physics', 'Chemistry', 'Math', 'Biology', 'JEE Combined', 'NEET Combined', 'Other'];

type PlausibleProps = { props?: Record<string, string> };
type PlausibleFn = (event: string, opts?: PlausibleProps) => void;
const plausible = (): PlausibleFn | undefined =>
  (window as { plausible?: PlausibleFn }).plausible;

const PilotApplication: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    center_name: '', owner_name: '', location: '',
    students_count: '', current_software: '', website_or_instagram: '',
    contact_email: '', contact_phone: '', message: '',
  });
  const [subjects, setSubjects] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSubject(s: string) {
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (subjects.length === 0) {
      setError('Please select at least one subject.');
      setSubmitting(false);
      return;
    }

    const studentsCount = parseInt(form.students_count, 10);
    if (Number.isNaN(studentsCount) || studentsCount < 1 || studentsCount > 100000) {
      setError('Number of students must be between 1 and 100000.');
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabaseObserve
      .from('pilot_applications')
      .insert({
        center_name: form.center_name.trim(),
        owner_name: form.owner_name.trim(),
        location: form.location.trim(),
        students_count: studentsCount,
        subjects_taught: subjects,
        current_software: form.current_software.trim() || null,
        website_or_instagram: form.website_or_instagram.trim() || null,
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim() || null,
        message: form.message.trim() || null,
      });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    const bucket = studentsCount < 100 ? '<100' : studentsCount < 500 ? '100-499' : studentsCount < 1000 ? '500-999' : '1000+';
    plausible()?.('pilot_application_submitted', { props: { students_count_bucket: bucket } });

    navigate('/apply/thanks');
  }

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">Apply for the Founding 10 pilot</h1>
        <p className="text-lg text-neutral-600 mb-10">
          Tell us about your coaching center. We review within 48 hours and reach out for a 20-minute call if there&apos;s fit.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Coaching center name" required>
            <input type="text" required value={form.center_name} onChange={update('center_name')} className={inputClass} />
          </Field>
          <Field label="Your name" required>
            <input type="text" required value={form.owner_name} onChange={update('owner_name')} className={inputClass} />
          </Field>
          <Field label="Location (city, state)" required>
            <input type="text" required value={form.location} onChange={update('location')} className={inputClass} />
          </Field>
          <Field label="Number of students" required>
            <input type="number" required min={1} max={100000} value={form.students_count} onChange={update('students_count')} className={inputClass} />
          </Field>
          <Field label="Subjects taught" required>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_OPTIONS.map(s => (
                <button
                  key={s} type="button" onClick={() => toggleSubject(s)}
                  className={`px-3 py-1 rounded-full text-sm border transition ${
                    subjects.includes(s)
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary-500'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <Field label="What do you currently use? (LMS, CRM, WhatsApp groups, spreadsheets…)">
            <input type="text" value={form.current_software} onChange={update('current_software')} className={inputClass} />
          </Field>
          <Field label="Website or Instagram handle">
            <input type="text" value={form.website_or_instagram} onChange={update('website_or_instagram')} className={inputClass} />
          </Field>
          <Field label="Contact email" required>
            <input type="email" required value={form.contact_email} onChange={update('contact_email')} className={inputClass} />
          </Field>
          <Field label="Contact phone (optional)">
            <input type="tel" value={form.contact_phone} onChange={update('contact_phone')} className={inputClass} />
          </Field>
          <Field label="Anything else we should know?">
            <textarea rows={4} maxLength={4000} value={form.message} onChange={update('message')} className={inputClass} />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit" disabled={submitting}
            className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition font-medium"
          >
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>
          <p className="text-xs text-neutral-500 text-center">
            We respond within 48 hours · No sales calls without your ask
          </p>
        </form>
      </main>
    </div>
  );
};

const inputClass = 'w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

interface FieldProps { label: string; required?: boolean; children: React.ReactNode; }
const Field: React.FC<FieldProps> = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-neutral-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

export default PilotApplication;
