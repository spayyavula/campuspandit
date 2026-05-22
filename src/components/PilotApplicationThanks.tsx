import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

const PilotApplicationThanks: React.FC = () => (
  <div className="min-h-screen bg-white">
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
      <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-6" />
      <h1 className="text-4xl font-bold text-neutral-900 mb-4">Application received</h1>
      <p className="text-lg text-neutral-600 mb-10">
        Thanks — we&apos;ll review within 48 hours and reach out to schedule a 20-minute call if there&apos;s fit.
      </p>
      <Link
        to="/roadmap"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium"
      >
        See what we&apos;re building next
        <ArrowRight className="w-4 h-4" />
      </Link>
    </main>
  </div>
);

export default PilotApplicationThanks;
