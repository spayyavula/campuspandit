import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { 
  Plus, 
  Search, 
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
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import QuestionEditor from './QuestionEditor';
import LatexExamples from './LatexExamples';

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
  [key: string]: any; // allow dynamic access for import/export
}


const QuestionManager: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
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
  // const [loading, setLoading] = useState(true); // unused
  const [showLatexExamples, setShowLatexExamples] = useState(false);
  const [upsertLoading, setUpsertLoading] = useState(false);
  const [upsertResult, setUpsertResult] = useState<string | null>(null);
  const [showImportInfo, setShowImportInfo] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // State for question count
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [countError, setCountError] = useState<string | null>(null);

  // Function to fetch question count from Supabase
  const fetchQuestionCount = async () => {
    setCountLoading(true);
    setCountError(null);
    try {
      const { count, error } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });
      if (error) {
        setCountError(error.message);
        setQuestionCount(null);
      } else {
        setQuestionCount(count ?? 0);
      }
    } catch (err: any) {
      setCountError(err.message || 'Unknown error');
      setQuestionCount(null);
    } finally {
      setCountLoading(false);
    }
  };

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

  // Filter and sort questions based on search, filters, and sortConfig
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

    // Sorting logic
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        // Special case: sort by counter (row number)
        if (sortConfig.key === 'counter') {
          // Always sort by original order (or reverse)
          return sortConfig.direction === 'asc' ? 0 : 0; // No-op, but allows toggling
        }
        let aValue: any = a[sortConfig.key];
        let bValue: any = b[sortConfig.key];
        // For topicTags, use joined string
        if (sortConfig.key === 'topicTags') {
          aValue = aValue.join(';');
          bValue = bValue.join(';');
        }
        // For isPublished, convert to string
        if (sortConfig.key === 'isPublished') {
          aValue = aValue ? 'Published' : 'Draft';
          bValue = bValue ? 'Published' : 'Draft';
        }
        // For title, subject, board, difficulty, etc, compare as string
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
        // For numbers
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        // Fallback
        return 0;
      });
    }

    setFilteredQuestions(filtered);
  }, [questions, searchTerm, filters, sortConfig]);

  // Reset to first page when filters, search, or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortConfig]);

  // Helper for rendering sort icons
  const renderSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <span className="ml-1 text-gray-300">⇅</span>;
    return sortConfig.direction === 'asc' ? (
      <span className="ml-1 text-blue-500">▲</span>
    ) : (
      <span className="ml-1 text-blue-500">▼</span>
    );
  };

  // Handler for sorting
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        // Toggle direction
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleCreateQuestion = () => {
    setSelectedQuestion(null);
    setCurrentView('create');
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setCurrentView('edit');
  };

  const handleSaveQuestion = async (questionData: any) => {
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

  const handleShowLatexExamples = () => {
    setShowLatexExamples(true);
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
    // Map selectedQuestion to include options: [] if missing, to match QuestionData
    const questionData = selectedQuestion
      ? { ...selectedQuestion, options: (selectedQuestion as any).options || [] }
      : undefined;
    return (
      <QuestionEditor
        initialData={questionData}
        onSave={handleSaveQuestion}
        onCancel={() => setCurrentView('list')}
      />
    );
  }

  if (showLatexExamples) {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => setShowLatexExamples(false)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Question Manager
          </button>
        </div>
        <LatexExamples />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Boards (General)</h2>
          <p className="text-gray-600">Create, manage, and organize your educational content</p>
          {/* Question count fetcher */}
          <div className="mt-2 flex items-center gap-2">
            <button
              className="px-3 py-1 rounded bg-blue-100 text-blue-800 text-sm border border-blue-200 hover:bg-blue-200"
              onClick={fetchQuestionCount}
              disabled={countLoading}
            >
              {countLoading ? 'Checking...' : 'Check DB Question Count'}
            </button>
            {questionCount !== null && (
              <span className="text-sm text-gray-700">DB Count: <b>{questionCount}</b></span>
            )}
            {countError && (
              <span className="text-sm text-red-600">Error: {countError}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* CSV Import */}
          <button
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setShowImportInfo(true)}
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          {/* CSV Import Info Modal */}
          {showImportInfo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full relative">
                <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => { setShowImportInfo(false); setImportError(null); }}>&times;</button>
                <h3 className="text-xl font-bold mb-2">Import Questions (CSV)</h3>
                <p className="mb-2 text-gray-700">Please upload a CSV file with the following headers (columns):</p>
                <div className="overflow-x-auto mb-2">
                  <code className="block bg-gray-100 p-2 rounded text-xs whitespace-pre">id\ttitle\tcontent\tquestion_type\tdifficulty\tsubject\tboard\tgrade\ttopic_tags\tmarks\ttime_limit\tis_published\tcreated_at\tupdated_at</code>
                </div>
                <ul className="mb-2 text-sm text-gray-600 list-disc pl-5">
                  <li><b>topic_tags</b> should be separated by <b>;</b> (semicolon).</li>
                  <li><b>analytics</b> should be a JSON string (or leave blank).</li>
                  <li><b>is_published</b> should be <b>true</b> or <b>false</b>.</li>
                  <li>All columns are required, separated by a <b>tab</b> (not comma).</li>
                </ul>
                <div className="flex items-center gap-4 mt-4">
                  <label htmlFor="import-file" className="sr-only">Upload questions file</label>
                  <input
                    id="import-file"
                    type="file"
                    accept=".csv,.tsv,.txt"
                    title="Upload a tab-delimited file with the correct headers."
                    onChange={async (e) => {
                      setImportError(null);
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const text = await file.text();
                      const rows = text.split(/\r?\n/).filter(Boolean);
                      if (rows.length < 2) { setImportError('File must have a header and at least one row.'); return; }
                      const requiredHeaders = ['id','title','content','question_type','difficulty','subject','board','grade','topic_tags','marks','time_limit','is_published','created_at','updated_at'];
                      // Normalize headers to lower case and trim for robust matching
                      const headersRaw = rows[0].split('\t');
                      const headers = headersRaw.map(h => h.trim());
                      const headersLower = headers.map(h => h.toLowerCase());
                      const missing = requiredHeaders.filter(h => !headersLower.includes(h.toLowerCase()));
                      if (missing.length) {
                        setImportError('Missing columns: ' + missing.join(', ') + '\nFound columns: ' + headers.join(', '));
                        return;
                      }
                      // Parse rows and map snake_case <-> camelCase for local state
                      const data: Question[] = rows.slice(1).map(row => {
                        const values = row.split('\t');
                        const obj: Record<string, any> = {};
                        headers.forEach((h, i) => {
                          obj[h] = values[i]?.trim();
                        });
                        // Robust defaults for all fields
                        // id: fallback to random uuid if missing/empty
                        obj['id'] = obj['id'] && obj['id'].trim() ? obj['id'] : crypto.randomUUID();
                        // title/content: fallback to empty string
                        obj['title'] = obj['title'] && obj['title'].trim() ? obj['title'] : '';
                        obj['content'] = obj['content'] && obj['content'].trim() ? obj['content'] : '';
                        // question_type: fallback to 'mcq'
                        obj['question_type'] = obj['question_type'] && obj['question_type'].trim() ? obj['question_type'] : 'mcq';
                        // difficulty: fallback to 'medium' and validate against allowed enums
                        const allowedDifficulties = ['easy', 'medium', 'hard'];
                        if (obj['difficulty'] && allowedDifficulties.includes(obj['difficulty'].trim().toLowerCase())) {
                          obj['difficulty'] = obj['difficulty'].trim().toLowerCase();
                        } else {
                          obj['difficulty'] = 'medium';
                        }
                        // subject: fallback to 'physics' and validate against allowed enums
                        const allowedSubjects = ['physics', 'math', 'chemistry', 'biology'];
                        if (obj['subject'] && allowedSubjects.includes(obj['subject'].trim().toLowerCase())) {
                          obj['subject'] = obj['subject'].trim().toLowerCase();
                        } else {
                          obj['subject'] = 'physics';
                        }
                        // board: fallback to 'general' and validate against allowed enums
                        const allowedBoards = ['cambridge', 'ib', 'cbse', 'isc', 'jee', 'neet', 'general'];
                        if (obj['board'] && allowedBoards.includes(obj['board'].trim().toLowerCase())) {
                          obj['board'] = obj['board'].trim().toLowerCase();
                        } else {
                          obj['board'] = 'general';
                        }
                        // grade: fallback to 'Class 11'
                        obj['grade'] = obj['grade'] && obj['grade'].trim() ? obj['grade'] : 'Class 11';
                        // topic_tags: array of strings, fallback to []
                        if (obj['topic_tags'] && obj['topic_tags'].trim()) {
                          obj['topicTags'] = obj['topic_tags'].split(';').map((t: string) => t.trim()).filter(Boolean);
                        } else {
                          obj['topicTags'] = [];
                        }
                        // marks: fallback to 1
                        obj['marks'] = obj['marks'] && !isNaN(Number(obj['marks'])) ? Number(obj['marks']) : 1;
                        // time_limit: fallback to 1
                        obj['timeLimit'] = obj['time_limit'] && !isNaN(Number(obj['time_limit'])) ? Number(obj['time_limit']) : 1;
                        // is_published: fallback to false
                        obj['isPublished'] = obj['is_published'] === 'true';
                        // created_at, updated_at: fallback to now
                        const nowIso = new Date().toISOString();
                        obj['createdAt'] = obj['created_at'] && obj['created_at'].trim() ? obj['created_at'] : nowIso;
                        obj['updatedAt'] = obj['updated_at'] && obj['updated_at'].trim() ? obj['updated_at'] : nowIso;
                        // analytics: fallback to default analytics object
                        if (!obj['analytics'] || !obj['analytics'].trim()) {
                          obj['analytics'] = JSON.stringify({
                            totalAttempts: 0,
                            correctAttempts: 0,
                            averageTime: 0,
                            difficultyRating: 0
                          });
                        }
                        // Map to UI camelCase
                        obj['questionType'] = obj['question_type'];
                        return obj as Question;
                      });
                      setQuestions(data);
                      setFilteredQuestions(data);
                      setUpsertLoading(true);
                      setUpsertResult(null);
                      // Upsert to Supabase: map camelCase -> snake_case for all relevant columns
                      (async () => {
                        const upsertData = data.map(q => {
                          // Remove analytics from upsert data
                          const { isPublished, questionType, timeLimit, createdAt, updatedAt, topicTags, analytics, ...rest } = q;
                          return {
                            ...rest,
                            is_published: isPublished,
                            question_type: questionType,
                            time_limit: timeLimit,
                            created_at: createdAt,
                            updated_at: updatedAt,
                            topic_tags: (Array.isArray(topicTags) && topicTags.length > 0)
                              ? topicTags.join(';')
                              : null
                          };
                        });
                        const { error, data: upsertResultData } = await supabase.from('questions').upsert(upsertData, { onConflict: 'id' });
                        console.log('Supabase upsert result:', { error, upsertResultData });
                        setUpsertLoading(false);
                        if (error) {
                          setUpsertResult('Error uploading to database: ' + error.message);
                        } else {
                          setUpsertResult('Questions successfully uploaded to the database.');
                        }
                        setShowImportInfo(false);
                      })();
                    }}
                  />
                  <button
                    className="px-3 py-1 rounded bg-gray-200 text-sm"
                    onClick={() => {
                      // Download template
                      const headers = ['id','title','content','question_type','difficulty','subject','board','grade','topic_tags','marks','time_limit','is_published','created_at','updated_at'];
                      const tsv = headers.join('\t') + '\n';
                      const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'questions-template.tsv';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                  >Download Template</button>
                </div>
                {importError && <div className="text-red-600 mt-2">{importError}</div>}
                {upsertLoading && <div className="text-blue-600 mt-2">Uploading to database...</div>}
                {upsertResult && <div className={upsertResult.startsWith('Error') ? 'text-red-600 mt-2' : 'text-green-600 mt-2'}>{upsertResult}</div>}
              </div>
            </div>
          )}

          {/* TSV Export */}
          <button
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => {
              if (!questions.length) return;
              const headers = ['id','title','content','question_type','difficulty','subject','board','grade','topic_tags','marks','time_limit','is_published','created_at','updated_at','analytics'];
              const tsvRows = [headers.join('\t')];
              for (const q of questions) {
                const row = headers.map(h => {
                  if (h === 'is_published') return q.isPublished ? 'true' : 'false';
                  if (h === 'question_type') return q.questionType;
                  if (h === 'time_limit') return q.timeLimit;
                  if (h === 'created_at') return q.createdAt;
                  if (h === 'updated_at') return q.updatedAt;
                  if (h === 'topic_tags') return q.topicTags ? q.topicTags.join(';') : '';
                  const val = (q as any)[h];
                  if (Array.isArray(val)) return val.join(';');
                  if (typeof val === 'object' && val !== null) return JSON.stringify(val);
                  return String(val ?? '');
                });
                tsvRows.push(row.join('\t'));
              }
              const tsv = tsvRows.join('\n');
              const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'questions.tsv';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={handleShowLatexExamples}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="font-serif italic">∑</span>
            <span>LaTeX Examples</span>
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
            <label htmlFor="subject-select" className="sr-only">Subject</label>
            <select
              id="subject-select"
              title="Filter by subject"
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

            <label htmlFor="board-select" className="sr-only">Board</label>
            <select
              id="board-select"
              title="Filter by board"
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

            <label htmlFor="difficulty-select" className="sr-only">Difficulty</label>
            <select
              id="difficulty-select"
              title="Filter by difficulty"
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <label htmlFor="status-select" className="sr-only">Status</label>
            <select
              id="status-select"
              title="Filter by status"
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

      {/* Questions List - with sortable columns and pagination */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-sm border border-gray-200">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b">
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('counter')}>
                #
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('title')}>
                Title {renderSortIcon('title')}
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('difficulty')}>
                Difficulty {renderSortIcon('difficulty')}
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('subject')}>
                Subject {renderSortIcon('subject')}
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('board')}>
                Board {renderSortIcon('board')}
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('marks')}>
                Marks {renderSortIcon('marks')}
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('timeLimit')}>
                Time {renderSortIcon('timeLimit')}
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('isPublished')}>
                Status {renderSortIcon('isPublished')}
              </th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestions
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((question, idx) => (
                <tr key={question.id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-bold text-gray-400">{(currentPage - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getSubjectIcon(question.subject)}</span>
                      <span className="text-base font-semibold text-gray-900">{question.title}</span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1 line-clamp-2">{question.content}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>{question.difficulty}</span>
                  </td>
                  <td className="px-4 py-3">{question.subject}</td>
                  <td className="px-4 py-3">{question.board}</td>
                  <td className="px-4 py-3">{question.marks}</td>
                  <td className="px-4 py-3">{question.timeLimit} min</td>
                  <td className="px-4 py-3">
                    {question.isPublished ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Published</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {question.topicTags.map((tag, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
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
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {/* Pagination Controls */}
        {filteredQuestions.length > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 mt-4">
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm disabled:opacity-50"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                aria-label="First page"
              >
                ⏮
              </button>
              <button
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm disabled:opacity-50"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                ◀
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {Math.max(1, Math.ceil(filteredQuestions.length / pageSize))}
              </span>
              <button
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm disabled:opacity-50"
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredQuestions.length / pageSize), p + 1))}
                disabled={currentPage === Math.ceil(filteredQuestions.length / pageSize) || filteredQuestions.length === 0}
                aria-label="Next page"
              >
                ▶
              </button>
              <button
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm disabled:opacity-50"
                onClick={() => setCurrentPage(Math.ceil(filteredQuestions.length / pageSize))}
                disabled={currentPage === Math.ceil(filteredQuestions.length / pageSize) || filteredQuestions.length === 0}
                aria-label="Last page"
              >
                ⏭
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="page-size-select" className="text-sm text-gray-700">Rows per page:</label>
              <select
                id="page-size-select"
                className="px-2 py-1 border border-gray-300 rounded"
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[5, 10, 20, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || Object.values(filters).some(f => f)
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first question'}
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