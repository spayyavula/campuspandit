import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Zap, Trophy, Target } from 'lucide-react';
import { QuizBattle as QuizBattleType, BattleParticipant } from '../types';

interface QuizBattleProps {
  battle: QuizBattleType;
  onBack: () => void;
  onComplete: (score: number) => void;
}

const QuizBattle: React.FC<QuizBattleProps> = ({ battle, onBack, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userScore, setUserScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [battleComplete, setBattleComplete] = useState(false);
  const [participants, setParticipants] = useState<BattleParticipant[]>(battle.participants);

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
      newUserScore += currentQuestion.points;
    }

    // Calculate bot score
    if (botParticipant?.currentAnswer === currentQuestion.correctAnswer) {
      newBotScore += currentQuestion.points;
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
      onComplete(newUserScore);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTimeRemaining(30);
    }
  };

  if (battleComplete) {
    const winner = userScore > (botParticipant?.score || 0) ? userParticipant : botParticipant;
    const isUserWinner = winner && !winner.isBot;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="mb-6">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isUserWinner ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {isUserWinner ? (
                <Trophy className="w-10 h-10 text-green-500" />
              ) : (
                <Target className="w-10 h-10 text-red-500" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isUserWinner ? 'Victory!' : 'Defeat!'}
            </h2>
            <p className="text-gray-600">
              {isUserWinner ? 'You defeated the bot!' : `${botParticipant?.name} wins this round!`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            {participants.map((participant) => (
              <div key={participant.id} className={`p-6 rounded-lg border-2 ${
                participant.score === Math.max(...participants.map(p => p.score))
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="text-3xl mb-2">{participant.avatar}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{participant.name}</h3>
                {participant.isBot && (
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mb-2">
                    BOT
                  </span>
                )}
                <div className="text-2xl font-bold text-gray-900">{participant.score}</div>
                <div className="text-sm text-gray-600">points</div>
              </div>
            ))}
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{battle.title}</h1>
            <p className="text-gray-600">Question {currentQuestionIndex + 1} of {battle.questions.length}</p>
          </div>
          
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span className="font-medium text-lg">{timeRemaining}s</span>
          </div>
        </div>
      </div>

      {/* Battle Status */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {participants.map((participant) => (
          <div key={participant.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{participant.avatar}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">{participant.name}</h3>
                  {participant.isBot && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">BOT</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Score: {participant.score}</span>
                  {participant.currentAnswer !== undefined && (
                    <span className="text-xs text-green-600 flex items-center">
                      <Zap className="w-3 h-3 mr-1" />
                      Answered!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
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
            Answer quickly to earn bonus points!
          </div>
          
          <button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isLastQuestion ? 'Finish Battle' : 'Submit Answer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizBattle;