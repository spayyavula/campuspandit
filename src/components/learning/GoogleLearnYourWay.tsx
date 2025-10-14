import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, ArrowLeft, ExternalLink, PlayCircle, CheckCircle,
  TrendingUp, Clock, Target, Award, BarChart3, BookMarked, Zap
} from 'lucide-react';

interface GoogleLearnYourWayProps {
  studentId: string;
}

interface LearningModule {
  id: string;
  subject: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  topics: string[];
}

export const GoogleLearnYourWay: React.FC<GoogleLearnYourWayProps> = ({ studentId }) => {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<string>('physics');

  // Sample learning modules (in production, this would come from an API)
  const learningModules: Record<string, LearningModule[]> = {
    physics: [
      {
        id: 'physics-mechanics-1',
        subject: 'Physics',
        title: 'Introduction to Motion',
        description: 'Master the fundamentals of motion, displacement, velocity, and acceleration',
        duration: '45 minutes',
        difficulty: 'Beginner',
        topics: ['Distance & Displacement', 'Speed & Velocity', 'Acceleration', 'Motion Graphs']
      },
      {
        id: 'physics-mechanics-2',
        subject: 'Physics',
        title: 'Equations of Motion',
        description: 'Learn to solve problems using the three fundamental equations of motion',
        duration: '60 minutes',
        difficulty: 'Intermediate',
        topics: ['v = u + at', 's = ut + ½at²', 'v² = u² + 2as', 'Problem Solving']
      },
      {
        id: 'physics-forces',
        subject: 'Physics',
        title: 'Forces and Newton\'s Laws',
        description: 'Understand forces, free body diagrams, and Newton\'s three laws',
        duration: '75 minutes',
        difficulty: 'Intermediate',
        topics: ['Types of Forces', 'Free Body Diagrams', 'Newton\'s Laws', 'Applications']
      },
      {
        id: 'physics-energy',
        subject: 'Physics',
        title: 'Work, Energy & Power',
        description: 'Explore energy conservation, work-energy theorem, and power',
        duration: '60 minutes',
        difficulty: 'Advanced',
        topics: ['Work Done', 'Kinetic Energy', 'Potential Energy', 'Conservation of Energy']
      }
    ],
    mathematics: [
      {
        id: 'math-limits',
        subject: 'Mathematics',
        title: 'Limits and Continuity',
        description: 'Introduction to limits, continuity, and their applications',
        duration: '50 minutes',
        difficulty: 'Beginner',
        topics: ['Definition of Limits', 'Limit Laws', 'Continuity', 'Types of Discontinuity']
      },
      {
        id: 'math-derivatives',
        subject: 'Mathematics',
        title: 'Derivatives',
        description: 'Master differentiation rules and their applications',
        duration: '70 minutes',
        difficulty: 'Intermediate',
        topics: ['Power Rule', 'Product Rule', 'Quotient Rule', 'Chain Rule']
      },
      {
        id: 'math-integration',
        subject: 'Mathematics',
        title: 'Integration Techniques',
        description: 'Learn various integration methods and applications',
        duration: '80 minutes',
        difficulty: 'Advanced',
        topics: ['Basic Integration', 'Substitution', 'By Parts', 'Definite Integrals']
      },
      {
        id: 'math-applications',
        subject: 'Mathematics',
        title: 'Applications of Calculus',
        description: 'Apply calculus to solve real-world problems',
        duration: '65 minutes',
        difficulty: 'Advanced',
        topics: ['Maxima & Minima', 'Area Under Curves', 'Volumes', 'Rate of Change']
      }
    ],
    chemistry: [
      {
        id: 'chem-atomic',
        subject: 'Chemistry',
        title: 'Atomic Structure',
        description: 'Understand atomic models, quantum numbers, and electronic configuration',
        duration: '55 minutes',
        difficulty: 'Beginner',
        topics: ['Atomic Models', 'Quantum Numbers', 'Electronic Configuration', 'Periodic Trends']
      },
      {
        id: 'chem-bonding',
        subject: 'Chemistry',
        title: 'Chemical Bonding',
        description: 'Learn about ionic, covalent, and metallic bonding',
        duration: '60 minutes',
        difficulty: 'Intermediate',
        topics: ['Ionic Bonding', 'Covalent Bonding', 'VSEPR Theory', 'Hybridization']
      },
      {
        id: 'chem-organic',
        subject: 'Chemistry',
        title: 'Organic Chemistry Basics',
        description: 'Introduction to organic compounds and nomenclature',
        duration: '70 minutes',
        difficulty: 'Intermediate',
        topics: ['Hydrocarbons', 'IUPAC Naming', 'Isomerism', 'Functional Groups']
      },
      {
        id: 'chem-reactions',
        subject: 'Chemistry',
        title: 'Organic Reactions',
        description: 'Master reaction mechanisms and name reactions',
        duration: '90 minutes',
        difficulty: 'Advanced',
        topics: ['Addition Reactions', 'Substitution', 'Elimination', 'Name Reactions']
      }
    ]
  };

  const subjects = [
    { id: 'physics', name: 'Physics', icon: '⚛️', color: 'blue' },
    { id: 'mathematics', name: 'Mathematics', icon: '📐', color: 'purple' },
    { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: 'green' }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-700 border-green-300';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Advanced': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/coach')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <BookMarked className="w-7 h-7 text-blue-600" />
                  Google Learn Your Way
                </h1>
                <p className="text-sm text-gray-600">Personalized learning paths for self-paced study</p>
              </div>
            </div>
            <a
              href="https://learnyourway.withgoogle.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              Visit Google Learn
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-4">Learn at Your Own Pace</h2>
            <p className="text-lg text-blue-100 mb-6">
              Google Learn Your Way provides free, interactive learning modules that complement your
              textbook study. Track progress, identify weak areas, and get personalized recommendations.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <PlayCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-semibold">Interactive</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <Target className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-semibold">Personalized</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-semibold">Track Progress</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <Award className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-semibold">Free Access</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">1. Select Your Topic</h4>
              <p className="text-sm text-gray-600">
                Choose from Physics, Math, or Chemistry modules aligned with your textbook
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">2. Study Independently</h4>
              <p className="text-sm text-gray-600">
                Work through interactive lessons at your own pace with instant feedback
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">3. Track & Improve</h4>
              <p className="text-sm text-gray-600">
                Monitor your progress and get help from tutors on challenging topics
              </p>
            </div>
          </div>
        </div>

        {/* Subject Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-3 overflow-x-auto">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                  selectedSubject === subject.id
                    ? `bg-${subject.color}-600 text-white shadow-md`
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span className="text-xl">{subject.icon}</span>
                {subject.name}
              </button>
            ))}
          </div>
        </div>

        {/* Learning Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {learningModules[selectedSubject]?.map((module) => (
            <div
              key={module.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{module.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(module.difficulty)}`}>
                  {module.difficulty}
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {module.duration}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Topics Covered:</p>
                <div className="flex flex-wrap gap-2">
                  {module.topics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="https://learnyourway.withgoogle.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  Start Learning
                </a>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <BookMarked className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-600" />
              For Students
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Personalized learning paths based on your weak areas</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Study at your own speed with unlimited access</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Visual progress tracking and skill assessments</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Free resources with mobile-friendly design</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              Combined with Tutoring
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Stay active between tutoring sessions</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Tutors can see where you're struggling</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Focus tutor sessions on specific weak areas</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Better outcomes with combined approach</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Study Routine */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Recommended Study Routine</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Morning Review (30 min)</h4>
                <p className="text-sm text-gray-600">Review yesterday's concepts on Google Learn</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Study Time (2 hours)</h4>
                <p className="text-sm text-gray-600">Read textbook chapter and take notes</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Afternoon Practice (1 hour)</h4>
                <p className="text-sm text-gray-600">Complete Google Learn module with interactive exercises</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="w-12 h-12 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Evening Problems (1 hour)</h4>
                <p className="text-sm text-gray-600">Solve textbook problems and log progress</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                5
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Weekend Tutoring</h4>
                <p className="text-sm text-gray-600">Book tutor session to clarify doubts and weak areas</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Complete Learning System</h3>
          <p className="text-lg text-purple-100 mb-6 max-w-2xl mx-auto">
            Combine textbook study, Google Learn modules, NotebookLM notes, and expert tutoring
            for the best exam preparation experience.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://learnyourway.withgoogle.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold flex items-center gap-2"
            >
              Start Learning
              <ExternalLink className="w-5 h-5" />
            </a>
            <Link
              to="/notebooklm"
              className="px-8 py-4 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors font-semibold"
            >
              NotebookLM Guide
            </Link>
            <Link
              to="/tutors"
              className="px-8 py-4 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors font-semibold"
            >
              Find a Tutor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleLearnYourWay;
