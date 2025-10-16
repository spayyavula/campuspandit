import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  DollarSign,
  Star,
  Globe,
  Award,
  BookOpen,
  ArrowLeft,
  Info,
  Video
} from 'lucide-react';
import { tutorAPI, TutorProfile } from '../../utils/tutoringAPI';
import { supabase } from '../../utils/supabase';
import MultiGatewayPaymentButton from '../payment/MultiGatewayPaymentButton';
import { Button, Card, Input } from '../ui';

const TutorBooking: React.FC = () => {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Booking form state
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadTutorAndUser();
  }, [tutorId]);

  // Sample tutor data (same as FindTutors and TutorProfile)
  const getSampleTutorData = (id: string): TutorProfile | null => {
    const sampleTutors: TutorProfile[] = [
      {
        id: 'sample-1',
        full_name: 'Dr. Priya Sharma',
        bio: 'IIT Delhi alumna with 8 years of experience teaching Physics for JEE Advanced. Helped 50+ students crack top IITs. Interactive teaching with real-world examples.',
        country: 'India',
        timezone: 'Asia/Kolkata',
        languages: ['English', 'Hindi'],
        teaching_experience_years: 8,
        specialization: ['JEE Advanced', 'JEE Main', 'IIT'],
        subjects: ['Physics', 'Mathematics'],
        hourly_rate_usd: 1200,
        average_rating: 4.9,
        total_reviews: 127,
        total_sessions: 450,
        accepts_instant_booking: true,
        is_active: true,
        verification_status: 'verified',
        profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia'
      },
      {
        id: 'sample-2',
        full_name: 'Rajesh Kumar',
        bio: 'NEET coach with 95% success rate. Specialized in Organic Chemistry and Biology. Former professor at Delhi University. Patient and thorough teaching style.',
        country: 'India',
        timezone: 'Asia/Kolkata',
        languages: ['English', 'Hindi', 'Tamil'],
        teaching_experience_years: 12,
        specialization: ['NEET', 'CBSE'],
        subjects: ['Chemistry', 'Biology'],
        hourly_rate_usd: 900,
        average_rating: 4.8,
        total_reviews: 203,
        total_sessions: 680,
        accepts_instant_booking: true,
        is_active: true,
        verification_status: 'verified',
        profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh'
      },
      {
        id: 'sample-3',
        full_name: 'Ananya Patel',
        bio: 'Cambridge IGCSE & IB Mathematics specialist. International board expert with students in 15+ countries. Makes complex calculus concepts simple and fun!',
        country: 'India',
        timezone: 'Asia/Kolkata',
        languages: ['English'],
        teaching_experience_years: 6,
        specialization: ['Cambridge IGCSE', 'IB'],
        subjects: ['Mathematics', 'Physics'],
        hourly_rate_usd: 1500,
        average_rating: 5.0,
        total_reviews: 89,
        total_sessions: 320,
        accepts_instant_booking: false,
        is_active: true,
        verification_status: 'verified',
        profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya',
        video_intro_url: 'https://example.com/intro'
      },
      {
        id: 'sample-4',
        full_name: 'Vikram Singh',
        bio: 'JEE Mains expert and competitive exam strategist. Gold medalist in Mathematics Olympiad. Focus on problem-solving techniques and time management.',
        country: 'India',
        timezone: 'Asia/Kolkata',
        languages: ['English', 'Hindi', 'Punjabi'],
        teaching_experience_years: 5,
        specialization: ['JEE Main', 'CBSE'],
        subjects: ['Mathematics'],
        hourly_rate_usd: 800,
        average_rating: 4.7,
        total_reviews: 156,
        total_sessions: 540,
        accepts_instant_booking: true,
        is_active: true,
        verification_status: 'verified',
        profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram'
      },
      {
        id: 'sample-5',
        full_name: 'Meera Iyer',
        bio: 'ICSE/ISC Chemistry wizard with unique teaching methods. Research scholar at IISC Bangalore. Helped 100+ students achieve 95+ in board exams.',
        country: 'India',
        timezone: 'Asia/Kolkata',
        languages: ['English', 'Hindi', 'Kannada'],
        teaching_experience_years: 7,
        specialization: ['ICSE', 'ISC', 'CBSE'],
        subjects: ['Chemistry', 'Physics'],
        hourly_rate_usd: 1000,
        average_rating: 4.9,
        total_reviews: 178,
        total_sessions: 590,
        accepts_instant_booking: true,
        is_active: true,
        verification_status: 'verified',
        profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meera',
        video_intro_url: 'https://example.com/intro'
      },
      {
        id: 'sample-6',
        full_name: 'Arjun Reddy',
        bio: 'Young IIT Bombay graduate teaching Physics with passion. Relatable teaching style for students. Specializes in problem-solving and conceptual clarity.',
        country: 'India',
        timezone: 'Asia/Kolkata',
        languages: ['English', 'Hindi', 'Telugu'],
        teaching_experience_years: 3,
        specialization: ['JEE Main', 'JEE Advanced', 'CBSE'],
        subjects: ['Physics'],
        hourly_rate_usd: 600,
        average_rating: 4.6,
        total_reviews: 94,
        total_sessions: 280,
        accepts_instant_booking: true,
        is_active: true,
        verification_status: 'verified',
        profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam'
      }
    ];

    return sampleTutors.find(t => t.id === id) || null;
  };

  const loadTutorAndUser = async () => {
    try {
      setLoading(true);
      const { data: { user: userData } } = await supabase.auth.getUser();

      // Try to fetch from database first
      let tutorData = await tutorAPI.getTutor(tutorId!);

      // If not found in database, try sample data
      if (!tutorData) {
        tutorData = getSampleTutorData(tutorId!);
      }

      setTutor(tutorData);
      setUser(userData);

      // Pre-select first subject if available
      if (tutorData?.subjects && tutorData.subjects.length > 0) {
        setSubject(tutorData.subjects[0]);
      }
    } catch (error) {
      console.error('Error loading tutor:', error);
      // Fallback to sample data on error
      const sampleTutor = getSampleTutorData(tutorId!);
      setTutor(sampleTutor);
      if (sampleTutor?.subjects && sampleTutor.subjects.length > 0) {
        setSubject(sampleTutor.subjects[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!tutor) return 0;
    return tutor.hourly_rate_usd * duration;
  };

  const handleBookingSuccess = () => {
    // Payment will redirect to success page
    // This is called before redirecting
    console.log('Booking initiated, redirecting to payment...');
  };

  const handleBookingError = (error: string) => {
    console.error('Booking error:', error);
    alert(`Booking failed: ${error}`);
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Check if booking is valid
  const isBookingValid = () => {
    return sessionDate && sessionTime && duration > 0 && subject;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Card className="max-w-md w-full text-center p-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Tutor Not Found</h1>
          <p className="text-neutral-600 mb-6">The tutor you're looking for doesn't exist.</p>
          <Button variant="primary" onClick={() => navigate('/tutors')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tutors
          </Button>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Card className="max-w-md w-full text-center p-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Please Sign In</h1>
          <p className="text-neutral-600 mb-6">You need to sign in to book a session.</p>
          <Button variant="primary" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  const totalAmount = calculateTotal();

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button variant="ghost" onClick={() => navigate('/tutors')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tutors
          </Button>
          <h1 className="text-3xl font-bold text-neutral-900">Book a Session</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tutor Info */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              {/* Tutor Avatar */}
              {tutor.profile_image_url ? (
                <img
                  src={tutor.profile_image_url}
                  alt={tutor.full_name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white text-6xl font-bold rounded-t-lg">
                  {tutor.full_name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="p-6">
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">{tutor.full_name}</h2>

                {/* Rating */}
                {tutor.average_rating && tutor.average_rating > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-warning-400 text-warning-400" />
                      <span className="font-semibold text-neutral-900">
                        {tutor.average_rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm text-neutral-600">
                      ({tutor.total_reviews} reviews)
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm">{tutor.country}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{tutor.teaching_experience_years} years experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm">{tutor.total_sessions || 0} sessions completed</span>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-neutral-600 mb-4">{tutor.bio}</p>

                {/* Subjects */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">Subjects</h3>
                  <div className="flex flex-wrap gap-2">
                    {tutor.subjects.map((subj) => (
                      <span
                        key={subj}
                        className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium"
                      >
                        {subj}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Specialization */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">Specialization</h3>
                  <div className="flex flex-wrap gap-2">
                    {tutor.specialization.map((spec) => (
                      <span
                        key={spec}
                        className="px-2 py-1 bg-secondary-50 text-secondary-700 rounded text-xs font-medium flex items-center gap-1"
                      >
                        <Award className="w-3 h-3" />
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Session Details</h2>

              <div className="space-y-6">
                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Session Date *
                    </label>
                    <Input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      min={getMinDate()}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Session Time *
                    </label>
                    <Input
                      type="time"
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Duration (hours) *
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={0.5}>0.5 hours (30 minutes)</option>
                    <option value={1}>1 hour</option>
                    <option value={1.5}>1.5 hours</option>
                    <option value={2}>2 hours</option>
                    <option value={2.5}>2.5 hours</option>
                    <option value={3}>3 hours</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Subject *
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a subject</option>
                    {tutor.subjects.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific topics or goals for this session?"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px]"
                  />
                </div>

                {/* Pricing Breakdown */}
                <div className="bg-neutral-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">Pricing</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-neutral-600">
                      <span>Hourly Rate:</span>
                      <span className="font-medium">₹{tutor.hourly_rate_usd.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Duration:</span>
                      <span className="font-medium">{duration} {duration === 1 ? 'hour' : 'hours'}</span>
                    </div>
                    <div className="border-t border-neutral-300 pt-3 flex justify-between">
                      <span className="text-lg font-bold text-neutral-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-primary-600">
                        ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-primary-900">
                    <p className="font-medium mb-1">Booking Information:</p>
                    <ul className="list-disc list-inside space-y-1 text-primary-800">
                      <li>Payment is required to confirm your booking</li>
                      <li>You'll receive a meeting link after payment confirmation</li>
                      <li>Cancellations must be made 24 hours in advance for a refund</li>
                      <li>Sessions are conducted via video call</li>
                    </ul>
                  </div>
                </div>

                {/* Payment Button - Multi Gateway */}
                <MultiGatewayPaymentButton
                  amount={totalAmount}
                  productInfo={`${subject} tutoring session with ${tutor.full_name} - ${duration} hour(s) on ${sessionDate}`}
                  userId={user.id}
                  firstName={user.user_metadata?.full_name?.split(' ')[0] || user.email}
                  email={user.email!}
                  phone={user.user_metadata?.phone || '0000000000'}
                  metadata={{
                    type: 'tutor_booking',
                    tutor_id: tutor.id,
                    tutor_name: tutor.full_name,
                    session_date: sessionDate,
                    session_time: sessionTime,
                    duration,
                    subject,
                    notes
                  }}
                  onSuccess={handleBookingSuccess}
                  onError={handleBookingError}
                  disabled={!isBookingValid()}
                  defaultGateway="test"
                  allowGatewaySelection={true}
                  className="mt-6"
                >
                  Proceed to Payment
                </MultiGatewayPaymentButton>

                {!isBookingValid() && (
                  <p className="text-sm text-error-600 text-center">
                    Please fill in all required fields to proceed
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorBooking;
