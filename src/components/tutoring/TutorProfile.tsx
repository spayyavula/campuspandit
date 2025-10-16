import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  MapPin,
  Clock,
  BookOpen,
  Award,
  Calendar,
  Globe,
  MessageSquare,
  Video,
  Heart,
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Languages,
  TrendingUp,
  Users
} from 'lucide-react';
import { tutorAPI, TutorProfile as TutorProfileType, favoritesAPI } from '../../utils/tutoringAPI';
import { supabase } from '../../utils/supabase';
import { Button, Card } from '../ui';

const TutorProfile: React.FC = () => {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState<TutorProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'availability'>('about');

  useEffect(() => {
    loadTutorProfile();
    checkFavoriteStatus();
    loadUser();
  }, [tutorId]);

  const loadUser = async () => {
    const { data: { user: userData } } = await supabase.auth.getUser();
    setUser(userData);
  };

  // Sample tutor data (same as FindTutors)
  const getSampleTutorData = (id: string): TutorProfileType | null => {
    const sampleTutors: TutorProfileType[] = [
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

  const loadTutorProfile = async () => {
    try {
      setLoading(true);
      // Try to fetch from database first
      const tutorData = await tutorAPI.getTutor(tutorId!);

      // If not found in database, try sample data
      if (!tutorData) {
        const sampleTutor = getSampleTutorData(tutorId!);
        setTutor(sampleTutor);
      } else {
        setTutor(tutorData);
      }
    } catch (error) {
      console.error('Error loading tutor profile:', error);
      // Fallback to sample data on error
      const sampleTutor = getSampleTutorData(tutorId!);
      setTutor(sampleTutor);
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const favorites = await favoritesAPI.getFavorites();
      setIsFavorite(favorites.some(fav => fav.id === tutorId));
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await favoritesAPI.removeFavorite(tutorId!);
        setIsFavorite(false);
      } else {
        await favoritesAPI.addFavorite(tutorId!);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleBookNow = () => {
    navigate(`/tutoring/tutor/${tutorId}`);
  };

  const handleInstantBooking = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Navigate to booking page with instant booking flag
    navigate(`/tutoring/tutor/${tutorId}?instant=true`);
  };

  const handleSendMessage = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Navigate to messages with tutor pre-selected
    navigate(`/messages?tutorId=${tutorId}`);
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

  const tabs = [
    { id: 'about', label: 'About', icon: BookOpen },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'availability', label: 'Availability', icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/tutors')}
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tutors
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {tutor.profile_image_url ? (
                <img
                  src={tutor.profile_image_url}
                  alt={tutor.full_name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white text-5xl font-bold border-4 border-white shadow-lg">
                  {tutor.full_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">{tutor.full_name}</h1>

                  {/* Rating */}
                  {tutor.average_rating && tutor.average_rating > 0 && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(tutor.average_rating!)
                                ? 'fill-warning-400 text-warning-400'
                                : 'text-neutral-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-neutral-900">
                        {tutor.average_rating.toFixed(1)}
                      </span>
                      <span className="text-neutral-600">
                        ({tutor.total_reviews} reviews)
                      </span>
                    </div>
                  )}

                  {/* Quick Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {tutor.country}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {tutor.teaching_experience_years} years exp.
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {tutor.total_sessions || 0} sessions
                    </div>
                    {tutor.verification_status === 'verified' && (
                      <div className="flex items-center gap-1 text-success-600">
                        <CheckCircle className="w-4 h-4" />
                        Verified
                      </div>
                    )}
                  </div>
                </div>

                {/* Favorite Button */}
                <button
                  onClick={toggleFavorite}
                  className={`p-3 rounded-full transition-colors ${
                    isFavorite
                      ? 'bg-error-100 text-error-600'
                      : 'bg-neutral-100 text-neutral-400 hover:text-error-600'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Pricing */}
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-6 h-6 text-success-600" />
                <span className="text-3xl font-bold text-neutral-900">
                  ₹{tutor.hourly_rate_usd}
                </span>
                <span className="text-neutral-600">per hour</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="lg" onClick={handleBookNow}>
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Session
                </Button>

                {tutor.accepts_instant_booking && (
                  <Button variant="success" size="lg" onClick={handleInstantBooking}>
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Instant Booking
                  </Button>
                )}

                <Button variant="outline" size="lg" onClick={handleSendMessage}>
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Message
                </Button>

                {tutor.video_intro_url && (
                  <Button variant="ghost" size="lg">
                    <Video className="w-5 h-5 mr-2" />
                    Watch Intro
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'about' && (
              <>
                {/* Bio */}
                <Card>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-4">About</h2>
                  <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                    {tutor.bio}
                  </p>
                </Card>

                {/* Subjects */}
                <Card>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-4">Subjects</h2>
                  <div className="flex flex-wrap gap-3">
                    {tutor.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-medium"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </Card>

                {/* Specialization */}
                <Card>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-4">Specialization</h2>
                  <div className="flex flex-wrap gap-3">
                    {tutor.specialization.map((spec) => (
                      <span
                        key={spec}
                        className="px-3 py-2 bg-secondary-50 text-secondary-700 rounded-lg font-medium flex items-center gap-2"
                      >
                        <Award className="w-4 h-4" />
                        {spec}
                      </span>
                    ))}
                  </div>
                </Card>

                {/* Languages */}
                {tutor.languages && tutor.languages.length > 0 && (
                  <Card>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <Languages className="w-6 h-6" />
                      Languages
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {tutor.languages.map((lang) => (
                        <span
                          key={lang}
                          className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}

            {activeTab === 'reviews' && (
              <Card>
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">Student Reviews</h2>
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-600">No reviews yet</p>
                  <p className="text-sm text-neutral-500 mt-2">
                    Be the first to book a session and leave a review!
                  </p>
                </div>
              </Card>
            )}

            {activeTab === 'availability' && (
              <Card>
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">Availability</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-lg">
                    <Globe className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-neutral-900">Timezone</p>
                      <p className="text-sm text-neutral-600">{tutor.timezone}</p>
                    </div>
                  </div>

                  {tutor.accepts_instant_booking && (
                    <div className="flex items-center gap-3 p-4 bg-success-50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-success-600" />
                      <div>
                        <p className="font-medium text-neutral-900">Instant Booking Available</p>
                        <p className="text-sm text-neutral-600">
                          Book immediately for upcoming time slots
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-600 mb-4">
                      View available time slots and book your session
                    </p>
                    <Button variant="primary" onClick={handleBookNow}>
                      Check Availability
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <h3 className="font-semibold text-neutral-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Response Time</span>
                  <span className="font-medium text-neutral-900">Within 1 hour</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Total Sessions</span>
                  <span className="font-medium text-neutral-900">{tutor.total_sessions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Experience</span>
                  <span className="font-medium text-neutral-900">
                    {tutor.teaching_experience_years} years
                  </span>
                </div>
                {tutor.average_rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Rating</span>
                    <span className="font-medium text-neutral-900 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-warning-400 text-warning-400" />
                      {tutor.average_rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Safety Note */}
            <Card className="bg-primary-50 border-primary-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-primary-900 mb-1">Verified Tutor</p>
                  <p className="text-primary-800">
                    This tutor has been verified by CampusPandit and has passed our background checks.
                  </p>
                </div>
              </div>
            </Card>

            {/* Share Profile */}
            <Card>
              <h3 className="font-semibold text-neutral-900 mb-4">Share Profile</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Share this tutor with your friends
              </p>
              <Button variant="outline" className="w-full">
                Copy Link
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorProfile;
