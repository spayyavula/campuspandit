/**
 * AI-Powered Tutor Matching Wizard
 *
 * Interactive component that guides students through finding the perfect tutor
 * using AI-powered matching
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  findMatchingTutors,
  quickMatch,
  markTutorContacted,
  markSessionBooked,
  submitMatchFeedback,
  type MatchingRequest,
  type TutorMatch,
  type MatchingResponse,
} from '../../services/aiMatching';

// =====================================================
// Main Wizard Component
// =====================================================

export const TutorMatchingWizard: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<'preferences' | 'results' | 'feedback'>('preferences');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [preferences, setPreferences] = useState<Partial<MatchingRequest>>({
    subject: '',
    grade_level: '',
    learning_style: undefined,
    learning_pace: undefined,
    goals: [],
    budget_max: undefined,
    preferred_times: [],
    max_results: 5,
    include_ai_reasoning: true,
  });

  // Results state
  const [matches, setMatches] = useState<MatchingResponse | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<TutorMatch | null>(null);

  // =====================================================
  // Handlers
  // =====================================================

  const handleFindMatches = async () => {
    if (!preferences.subject) {
      setError('Please select a subject');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result: MatchingResponse;

      if (user) {
        // Authenticated user - use full matching
        result = await findMatchingTutors({
          student_id: user.id,
          subject: preferences.subject!,
          grade_level: preferences.grade_level,
          learning_style: preferences.learning_style,
          learning_pace: preferences.learning_pace,
          goals: preferences.goals,
          budget_max: preferences.budget_max,
          preferred_times: preferences.preferred_times,
          max_results: preferences.max_results,
          include_ai_reasoning: preferences.include_ai_reasoning,
        });
      } else {
        // Anonymous user - use quick match
        result = await quickMatch({
          subject: preferences.subject!,
          budget_max: preferences.budget_max,
          max_results: 3,
        });
      }

      setMatches(result);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find matches');
    } finally {
      setLoading(false);
    }
  };

  const handleContactTutor = async (match: TutorMatch, matchId: string) => {
    try {
      await markTutorContacted(matchId);
      setSelectedMatch(match);
      // Open contact modal or redirect to messaging
      window.location.href = `/messages?tutor_id=${match.tutor_id}`;
    } catch (err) {
      console.error('Error marking tutor as contacted:', err);
    }
  };

  const handleBookSession = async (match: TutorMatch, matchId: string) => {
    try {
      await markSessionBooked(matchId);
      // Redirect to booking page
      window.location.href = `/book-session?tutor_id=${match.tutor_id}`;
    } catch (err) {
      console.error('Error booking session:', err);
    }
  };

  // =====================================================
  // Render
  // =====================================================

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Find Your Perfect Tutor with AI</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {step === 'preferences' && (
        <PreferencesForm
          preferences={preferences}
          setPreferences={setPreferences}
          onSubmit={handleFindMatches}
          loading={loading}
        />
      )}

      {step === 'results' && matches && (
        <ResultsView
          matches={matches}
          onContactTutor={handleContactTutor}
          onBookSession={handleBookSession}
          onBack={() => setStep('preferences')}
        />
      )}
    </div>
  );
};

// =====================================================
// Preferences Form
// =====================================================

interface PreferencesFormProps {
  preferences: Partial<MatchingRequest>;
  setPreferences: React.Dispatch<React.SetStateAction<Partial<MatchingRequest>>>;
  onSubmit: () => void;
  loading: boolean;
}

const PreferencesForm: React.FC<PreferencesFormProps> = ({
  preferences,
  setPreferences,
  onSubmit,
  loading,
}) => {
  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'English', 'History', 'Computer Science', 'Spanish',
    'French', 'Economics', 'Psychology', 'SAT Prep', 'ACT Prep'
  ];

  const learningStyles = ['visual', 'auditory', 'kinesthetic', 'reading-writing'];
  const paces = ['slow', 'moderate', 'fast'];
  const times = ['morning', 'afternoon', 'evening'];
  const goalOptions = [
    'improve grades', 'prepare for exams', 'homework help',
    'enrichment', 'test prep', 'college prep'
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subject *
        </label>
        <select
          value={preferences.subject || ''}
          onChange={(e) => setPreferences({ ...preferences, subject: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a subject</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      {/* Grade Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Grade Level
        </label>
        <input
          type="text"
          value={preferences.grade_level || ''}
          onChange={(e) => setPreferences({ ...preferences, grade_level: e.target.value })}
          placeholder="e.g., 10, College, Adult"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Learning Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Learning Style
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {learningStyles.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setPreferences({ ...preferences, learning_style: style as any })}
              className={`px-4 py-2 rounded-lg border ${
                preferences.learning_style === style
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
              }`}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Learning Pace */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Learning Pace
        </label>
        <div className="grid grid-cols-3 gap-2">
          {paces.map((pace) => (
            <button
              key={pace}
              type="button"
              onClick={() => setPreferences({ ...preferences, learning_pace: pace as any })}
              className={`px-4 py-2 rounded-lg border ${
                preferences.learning_pace === pace
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
              }`}
            >
              {pace.charAt(0).toUpperCase() + pace.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Learning Goals (select all that apply)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {goalOptions.map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() => {
                const goals = preferences.goals || [];
                const newGoals = goals.includes(goal)
                  ? goals.filter((g) => g !== goal)
                  : [...goals, goal];
                setPreferences({ ...preferences, goals: newGoals });
              }}
              className={`px-4 py-2 rounded-lg border text-sm ${
                preferences.goals?.includes(goal)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maximum Budget (per hour)
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">$</span>
          <input
            type="number"
            value={preferences.budget_max || ''}
            onChange={(e) => setPreferences({ ...preferences, budget_max: Number(e.target.value) })}
            placeholder="50"
            min="0"
            step="5"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Preferred Times */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Times
        </label>
        <div className="grid grid-cols-3 gap-2">
          {times.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => {
                const currentTimes = preferences.preferred_times || [];
                const newTimes = currentTimes.includes(time as any)
                  ? currentTimes.filter((t) => t !== time)
                  : [...currentTimes, time as any];
                setPreferences({ ...preferences, preferred_times: newTimes });
              }}
              className={`px-4 py-2 rounded-lg border ${
                preferences.preferred_times?.includes(time as any)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
              }`}
            >
              {time.charAt(0).toUpperCase() + time.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={loading || !preferences.subject}
        className={`w-full py-3 rounded-lg font-medium ${
          loading || !preferences.subject
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Finding Your Perfect Match...
          </span>
        ) : (
          '🔍 Find My Perfect Tutor with AI'
        )}
      </button>

      <p className="text-sm text-gray-500 text-center">
        Our AI will analyze {preferences.subject ? `thousands of ${preferences.subject} tutors` : 'thousands of tutors'} to find your perfect match
      </p>
    </div>
  );
};

// =====================================================
// Results View
// =====================================================

interface ResultsViewProps {
  matches: MatchingResponse;
  onContactTutor: (match: TutorMatch, matchId: string) => void;
  onBookSession: (match: TutorMatch, matchId: string) => void;
  onBack: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({
  matches,
  onContactTutor,
  onBookSession,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      {/* AI Summary */}
      {matches.ai_summary && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <span>🤖</span>
            AI Recommendation Summary
          </h2>
          <p className="text-gray-700">{matches.ai_summary}</p>
        </div>
      )}

      {/* Matches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Your Top {matches.matches.length} Matches
          </h2>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Refine Search
          </button>
        </div>

        {matches.matches.map((match, index) => (
          <TutorMatchCard
            key={match.tutor_id}
            match={match}
            rank={index + 1}
            onContact={() => onContactTutor(match, 'match-id')} // TODO: Get actual match ID
            onBook={() => onBookSession(match, 'match-id')}
          />
        ))}
      </div>
    </div>
  );
};

// =====================================================
// Tutor Match Card
// =====================================================

interface TutorMatchCardProps {
  match: TutorMatch;
  rank: number;
  onContact: () => void;
  onBook: () => void;
}

const TutorMatchCard: React.FC<TutorMatchCardProps> = ({
  match,
  rank,
  onContact,
  onBook,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 hover:border-blue-500 transition-colors">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={match.avatar_url || `https://ui-avatars.com/api/?name=${match.name}`}
                alt={match.name}
                className="w-16 h-16 rounded-full"
              />
              <div className="absolute -top-2 -left-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                #{rank}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold">{match.name}</h3>
              <p className="text-gray-600">{match.headline}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-yellow-500">★</span>
                <span className="font-semibold">{match.avg_rating.toFixed(1)}</span>
                <span className="text-gray-500">({match.total_reviews} reviews)</span>
              </div>
            </div>
          </div>

          {/* Match Score */}
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">
              {Math.round(match.overall_match_percentage)}%
            </div>
            <div className="text-sm text-gray-500">Match Score</div>
            {match.ai_confidence && (
              <div className="text-xs text-gray-400 mt-1">
                AI Confidence: {Math.round(match.ai_confidence * 100)}%
              </div>
            )}
          </div>
        </div>

        {/* Match Strengths */}
        {match.match_strengths.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">
              ✨ Why This is a Great Match:
            </h4>
            <div className="flex flex-wrap gap-2">
              {match.match_strengths.map((strength, i) => (
                <span
                  key={i}
                  className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm border border-green-200"
                >
                  ✓ {strength}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Reasoning */}
        {match.ai_reasoning && (
          <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">
              🤖 AI Analysis:
            </h4>
            <p className="text-gray-700 text-sm">{match.ai_reasoning}</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold">${match.hourly_rate}</div>
            <div className="text-xs text-gray-500">per hour</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold">{match.years_experience}y</div>
            <div className="text-xs text-gray-500">experience</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold">{Math.round(match.student_success_rate * 100)}%</div>
            <div className="text-xs text-gray-500">success rate</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold">{match.response_time_minutes}m</div>
            <div className="text-xs text-gray-500">response time</div>
          </div>
        </div>

        {/* Detailed Scores (Collapsible) */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2"
        >
          {showDetails ? '▼' : '►'} View Detailed Match Scores
        </button>

        {showDetails && (
          <div className="space-y-2 mb-4">
            {Object.entries(match.match_score).map(([key, value]) => {
              if (key === 'overall') return null;
              const percentage = Math.round(value * 100);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize">{key.replace('_', ' ')}</span>
                    <span className="font-semibold">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onContact}
            className="flex-1 bg-white border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            💬 Contact Tutor
          </button>
          <button
            onClick={onBook}
            disabled={!match.can_book_now}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              match.can_book_now
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {match.can_book_now ? '📅 Book Session' : 'Unavailable'}
          </button>
        </div>

        {match.estimated_wait_time_hours && (
          <p className="text-xs text-gray-500 text-center mt-2">
            ⏱️ Estimated response: {match.estimated_wait_time_hours}h
          </p>
        )}
      </div>
    </div>
  );
};

export default TutorMatchingWizard;
