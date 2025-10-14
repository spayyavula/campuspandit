import React, { useState } from 'react';
import { GraduationCap, Globe, DollarSign, Clock, BookOpen, Award, Upload, Check, AlertCircle } from 'lucide-react';
import { tutorAPI, TutorProfile } from '../../utils/tutoringAPI';

/**
 * TutorRegistration Component
 * Allows teachers to register as tutors on the platform
 */
export default function TutorRegistration() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profile, setProfile] = useState<Partial<TutorProfile>>({
    full_name: '',
    display_name: '',
    bio: '',
    country: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    languages: ['English'],
    teaching_experience_years: 0,
    specialization: [],
    subjects: [],
    expertise_level: 'intermediate',
    hourly_rate_usd: 500,
    min_session_duration: 60,
    max_session_duration: 180,
    accepts_instant_booking: false,
    teaching_style: '',
    qualifications: {}
  });

  const subjects = [
    'Physics', 'Chemistry', 'Mathematics', 'Biology',
    'Computer Science', 'English', 'Hindi', 'Economics',
    'Accountancy', 'Business Studies'
  ];

  const specializations = [
    'JEE Main', 'JEE Advanced', 'NEET', 'IIT',
    'CBSE', 'ICSE', 'ISC', 'IB', 'Cambridge IGCSE',
    'State Boards', 'College Level', 'Olympiads'
  ];

  const countries = [
    'India', 'United States', 'United Kingdom', 'Canada',
    'Australia', 'Singapore', 'UAE', 'Other'
  ];

  const handleChange = (field: keyof TutorProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'subjects' | 'specialization' | 'languages', item: string) => {
    const array = profile[field] || [];
    if (array.includes(item)) {
      handleChange(field, array.filter(i => i !== item));
    } else {
      handleChange(field, [...array, item]);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(profile.full_name && profile.country && profile.bio);
      case 2:
        return !!(profile.subjects && profile.subjects.length > 0 &&
                 profile.specialization && profile.specialization.length > 0 &&
                 profile.teaching_experience_years !== undefined);
      case 3:
        return !!(profile.hourly_rate_usd && profile.hourly_rate_usd > 0);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      setMessage(null);
    } else {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await tutorAPI.upsertTutorProfile(profile as TutorProfile);

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Registration submitted successfully! Your profile will be reviewed by our team.'
        });
        setStep(5); // Success step
      } else {
        throw new Error(result.error || 'Failed to submit registration');
      }
    } catch (error: any) {
      console.error('Error submitting registration:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to submit registration. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((stepNumber) => (
        <React.Fragment key={stepNumber}>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= stepNumber
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step > stepNumber ? <Check className="w-5 h-5" /> : stepNumber}
          </div>
          {stepNumber < 4 && (
            <div
              className={`w-16 h-1 ${
                step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Step 1: Basic Information
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
        <p className="text-gray-600">Tell us about yourself</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={profile.full_name}
          onChange={(e) => handleChange('full_name', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Display Name (optional)
        </label>
        <input
          type="text"
          value={profile.display_name}
          onChange={(e) => handleChange('display_name', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="How students will see your name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Country <span className="text-red-500">*</span>
        </label>
        <select
          value={profile.country}
          onChange={(e) => handleChange('country', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select country</option>
          {countries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bio <span className="text-red-500">*</span>
        </label>
        <textarea
          value={profile.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tell students about your teaching experience, approach, and what makes you a great tutor..."
        />
        <p className="text-sm text-gray-500 mt-1">{profile.bio?.length || 0}/500 characters</p>
      </div>
    </div>
  );

  // Step 2: Expertise & Subjects
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Teaching Expertise</h2>
        <p className="text-gray-600">What do you teach?</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Subjects <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {subjects.map(subject => (
            <button
              key={subject}
              type="button"
              onClick={() => toggleArrayItem('subjects', subject)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                profile.subjects?.includes(subject)
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Specialization <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {specializations.map(spec => (
            <button
              key={spec}
              type="button"
              onClick={() => toggleArrayItem('specialization', spec)}
              className={`px-4 py-2 rounded-lg border-2 transition-all text-sm ${
                profile.specialization?.includes(spec)
                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Teaching Experience (years) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="0"
          max="50"
          value={profile.teaching_experience_years}
          onChange={(e) => handleChange('teaching_experience_years', parseInt(e.target.value) || 0)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Teaching Style (optional)
        </label>
        <textarea
          value={profile.teaching_style}
          onChange={(e) => handleChange('teaching_style', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe your teaching methodology and style..."
        />
      </div>
    </div>
  );

  // Step 3: Pricing & Availability
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Pricing & Schedule</h2>
        <p className="text-gray-600">Set your rates and availability</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hourly Rate (₹) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">₹</span>
          <input
            type="number"
            min="200"
            max="5000"
            step="50"
            value={profile.hourly_rate_usd}
            onChange={(e) => handleChange('hourly_rate_usd', parseFloat(e.target.value) || 0)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">Set a competitive rate based on your experience (₹200-₹5000/hour)</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Session (minutes)
          </label>
          <input
            type="number"
            min="30"
            max="180"
            step="30"
            value={profile.min_session_duration}
            onChange={(e) => handleChange('min_session_duration', parseInt(e.target.value) || 60)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Session (minutes)
          </label>
          <input
            type="number"
            min="30"
            max="300"
            step="30"
            value={profile.max_session_duration}
            onChange={(e) => handleChange('max_session_duration', parseInt(e.target.value) || 180)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-semibold text-blue-900">Accept Instant Bookings</h4>
              <p className="text-sm text-blue-700">Students can book available slots immediately</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleChange('accepts_instant_booking', !profile.accepts_instant_booking)}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              profile.accepts_instant_booking ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                profile.accepts_instant_booking ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );

  // Step 4: Review & Submit
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Review Your Profile</h2>
        <p className="text-gray-600">Make sure everything looks good</p>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {profile.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{profile.full_name}</h3>
            <p className="text-gray-600 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {profile.country}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">₹{profile.hourly_rate_usd}/hr</p>
            <p className="text-sm text-gray-500">{profile.teaching_experience_years} years exp.</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-gray-700">{profile.bio}</p>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Subjects
          </h4>
          <div className="flex flex-wrap gap-2">
            {profile.subjects?.map(subject => (
              <span key={subject} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {subject}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Specialization
          </h4>
          <div className="flex flex-wrap gap-2">
            {profile.specialization?.map(spec => (
              <span key={spec} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {spec}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-semibold mb-1">Profile Verification Required</p>
          <p>Your profile will be reviewed by our team within 24-48 hours. We'll notify you via email once it's approved.</p>
        </div>
      </div>
    </div>
  );

  // Step 5: Success
  const renderStep5 = () => (
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-10 h-10 text-green-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Registration Submitted!</h2>
      <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
        Thank you for joining CampusPandit! We're reviewing your profile and will get back to you within 24-48 hours.
      </p>
      <div className="space-y-4 max-w-md mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>We'll verify your credentials and qualifications</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>You'll receive an email once approved</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Set up your availability and start teaching</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Become a Tutor</h1>
            <p className="text-gray-600 mt-2">Share your knowledge with students worldwide</p>
          </div>

          {/* Step Indicator */}
          {step < 5 && renderStepIndicator()}

          {/* Form Steps */}
          <div className="mt-8">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
          </div>

          {/* Message */}
          {message && step < 5 && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 5 && (
            <div className="flex items-center justify-between mt-8">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
