import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Zap, Trophy, Target, Users, Star, Crown, Medal } from 'lucide-react';
import { QuizBattle as QuizBattleType, BattleParticipant } from '../types';

interface QuizBattleProps {
  onBack: () => void;
}

const QuizBattle: React.FC<QuizBattleProps> = ({ onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userScore, setUserScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [battleComplete, setBattleComplete] = useState(false);
  
  // Mock battle data
  const battle: QuizBattleType = {
    id: 'battle-1',
    title: 'Physics Quick Battle',
    subject: 'physics',
    participants: [
      { id: 'p1', name: 'You', avatar: '👨‍🎓', score: 0, isBot: false, timeRemaining: 30 },
      { id: 'p2', name: 'Einstein Bot', avatar: '🧠', score: 0, isBot: true, timeRemaining: 30 }
    ],
    questions: [
      {
        id: 'q1',
        question: 'What is the acceleration due to gravity on Earth?',
        options: ['5.6 m/s²', '7.8 m/s²', '9.8 m/s²', '11.2 m/s²'],
        correctAnswer: 2,
        points: 10,
        timeLimit: 30,
        difficulty: 'easy'
      },
      {
        id: 'q2',
        question: 'Which of these is NOT a vector quantity?',
        options: ['Velocity', 'Force', 'Displacement', 'Temperature'],
        correctAnswer: 3,
        points: 10,
        timeLimit: 30,
        difficulty: 'medium'
      }
    ],
    status: 'active',
    startTime: new Date(),
    duration: 300
  };
  
  const [participants, setParticipants] = useState<BattleParticipant[]>(battle.participants);
  const [recentAnswers, setRecentAnswers] = useState<Array<{
    player: string;
    correct: boolean;
    points: number;
    time: string;
  }>>([]);

  const currentQuestion = battle.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === battle.questions.length - 1;
  const userParticipant = participants.find(p => !p.isBot);
  const botParticipant = participants.find(p => p.isBot);

  useEffect(() => {
    if (timeRemaining > 0 && !battleComplete) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
        
        // Simulate bot answering
        if (botParticipant && timeRemaining <= Math.random() * 20 + 5) {
          const botAnswer = Math.random() < 0.8 ? currentQuestion.correctAnswer : Math.floor(Math.random() * 4);
          setBotAnswer(botAnswer);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleNextQuestion();
    }
  }, [timeRemaining, battleComplete]);

  const setBotAnswer = (answer: number) => {
    setParticipants(prev => prev.map(p => 
      p.isBot ? { ...p, currentAnswer: answer } : p
    ));
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    let newUserScore = userScore;
    let newBotScore = botParticipant?.score || 0;

    // Calculate user score
    if (selectedAnswer === currentQuestion.correctAnswer) {
      const points = currentQuestion.points + (timeRemaining > 20 ? 25 : timeRemaining > 10 ? 15 : 5);
      newUserScore += points;
      setRecentAnswers(prev => [{
        player: 'You',
        correct: true,
        points: points,
        time: 'Just now'
      }, ...prev.slice(0, 4)]);
    } else if (selectedAnswer !== null) {
      setRecentAnswers(prev => [{
        player: 'You',
        correct: false,
        points: 0,
        time: 'Just now'
      }, ...prev.slice(0, 4)]);
    }

    // Calculate bot score
    if (botParticipant?.currentAnswer === currentQuestion.correctAnswer) {
      const botPoints = currentQuestion.points + Math.floor(Math.random() * 20) + 5;
      newBotScore += botPoints;
      setRecentAnswers(prev => [{
        player: botParticipant.name,
        correct: true,
        points: botPoints,
        time: 'Just now'
      }, ...prev.slice(0, 4)]);
    } else if (botParticipant?.currentAnswer !== undefined) {
      setRecentAnswers(prev => [{
        player: botParticipant.name,
        correct: false,
        points: 0,
        time: 'Just now'
      }, ...prev.slice(0, 4)]);
    }

    setUserScore(newUserScore);
    
    // Update participants
    setParticipants(prev => prev.map(p => ({
      ...p,
      score: p.isBot ? newBotScore : newUserScore,
      currentAnswer: undefined
    })));

    if (isLastQuestion) {
      setBattleComplete(true);
      // Handle completion
      console.log('Battle completed with score:', userScore);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTimeRemaining(30);
    }
  };

  if (battleComplete) {
    const winner = userScore > (botParticipant?.score || 0) ? userParticipant : botParticipant;
    const isUserWinner = winner && !winner.isBot;
    const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className={`p-8 text-center ${isUserWinner ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-pink-600'}`}>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              {isUserWinner ? (
                <Crown className="w-10 h-10 text-white" />
              ) : (
                <Medal className="w-10 h-10 text-white" />
              )}
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">
              {isUserWinner ? 'Victory! 🎉' : 'Good Fight! 💪'}
            </h2>
            <p className="text-white text-lg opacity-90">
              {isUserWinner ? 'You defeated the bot!' : `${botParticipant?.name} wins this round!`}
            </p>
          </div>

          {/* Final Leaderboard */}
          <div className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Final Leaderboard</h3>
            <div className="space-y-4 mb-8">
              {sortedParticipants.map((participant, index) => (
                <div key={participant.id} className={`flex items-center justify-between p-6 rounded-xl border-2 ${
                  index === 0 ? 'border-yellow-300 bg-yellow-50' :
                  participant.id === userParticipant?.id ? 'border-blue-300 bg-blue-50' :
                  'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      'bg-orange-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="text-3xl">{participant.avatar}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-xl text-gray-900">{participant.name}</h3>
                        {participant.isBot && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">BOT</span>
                        )}
                        {index === 0 && <Crown className="w-5 h-5 text-yellow-500" />}
                      </div>
                      <p className="text-gray-600">
                        {index === 0 ? '🏆 Champion' : index === 1 ? '🥈 Runner-up' : '🥉 Good effort'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{participant.score}</div>
                    <div className="text-sm text-gray-600">points</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Battle Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-200">
                <Target className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900">{userScore}</div>
                <div className="text-sm text-gray-600">Your Final Score</div>
              </div>
              <div className="bg-green-50 rounded-xl p-6 text-center border border-green-200">
                <Zap className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900">
                  {recentAnswers.filter(a => a.player === 'You' && a.correct).length}
                </div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-6 text-center border border-purple-200">
                <Trophy className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900">
                  +{isUserWinner ? 100 : 50}
                </div>
                <div className="text-sm text-gray-600">Bonus Points</div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={onBack}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl py-4 hover:opacity-90 transition-opacity font-medium text-lg shadow-lg"
              >
                Back to Gaming Arena 🎮
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Gaming Arena
        </button>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{battle.title}</h1>
              <p className="text-gray-600">Question {currentQuestionIndex + 1} of {battle.questions.length}</p>
            </div>
            
            <div className="text-right">
              <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-bold text-xl">{timeRemaining}s</span>
              </div>
              <div className="text-sm text-gray-500">Time remaining</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Question Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${
                  currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800 border-green-200' :
                  currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                  'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {currentQuestion.difficulty} • {currentQuestion.points} points
                </span>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Bonus for speed!</span>
                </div>
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">{currentQuestion.question}</h2>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedAnswer === index
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-bold text-lg mr-3">{String.fromCharCode(65 + index)}.</span> 
                    <span className="text-lg">{option}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Answer quickly to earn bonus points! ⚡
              </div>
              
              <button
                onClick={handleNextQuestion}
                disabled={selectedAnswer === null}
                className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-medium text-lg shadow-lg"
              >
                {isLastQuestion ? 'Finish Battle 🏁' : 'Submit Answer ➡️'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Battle Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Live Leaderboard */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-bold text-white">Live Battle</h3>
                </div>
                <div className="flex items-center space-x-1 text-white">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">LIVE</span>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                {sortedParticipants.map((participant, index) => (
                  <div key={participant.id} className={`p-3 rounded-xl border-2 transition-all ${
                    participant.id === userParticipant?.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' : 'bg-gray-400 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-lg">{participant.avatar}</span>
                        <div>
                          <div className="flex items-center space-x-1">
                            <span className={`font-medium text-sm ${
                              participant.id === userParticipant?.id ? 'text-blue-600' : 'text-gray-900'
                            }`}>
                              {participant.name}
                            </span>
                            {participant.isBot && (
                              <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">BOT</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{participant.score}</div>
                        {participant.currentAnswer !== undefined && (
                          <div className="text-xs text-green-600 flex items-center">
                            <Zap className="w-3 h-3 mr-1" />
                            Answered!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Answers Feed */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-teal-600 p-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-white" />
                <h3 className="text-lg font-bold text-white">Recent Answers</h3>
              </div>
            </div>
            
            <div className="p-4 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {recentAnswers.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Answers will appear here</p>
                  </div>
                ) : (
                  recentAnswers.map((answer, index) => (
                    <div key={index} className={`flex items-center justify-between p-2 rounded-lg ${
                      answer.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          answer.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {answer.correct ? '✓' : '✗'}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">{answer.player}</div>
                          <div className="text-xs text-gray-500">{answer.time}</div>
                        </div>
                      </div>
                      <div className={`font-bold text-sm ${
                        answer.correct ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {answer.correct ? `+${answer.points}` : '0'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizBattle;