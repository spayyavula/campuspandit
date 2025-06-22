import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, Target, TrendingUp, Award, ArrowLeft } from 'lucide-react';

interface Question {
  id: string;
  subject: 'physics' | 'chemistry' | 'mathematics';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  timeSpent?: number;
  userAnswer?: number;
}

interface JEEMainMockTestProps {
  onBack: () => void;
  onComplete: (score: number, analysis: any) => void;
}

const JEEMainMockTest: React.FC<JEEMainMockTestProps> = ({ onBack, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(10800); // 3 hours in seconds
  const [answers, setAnswers] = useState<{[key: number]: number}>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Sample JEE Main questions
  const questions: Question[] = [
    {
      id: 'jee-mock-1',
      subject: 'physics',
      question: 'A particle is projected horizontally from a height of 45 m with initial velocity 20 m/s. Find the time of flight. (g = 10 m/s²)',
      options: ['2 s', '3 s', '4 s', '5 s'],
      correctAnswer: 1,
      explanation: 'For horizontal projection: t = √(2h/g) = √(2×45/10) = √9 = 3 seconds',
      difficulty: 'medium',
      marks: 4
    },
    {
      id: 'jee-mock-2',
      subject: 'chemistry',
      question: 'Which of the following has the highest first ionization energy?',
      options: ['Li', 'Be', 'B', 'C'],
      correctAnswer: 3,
      explanation: 'Ionization energy increases across a period. Carbon has the highest first ionization energy among the given options.',
      difficulty: 'easy',
      marks: 4
    },
    {
      id: 'jee-mock-3',
      subject: 'mathematics',
      question: 'If log₂(x-1) + log₂(x+1) = 3, then x equals:',
      options: ['3', '±3', '√10', '±√10'],
      correctAnswer: 0,
      explanation: 'log₂(x-1) + log₂(x+1) = log₂[(x-1)(x+1)] = log₂(x²-1) = 3. So x²-1 = 8, x² = 9, x = ±3. Since x > 1 (for log to be defined), x = 3.',
      difficulty: 'medium',
      marks: 4
    },
    // Add more questions...
  ];

  useEffect(() => {
    if (timeRemaining > 0 && !isSubmitted) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleSubmit();
    }
  }, [timeRemaining, isSubmitted]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: answerIndex
    }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowResults(true);
    
    // Calculate score and analysis
    let correctAnswers = 0;
    let totalMarks = 0;
    const subjectWise = { physics: 0, chemistry: 0, mathematics: 0 };
    
    questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
        totalMarks += question.marks;
        subjectWise[question.subject] += question.marks;
      } else if (answers[index] !== undefined) {
        totalMarks -= 1; // Negative marking
      }
    });

    const analysis = {
      totalMarks,
      correctAnswers,
      totalQuestions: questions.length,
      subjectWise,
      timeSpent: 10800 - timeRemaining,
      accuracy: (correctAnswers / questions.length) * 100
    };

    onComplete(totalMarks, analysis);
  };

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'physics': return 'bg-blue-100 text-blue-800';
      case 'chemistry': return 'bg-green-100 text-green-800';
      case 'mathematics': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showResults) {
    const correctAnswers = questions.filter((q, index) => answers[index] === q.correctAnswer).length;
    const totalMarks = correctAnswers * 4 - (Object.keys(answers).length - correctAnswers);
    
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Mock Test Completed!</h2>
            <p className="text-gray-600">Here's your detailed performance analysis</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-200">
              <Target className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{totalMarks}</div>
              <div className="text-sm text-gray-600">Total Score</div>
            </div>
            <div className="bg-green-50 rounded-xl p-6 text-center border border-green-200">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{correctAnswers}/{questions.length}</div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-6 text-center border border-purple-200">
              <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{Math.round((correctAnswers/questions.length)*100)}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-semibold text-gray-900">Question Review</h3>
            {questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubjectColor(question.subject)}`}>
                      {question.subject}
                    </span>
                    <span className="text-sm text-gray-600">Q{index + 1}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {answers[index] === question.correctAnswer ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : answers[index] !== undefined ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <div className="w-5 h-5 bg-gray-300 rounded-full" />
                    )}
                  </div>
                </div>
                
                <p className="text-gray-900 mb-3">{question.question}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`p-2 rounded border text-sm ${
                        optionIndex === question.correctAnswer
                          ? 'bg-green-50 border-green-300 text-green-800'
                          : answers[index] === optionIndex
                          ? 'bg-red-50 border-red-300 text-red-800'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {String.fromCharCode(65 + optionIndex)}. {option}
                    </div>
                  ))}
                </div>
                
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Explanation:</strong> {question.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl py-3 hover:opacity-90 transition-opacity font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit Test
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">JEE Main Mock Test</h1>
              <p className="text-gray-600">Question {currentQuestion + 1} of {questions.length}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{formatTime(timeRemaining)}</div>
              <div className="text-sm text-gray-600">Time Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Object.keys(answers).length}</div>
              <div className="text-sm text-gray-600">Answered</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Question Panel */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubjectColor(currentQ.subject)}`}>
                {currentQ.subject.charAt(0).toUpperCase() + currentQ.subject.slice(1)}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Marks: {currentQ.marks}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  currentQ.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  currentQ.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentQ.difficulty}
                </span>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-6">{currentQ.question}</h2>

            <div className="space-y-3 mb-8">
              {currentQ.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    answers[currentQuestion] === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Submit Test
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-8">
            <h3 className="font-semibold text-gray-900 mb-4">Question Navigator</h3>
            
            <div className="grid grid-cols-5 gap-2 mb-6">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    index === currentQuestion
                      ? 'bg-blue-500 text-white'
                      : answers[index] !== undefined
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <span>Not Visited</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full mt-6 bg-red-500 text-white rounded-lg py-2 hover:bg-red-600 transition-colors"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JEEMainMockTest;