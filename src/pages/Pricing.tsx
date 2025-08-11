import React from 'react';
import { useNavigate } from 'react-router-dom';
import PricingPlans from '../components/PricingPlans';
import SubscriptionStatus from '../components/SubscriptionStatus';
import { supabase } from '../utils/supabase';

const Pricing: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/payment-success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Pricing Plans</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Choose the perfect plan for your needs. Upgrade anytime to get access to more features.
        </p>
      </div>

      <div className="mb-12">
        <SubscriptionStatus />
      </div>

      <PricingPlans onSuccess={handleSuccess} />

      <div className="mt-12 bg-blue-50 rounded-xl p-8 border border-blue-200">
        <h3 className="text-xl font-semibold text-blue-900 mb-4">Why Choose CampusPandit?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h4 className="font-bold text-gray-900 mb-2">Comprehensive Learning</h4>
            <p className="text-gray-600">Access to all subjects with detailed lessons and practice exercises.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h4 className="font-bold text-gray-900 mb-2">Interactive Experience</h4>
            <p className="text-gray-600">Engage with gamified learning and compete with other students.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h4 className="font-bold text-gray-900 mb-2">Expert Content</h4>
            <p className="text-gray-600">Curriculum designed by education experts for maximum effectiveness.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;