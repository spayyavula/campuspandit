import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Users, Trophy, Zap, Target } from 'lucide-react';
import { Tournament, TournamentQuestion } from '../types';

interface TournamentViewProps {
  tournament: Tournament;
  onBack: () => void;
  onComplete: (score: number) => void;
}

const TournamentView: React.FC<TournamentViewProps> = ({ tournament, onBack, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [answers, setAnswers] = useState<{[key: string]: number}>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = tournament.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === tournament.questions.length - 1;

  useEffect(() => {
    if (timeRemaining > 0 && !showResults) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleNextQuestion();
    }
  }, [timeRemaining, showResults]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      const newAnswers = { ...answers, [currentQuestion.id]: selectedAnswer };
      setAnswers(newAnswers);

      if (selectedAnswer === currentQuestion.correctAnswer) {
        setScore(score + currentQuestion.points);
      }
    }

    if (isLastQuestion) {
      setShowResults(true);
      onComplete(score);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTimeRemaining(tournament.questions[currentQuestionIndex + 1]?.timeLimit || 30);
    }
  };

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'physics': return 'from-blue-500 to-indigo-600';
      case 'math': return 'from-green-500 to-emerald-600';
      case 'chemistry': return 'from-purple-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="mb-6">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Tournament Complete!</h2>
            <p className="text-gray-600">Great job on completing the {tournament.title}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{score}</div>
              <div className="text-sm text-gray-600">Final Score</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <Zap className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {Object.values(answers).filter((answer, index) => 
                  answer === tournament.questions[index]?.correctAnswer
                ).length}
              </div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <Trophy className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">#{Math.floor(Math.random() * 10) + 1}</div>
              <div className="text-sm text-gray-600">Your Rank</div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onBack}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg py-3 hover:opacity-90 transition-opacity"
            >
              Back to Gaming Arena
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Gaming Arena
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{tournament.title}</h1>
            <p className="text-gray-600">Question {currentQuestionIndex + 1} of {tournament.questions.length}</p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{timeRemaining}s</span>
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                Score: {score}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`bg-gradient-to-r ${getSubjectColor(tournament.subject)} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${((currentQuestionIndex + 1) / tournament.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentQuestion.difficulty} • {currentQuestion.points} points
            </span>
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">{currentQuestion.question}</h2>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Time remaining: {timeRemaining} seconds
          </div>
          
          <button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isLastQuestion ? 'Finish Tournament' : 'Next Question'}
          </button>
        </div>
      </div>

      {/* Live Leaderboard */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Leaderboard</h3>
        <div className="space-y-3">
          {[
            { name: 'Einstein Bot', avatar: '🧠', score: score + 50, isBot: true },
            { name: 'You', avatar: '👨‍🎓', score: score, isBot: false },
            { name: 'Newton Bot', avatar: '🍎', score: score - 30, isBot: true },
            { name: 'Sarah Johnson', avatar: '👩‍🔬', score: score - 80, isBot: false }
          ].map((participant, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                <span className="text-lg">{participant.avatar}</span>
                <span className="font-medium text-gray-900">{participant.name}</span>
                {participant.isBot && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">BOT</span>
                )}
              </div>
              <span className="font-bold text-gray-900">{participant.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TournamentView;