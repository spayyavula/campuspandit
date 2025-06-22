import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  Download,
  Upload,
  BookOpen,
  Clock,
  Award,
  Users,
  BarChart3
} from 'lucide-react';
import QuestionEditor from './QuestionEditor';

interface Question {
  id: string;
  title: string;
  content: string;
  questionType: 'mcq' | 'structured' | 'essay' | 'practical' | 'data_analysis';
  difficulty: 'easy' | 'medium' | 'hard';
  subject: 'physics' | 'math' | 'chemistry' | 'biology';
  board: 'cambridge' | 'ib' | 'cbse' | 'isc' | 'jee' | 'neet' | 'general';
  grade: string;
  topicTags: string[];
  marks: number;
  timeLimit: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  analytics?: {
    totalAttempts: number;
    correctAttempts: number;
    averageTime: number;
    difficultyRating: number;
  };
}

const QuestionManager: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    board: '',
    difficulty: '',
    questionType: '',
    isPublished: ''
  });
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockQuestions: Question[] = [
      {
        id: '1',
        title: 'Newton\'s Second Law Application',
        content: 'A 5 kg block is pulled by a force of 20 N at an angle of 30° above the horizontal. Calculate the acceleration if the coefficient of friction is 0.3.',
        questionType: 'mcq',
        difficulty: 'medium',
        subject: 'physics',
        board: 'jee',
        grade: 'Class 11',
        topicTags: ['mechanics', 'forces', 'friction'],
        marks: 4,
        timeLimit: 3,
        isPublished: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        analytics: {
          totalAttempts: 150,
          correctAttempts: 95,
          averageTime: 180,
          difficultyRating: 3.2
        }
      },
      {
        id: '2',
        title: 'Quadratic Equations - Discriminant',
        content: 'Find the nature of roots of the quadratic equation 2x² - 5x + 3 = 0 using the discriminant method.',
        questionType: 'structured',
        difficulty: 'easy',
        subject: 'math',
        board: 'cbse',
        grade: 'Class 10',
        topicTags: ['algebra', 'quadratic equations', 'discriminant'],
        marks: 3,
        timeLimit: 2,
        isPublished: true,
        createdAt: '2024-01-14T14:30:00Z',
        updatedAt: '2024-01-14T14:30:00Z',
        analytics: {
          totalAttempts: 200,
          correctAttempts: 170,
          averageTime: 120,
          difficultyRating: 2.1
        }
      },
      {
        id: '3',
        title: 'Organic Chemistry - Nomenclature',
        content: 'Name the following organic compound and identify its functional groups: CH₃-CH₂-CH(OH)-CH₂-COOH',
        questionType: 'essay',
        difficulty: 'hard',
        subject: 'chemistry',
        board: 'ib',
        grade: 'DP2',
        topicTags: ['organic chemistry', 'nomenclature', 'functional groups'],
        marks: 6,
        timeLimit: 5,
        isPublished: false,
        createdAt: '2024-01-13T09:15:00Z',
        updatedAt: '2024-01-13T09:15:00Z',
        analytics: {
          totalAttempts: 45,
          correctAttempts: 20,
          averageTime: 300,
          difficultyRating: 4.1
        }
      }
    ];
    setQuestions(mockQuestions);
    setFilteredQuestions(mockQuestions);
  }, []);

  // Filter questions based on search and filters
  useEffect(() => {
    let filtered = questions.filter(question => {
      const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.topicTags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSubject = !filters.subject || question.subject === filters.subject;
      const matchesBoard = !filters.board || question.board === filters.board;
      const matchesDifficulty = !filters.difficulty || question.difficulty === filters.difficulty;
      const matchesType = !filters.questionType || question.questionType === filters.questionType;
      const matchesPublished = !filters.isPublished || 
                              (filters.isPublished === 'published' && question.isPublished) ||
                              (filters.isPublished === 'draft' && !question.isPublished);

      return matchesSearch && matchesSubject && matchesBoard && matchesDifficulty && matchesType && matchesPublished;
    });

    setFilteredQuestions(filtered);
  }, [questions, searchTerm, filters]);

  const handleCreateQuestion = () => {
    setSelectedQuestion(null);
    setCurrentView('create');
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setCurrentView('edit');
  };

  const handleSaveQuestion = async (questionData: any) => {
    setLoading(true);
    try {
      if (selectedQuestion) {
        // Update existing question
        const updatedQuestions = questions.map(q => 
          q.id === selectedQuestion.id 
            ? { ...q, ...questionData, updatedAt: new Date().toISOString() }
            : q
        );
        setQuestions(updatedQuestions);
      } else {
        // Create new question
        const newQuestion: Question = {
          ...questionData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          analytics: {
            totalAttempts: 0,
            correctAttempts: 0,
            averageTime: 0,
            difficultyRating: 0
          }
        };
        setQuestions(prev => [newQuestion, ...prev]);
      }
      setCurrentView('list');
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    }
  };

  const handleDuplicateQuestion = (question: Question) => {
    const duplicatedQuestion: Question = {
      ...question,
      id: Date.now().toString(),
      title: `${question.title} (Copy)`,
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      analytics: {
        totalAttempts: 0,
        correctAttempts: 0,
        averageTime: 0,
        difficultyRating: 0
      }
    };
    setQuestions(prev => [duplicatedQuestion, ...prev]);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case 'physics': return '⚛️';
      case 'math': return '📐';
      case 'chemistry': return '🧪';
      case 'biology': return '🧬';
      default: return '📚';
    }
  };

  if (currentView === 'create' || currentView === 'edit') {
    return (
      <QuestionEditor
        initialData={selectedQuestion || undefined}
        onSave={handleSaveQuestion}
        onCancel={() => setCurrentView('list')}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-gray-600 mt-1">Create, manage, and organize your educational content</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={handleCreateQuestion}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>Create Question</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-3xl font-bold text-gray-900">{questions.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-3xl font-bold text-gray-900">
                {questions.filter(q => q.isPublished).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Attempts</p>
              <p className="text-3xl font-bold text-gray-900">
                {questions.reduce((sum, q) => sum + (q.analytics?.totalAttempts || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Success Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(
                  questions.reduce((sum, q) => {
                    const rate = q.analytics?.totalAttempts 
                      ? (q.analytics.correctAttempts / q.analytics.totalAttempts) * 100 
                      : 0;
                    return sum + rate;
                  }, 0) / questions.length
                )}%
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search questions by title, content, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={filters.subject}
              onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Subjects</option>
              <option value="physics">Physics</option>
              <option value="math">Mathematics</option>
              <option value="chemistry">Chemistry</option>
              <option value="biology">Biology</option>
            </select>

            <select
              value={filters.board}
              onChange={(e) => setFilters(prev => ({ ...prev, board: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Boards</option>
              <option value="general">General</option>
              <option value="cambridge">Cambridge</option>
              <option value="ib">IB</option>
              <option value="cbse">CBSE</option>
              <option value="isc">ISC</option>
              <option value="jee">JEE</option>
              <option value="neet">NEET</option>
            </select>

            <select
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={filters.isPublished}
              onChange={(e) => setFilters(prev => ({ ...prev, isPublished: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((question) => (
          <div key={question.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">{getSubjectIcon(question.subject)}</span>
                  <h3 className="text-xl font-semibold text-gray-900">{question.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                    {question.difficulty}
                  </span>
                  {question.isPublished ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Published
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      Draft
                    </span>
                  )}
                </div>

                <p className="text-gray-600 mb-3 line-clamp-2">{question.content}</p>

                <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                  <span className="flex items-center space-x-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{question.subject} • {question.board}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Award className="w-4 h-4" />
                    <span>{question.marks} marks</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{question.timeLimit} min</span>
                  </span>
                  {question.analytics && (
                    <span className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{question.analytics.totalAttempts} attempts</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {question.topicTags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleEditQuestion(question)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Question"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDuplicateQuestion(question)}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Duplicate Question"
                >
                  <Copy className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {question.analytics && question.analytics.totalAttempts > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{question.analytics.totalAttempts}</p>
                    <p className="text-xs text-gray-600">Total Attempts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round((question.analytics.correctAttempts / question.analytics.totalAttempts) * 100)}%
                    </p>
                    <p className="text-xs text-gray-600">Success Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(question.analytics.averageTime / 60)}m
                    </p>
                    <p className="text-xs text-gray-600">Avg. Time</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {question.analytics.difficultyRating.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-600">Difficulty Rating</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first question'
              }
            </p>
            {!searchTerm && !Object.values(filters).some(f => f) && (
              <button
                onClick={handleCreateQuestion}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                Create Your First Question
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionManager;