import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Star, Globe, DollarSign, BookOpen,
  Clock, Award, Heart, MapPin, Video, ChevronRight, Loader
} from 'lucide-react';
import { tutorAPI, subjectAPI, favoritesAPI, TutorProfile } from '../../utils/tutoringAPI';
import { useNavigate } from 'react-router-dom';

/**
 * FindTutors Component
 * Browse and search for tutors based on subjects, ratings, price, etc.
 */
export default function FindTutors() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<TutorProfile[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [minRating, setMinRating] = useState(0);
  const [maxRate, setMaxRate] = useState(5000);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const specializations = [
    'JEE Main', 'JEE Advanced', 'NEET', 'IIT',
    'CBSE', 'ICSE', 'ISC', 'IB', 'Cambridge IGCSE'
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tutors, searchTerm, selectedSubject, selectedCountry, minRating, maxRate, selectedSpecialization]);

  // Sample tutor data for development/demo
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [tutorsData, subjectsData, favoriteTutors] = await Promise.all([
        tutorAPI.getTutors(),
        subjectAPI.getSubjects(),
        favoritesAPI.getFavorites()
      ]);

      // Use sample data if database is empty
      setTutors(tutorsData.length > 0 ? tutorsData : sampleTutors);
      setSubjects(subjectsData);
      setFavorites(new Set(favoriteTutors.map(t => t.id!)));
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to sample data on error
      setTutors(sampleTutors);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tutors];

    // Search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.full_name.toLowerCase().includes(term) ||
          t.bio?.toLowerCase().includes(term) ||
          t.subjects.some(s => s.toLowerCase().includes(term))
      );
    }

    // Subject filter
    if (selectedSubject) {
      filtered = filtered.filter(t => t.subjects.includes(selectedSubject));
    }

    // Country filter
    if (selectedCountry) {
      filtered = filtered.filter(t => t.country === selectedCountry);
    }

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter(t => (t.average_rating || 0) >= minRating);
    }

    // Price filter
    filtered = filtered.filter(t => t.hourly_rate_usd <= maxRate);

    // Specialization filter
    if (selectedSpecialization.length > 0) {
      filtered = filtered.filter(t =>
        selectedSpecialization.some(spec => t.specialization.includes(spec))
      );
    }

    setFilteredTutors(filtered);
  };

  const toggleFavorite = async (tutorId: string) => {
    if (favorites.has(tutorId)) {
      await favoritesAPI.removeFavorite(tutorId);
      setFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(tutorId);
        return newSet;
      });
    } else {
      await favoritesAPI.addFavorite(tutorId);
      setFavorites(prev => new Set(prev).add(tutorId));
    }
  };

  const toggleSpecialization = (spec: string) => {
    if (selectedSpecialization.includes(spec)) {
      setSelectedSpecialization(prev => prev.filter(s => s !== spec));
    } else {
      setSelectedSpecialization(prev => [...prev, spec]);
    }
  };

  const uniqueCountries = Array.from(new Set(tutors.map(t => t.country))).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Find Your Perfect Tutor</h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-100">
            Expert tutors from around the world for Physics, Chemistry, Math & more
          </p>

          {/* Search Bar */}
          <div className="mt-6 sm:mt-8 max-w-3xl">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, subject, or expertise..."
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 sm:px-6 py-3 sm:py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-semibold text-sm sm:text-base"
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-80 flex-shrink-0`}>
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6 lg:sticky lg:top-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Subject</h3>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.name}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Country</h3>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Countries</option>
                  {uniqueCountries.map(country => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Minimum Rating</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold text-gray-700 w-12">
                    {minRating > 0 ? `${minRating}+` : 'Any'}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Max Price: ₹{maxRate}/hr
                </h3>
                <input
                  type="range"
                  min="200"
                  max="5000"
                  step="100"
                  value={maxRate}
                  onChange={(e) => setMaxRate(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Specialization</h3>
                <div className="space-y-2">
                  {specializations.map(spec => (
                    <label key={spec} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSpecialization.includes(spec)}
                        onChange={() => toggleSpecialization(spec)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSubject('');
                  setSelectedCountry('');
                  setMinRating(0);
                  setMaxRate(5000);
                  setSelectedSpecialization([]);
                }}
                className="w-full py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Tutors List */}
          <div className="flex-1 min-w-0">
            <div className="mb-4 sm:mb-6 flex items-center justify-between">
              <p className="text-sm sm:text-base text-gray-600">
                {filteredTutors.length} tutor{filteredTutors.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredTutors.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No tutors found</h3>
                <p className="text-gray-500">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredTutors.map(tutor => (
                  <div
                    key={tutor.id}
                    className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0 mx-auto sm:mx-0">
                        {tutor.profile_image_url && !imageErrors.has(tutor.id!) ? (
                          <img
                            src={tutor.profile_image_url}
                            alt={tutor.full_name}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
                            onError={() => {
                              setImageErrors(prev => new Set(prev).add(tutor.id!));
                            }}
                          />
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                            {tutor.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                          <div className="text-center sm:text-left">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{tutor.full_name}</h3>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Globe className="w-4 h-4" />
                                {tutor.country}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {tutor.teaching_experience_years} years exp.
                              </span>
                              {tutor.average_rating && tutor.average_rating > 0 && (
                                <span className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  {tutor.average_rating.toFixed(1)} ({tutor.total_reviews} reviews)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-center sm:text-right flex flex-col sm:flex-row items-center sm:items-start gap-2">
                            <div>
                              <p className="text-xl sm:text-2xl font-bold text-blue-600">
                                ₹{tutor.hourly_rate_usd}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500">per hour</p>
                            </div>
                            <button
                              onClick={() => toggleFavorite(tutor.id!)}
                              className={`p-2 rounded-full transition-colors ${
                                favorites.has(tutor.id!)
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-gray-100 text-gray-400 hover:text-red-600'
                              }`}
                            >
                              <Heart
                                className={`w-5 h-5 ${favorites.has(tutor.id!) ? 'fill-current' : ''}`}
                              />
                            </button>
                          </div>
                        </div>

                        <p className="text-sm sm:text-base text-gray-700 mb-3 line-clamp-2 text-center sm:text-left">{tutor.bio}</p>

                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
                          {tutor.subjects.slice(0, 4).map(subject => (
                            <span
                              key={subject}
                              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                            >
                              {subject}
                            </span>
                          ))}
                          {tutor.subjects.length > 4 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                              +{tutor.subjects.length - 4} more
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                          {tutor.specialization.slice(0, 3).map(spec => (
                            <span
                              key={spec}
                              className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium flex items-center gap-1"
                            >
                              <Award className="w-3 h-3" />
                              {spec}
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:flex-wrap items-center sm:items-start gap-2 sm:gap-3">
                          <button
                            onClick={() => navigate(`/tutor/profile/${tutor.id}`)}
                            className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                          >
                            View Profile
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          {tutor.accepts_instant_booking && (
                            <button
                              onClick={() => navigate(`/tutoring/tutor/${tutor.id}?instant=true`)}
                              className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
                            >
                              Instant Booking
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                          {tutor.video_intro_url && (
                            <button className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base">
                              <Video className="w-4 h-4" />
                              Intro Video
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
