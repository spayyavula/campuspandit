import React, { useState, useRef, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  Upload, 
  Eye, 
  EyeOff, 
  Bold, 
  Italic, 
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Quote,
  Undo,
  Redo,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Subscript,
  Superscript
} from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

interface QuestionData {
  id?: string;
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
  options: QuestionOption[];
  isPublished: boolean;
}

interface QuestionEditorProps {
  initialData?: QuestionData;
  onSave: (data: QuestionData) => void;
  onCancel: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ initialData, onSave, onCancel }) => {
  const [questionData, setQuestionData] = useState<QuestionData>({
    title: '',
    content: '',
    questionType: 'mcq',
    difficulty: 'medium',
    subject: 'physics',
    board: 'general',
    grade: '',
    topicTags: [],
    marks: 1,
    timeLimit: 2,
    options: [
      { id: '1', text: '', isCorrect: false, explanation: '' },
      { id: '2', text: '', isCorrect: false, explanation: '' },
      { id: '3', text: '', isCorrect: false, explanation: '' },
      { id: '4', text: '', isCorrect: false, explanation: '' }
    ],
    isPublished: false,
    ...initialData
  });

  const [activeEditor, setActiveEditor] = useState<'content' | 'option' | 'explanation'>('content');
  const [activeOptionId, setActiveOptionId] = useState<string>('');
  const [newTag, setNewTag] = useState('');
  const [preview, setPreview] = useState(false);
  const [latexInput, setLatexInput] = useState('');
  const [showLatexModal, setShowLatexModal] = useState(false);
  const [latexType, setLatexType] = useState<'inline' | 'block'>('inline');

  const contentEditorRef = useRef<HTMLDivElement>(null);
  const optionEditorRef = useRef<HTMLDivElement>(null);
  const explanationEditorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize contenteditable divs
    if (contentEditorRef.current) {
      contentEditorRef.current.innerHTML = questionData.content;
    }
  }, []);

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateContent();
  };

  const updateContent = () => {
    if (activeEditor === 'content' && contentEditorRef.current) {
      setQuestionData(prev => ({
        ...prev,
        content: contentEditorRef.current!.innerHTML
      }));
    } else if (activeEditor === 'option' && optionEditorRef.current) {
      setQuestionData(prev => ({
        ...prev,
        options: prev.options.map(opt => 
          opt.id === activeOptionId 
            ? { ...opt, text: optionEditorRef.current!.innerHTML }
            : opt
        )
      }));
    } else if (activeEditor === 'explanation' && explanationEditorRef.current) {
      setQuestionData(prev => ({
        ...prev,
        options: prev.options.map(opt => 
          opt.id === activeOptionId 
            ? { ...opt, explanation: explanationEditorRef.current!.innerHTML }
            : opt
        )
      }));
    }
  };

  const insertLatex = () => {
    if (!latexInput.trim()) return;
    
    const latexHtml = latexType === 'inline' 
      ? `<span class="latex-inline" data-latex="${latexInput}">\\(${latexInput}\\)</span>`
      : `<div class="latex-block" data-latex="${latexInput}">\\[${latexInput}\\]</div>`;
    
    document.execCommand('insertHTML', false, latexHtml);
    updateContent();
    setLatexInput('');
    setShowLatexModal(false);
  };

  const openLatexModal = (type: 'inline' | 'block') => {
    setLatexType(type);
    setLatexInput('');
    setShowLatexModal(true);
  };

  const addOption = () => {
    const newOption: QuestionOption = {
      id: Date.now().toString(),
      text: '',
      isCorrect: false,
      explanation: ''
    };
    setQuestionData(prev => ({
      ...prev,
      options: [...prev.options, newOption]
    }));
  };

  const removeOption = (optionId: string) => {
    setQuestionData(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== optionId)
    }));
  };

  const toggleCorrectOption = (optionId: string) => {
    setQuestionData(prev => ({
      ...prev,
      options: prev.options.map(opt => ({
        ...opt,
        isCorrect: opt.id === optionId ? !opt.isCorrect : (questionData.questionType === 'mcq' ? false : opt.isCorrect)
      }))
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !questionData.topicTags.includes(newTag.trim())) {
      setQuestionData(prev => ({
        ...prev,
        topicTags: [...prev.topicTags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setQuestionData(prev => ({
      ...prev,
      topicTags: prev.topicTags.filter(t => t !== tag)
    }));
  };

  const handleSave = () => {
    // Validate required fields
    if (!questionData.title.trim() || !questionData.content.trim()) {
      alert('Please fill in the title and content');
      return;
    }

    if (questionData.questionType === 'mcq' && !questionData.options.some(opt => opt.isCorrect)) {
      alert('Please mark at least one option as correct');
      return;
    }

    onSave(questionData);
  };

  const ToolbarButton: React.FC<{ 
    onClick: () => void; 
    icon: React.ReactNode; 
    title: string;
    active?: boolean;
  }> = ({ onClick, icon, title, active }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        active 
          ? 'bg-blue-500 text-white' 
          : 'hover:bg-gray-100 text-gray-600'
      }`}
    >
      {icon}
    </button>
  );

  const RichTextToolbar = () => (
    <div className="flex items-center space-x-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-2">
        <ToolbarButton
          onClick={() => formatText('bold')}
          icon={<Bold className="w-4 h-4" />}
          title="Bold"
        />
        <ToolbarButton
          onClick={() => formatText('italic')}
          icon={<Italic className="w-4 h-4" />}
          title="Italic"
        />
        <ToolbarButton
          onClick={() => formatText('underline')}
          icon={<Underline className="w-4 h-4" />}
          title="Underline"
        />
      </div>

      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-2">
        <ToolbarButton
          onClick={() => formatText('subscript')}
          icon={<Subscript className="w-4 h-4" />}
          title="Subscript"
        />
        <ToolbarButton
          onClick={() => formatText('superscript')}
          icon={<Superscript className="w-4 h-4" />}
          title="Superscript"
        />
      </div>

      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-2">
        <ToolbarButton
          onClick={() => formatText('justifyLeft')}
          icon={<AlignLeft className="w-4 h-4" />}
          title="Align Left"
        />
        <ToolbarButton
          onClick={() => formatText('justifyCenter')}
          icon={<AlignCenter className="w-4 h-4" />}
          title="Align Center"
        />
        <ToolbarButton
          onClick={() => formatText('justifyRight')}
          icon={<AlignRight className="w-4 h-4" />}
          title="Align Right"
        />
      </div>

      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-2">
        <ToolbarButton
          onClick={() => openLatexModal('inline')}
          icon={<span className="font-serif italic">∑</span>}
          title="Insert Inline LaTeX"
        />
        <ToolbarButton
          onClick={() => openLatexModal('block')}
          icon={<span className="font-serif italic">∫</span>}
          title="Insert Block LaTeX"
        />
      </div>

      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-2">
        <ToolbarButton
          onClick={() => formatText('insertUnorderedList')}
          icon={<List className="w-4 h-4" />}
          title="Bullet List"
        />
        <ToolbarButton
          onClick={() => formatText('insertOrderedList')}
          icon={<ListOrdered className="w-4 h-4" />}
          title="Numbered List"
        />
      </div>

      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-2">
        <ToolbarButton
          onClick={() => {
            const url = prompt('Enter URL:');
            if (url) formatText('createLink', url);
          }}
          icon={<Link className="w-4 h-4" />}
          title="Insert Link"
        />
        <ToolbarButton
          onClick={() => {
            const url = prompt('Enter image URL:');
            if (url) formatText('insertImage', url);
          }}
          icon={<Image className="w-4 h-4" />}
          title="Insert Image"
        />
      </div>

      <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-2">
        <ToolbarButton
          onClick={() => formatText('formatBlock', 'blockquote')}
          icon={<Quote className="w-4 h-4" />}
          title="Quote"
        />
        <ToolbarButton
          onClick={() => formatText('formatBlock', 'pre')}
          icon={<Code className="w-4 h-4" />}
          title="Code Block"
        />
      </div>

      <div className="flex items-center space-x-1">
        <ToolbarButton
          onClick={() => formatText('undo')}
          icon={<Undo className="w-4 h-4" />}
          title="Undo"
        />
        <ToolbarButton
          onClick={() => formatText('redo')}
          icon={<Redo className="w-4 h-4" />}
          title="Redo"
        />
      </div>

      <div className="flex items-center space-x-1 ml-auto">
        <select
          onChange={(e) => formatText('fontSize', e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
          defaultValue="3"
        >
          <option value="1">8pt</option>
          <option value="2">10pt</option>
          <option value="3">12pt</option>
          <option value="4">14pt</option>
          <option value="5">18pt</option>
          <option value="6">24pt</option>
          <option value="7">36pt</option>
        </select>
        
        <input
          type="color"
          onChange={(e) => formatText('foreColor', e.target.value)}
          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          title="Text Color"
        />
      </div>
    </div>
  );

  // LaTeX Modal
  const LatexModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Insert {latexType === 'inline' ? 'Inline' : 'Block'} LaTeX
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LaTeX Expression
          </label>
          <textarea
            value={latexInput}
            onChange={(e) => setLatexInput(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            placeholder={latexType === 'inline' ? 'e.g., x^2 + y^2 = z^2' : 'e.g., \\frac{d}{dx}\\left( \\int_{0}^{x} f(u)\\,du\\right)=f(x)'}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview
          </label>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-16 flex items-center justify-center">
            {latexInput ? (
              latexType === 'inline' ? (
                <InlineMath math={latexInput} />
              ) : (
                <BlockMath math={latexInput} />
              )
            ) : (
              <span className="text-gray-400">LaTeX preview will appear here</span>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowLatexModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={insertLatex}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {initialData ? 'Edit Question' : 'Create New Question'}
          </h2>
          <p className="text-gray-600 mt-1">Design comprehensive questions with rich formatting</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPreview(!preview)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              preview 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{preview ? 'Edit' : 'Preview'}</span>
          </button>
          
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Save className="w-4 h-4" />
            <span>Save Question</span>
          </button>
        </div>
      </div>

      {/* LaTeX Modal */}
      {showLatexModal && <LatexModal />}

      {!preview ? (
        <div className="space-y-8">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Title *
              </label>
              <input
                type="text"
                value={questionData.title}
                onChange={(e) => setQuestionData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a descriptive title for your question"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <select
                  value={questionData.questionType}
                  onChange={(e) => setQuestionData(prev => ({ 
                    ...prev, 
                    questionType: e.target.value as any 
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="structured">Structured</option>
                  <option value="essay">Essay</option>
                  <option value="practical">Practical</option>
                  <option value="data_analysis">Data Analysis</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={questionData.difficulty}
                  onChange={(e) => setQuestionData(prev => ({ 
                    ...prev, 
                    difficulty: e.target.value as any 
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subject and Board Information */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={questionData.subject}
                onChange={(e) => setQuestionData(prev => ({ 
                  ...prev, 
                  subject: e.target.value as any 
                }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="physics">Physics</option>
                <option value="math">Mathematics</option>
                <option value="chemistry">Chemistry</option>
                <option value="biology">Biology</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Board
              </label>
              <select
                value={questionData.board}
                onChange={(e) => setQuestionData(prev => ({ 
                  ...prev, 
                  board: e.target.value as any 
                }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="general">General</option>
                <option value="cambridge">Cambridge</option>
                <option value="ib">IB</option>
                <option value="cbse">CBSE</option>
                <option value="isc">ISC</option>
                <option value="jee">JEE</option>
                <option value="neet">NEET</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade/Level
              </label>
              <input
                type="text"
                value={questionData.grade}
                onChange={(e) => setQuestionData(prev => ({ ...prev, grade: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Grade 12, AS Level"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marks & Time
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={questionData.marks}
                  onChange={(e) => setQuestionData(prev => ({ 
                    ...prev, 
                    marks: parseInt(e.target.value) || 1 
                  }))}
                  className="w-1/2 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Marks"
                  min="1"
                />
                <input
                  type="number"
                  value={questionData.timeLimit}
                  onChange={(e) => setQuestionData(prev => ({ 
                    ...prev, 
                    timeLimit: parseInt(e.target.value) || 2 
                  }))}
                  className="w-1/2 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minutes"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Topic Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {questionData.topicTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add topic tag (e.g., mechanics, algebra)"
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Question Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Content *
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <RichTextToolbar />
              <div
                ref={contentEditorRef}
                contentEditable
                onFocus={() => setActiveEditor('content')}
                onInput={updateContent}
                className="min-h-[200px] p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ minHeight: '200px' }}
                suppressContentEditableWarning={true}
              />
            </div>
          </div>

          {/* Options (for MCQ and similar types) */}
          {(questionData.questionType === 'mcq' || questionData.questionType === 'structured') && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Answer Options
                </label>
                <button
                  onClick={addOption}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Option</span>
                </button>
              </div>

              <div className="space-y-4">
                {questionData.options.map((option, index) => (
                  <div key={option.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <input
                          type={questionData.questionType === 'mcq' ? 'radio' : 'checkbox'}
                          name="correct-option"
                          checked={option.isCorrect}
                          onChange={() => toggleCorrectOption(option.id)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-600">Correct</span>
                      </div>
                      
                      {questionData.options.length > 2 && (
                        <button
                          onClick={() => removeOption(option.id)}
                          className="text-red-500 hover:text-red-700 transition-colors ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Option Text
                      </label>
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <div
                          ref={activeOptionId === option.id ? optionEditorRef : undefined}
                          contentEditable
                          onFocus={() => {
                            setActiveEditor('option');
                            setActiveOptionId(option.id);
                          }}
                          onInput={updateContent}
                          className="min-h-[60px] p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          dangerouslySetInnerHTML={{ __html: option.text }}
                          suppressContentEditableWarning={true}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Explanation (Optional)
                      </label>
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <div
                          ref={activeOptionId === option.id ? explanationEditorRef : undefined}
                          contentEditable
                          onFocus={() => {
                            setActiveEditor('explanation');
                            setActiveOptionId(option.id);
                          }}
                          onInput={updateContent}
                          className="min-h-[40px] p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          dangerouslySetInnerHTML={{ __html: option.explanation }}
                          suppressContentEditableWarning={true}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Publishing Options */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Publishing</h3>
              <p className="text-sm text-gray-600">
                Published questions will be visible to students and other educators
              </p>
            </div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={questionData.isPublished}
                onChange={(e) => setQuestionData(prev => ({ 
                  ...prev, 
                  isPublished: e.target.checked 
                }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Publish Question
              </span>
            </label>
          </div>
        </div>
      ) : (
        /* Preview Mode */
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  questionData.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  questionData.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {questionData.difficulty}
                </span>
                <span className="text-sm text-gray-600">
                  {questionData.subject} • {questionData.board} • {questionData.marks} marks • {questionData.timeLimit} min
                </span>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-4">{questionData.title}</h3>
            
            <div 
              className="prose max-w-none mb-4"
              dangerouslySetInnerHTML={{ __html: questionData.content }}
            >
              {/* LaTeX rendering will be handled by the HTML content */}
            </div>

            {questionData.topicTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {questionData.topicTags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {(questionData.questionType === 'mcq' || questionData.questionType === 'structured') && (
            <div className="space-y-3">
              {questionData.options.map((option, index) => (
                <div
                  key={option.id}
                  className={`p-4 border-2 rounded-lg ${
                    option.isCorrect 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <div className="flex-1">
                      <div 
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: option.text }} 
                      >
                        {/* LaTeX rendering will be handled by the HTML content */}
                      </div>
                      {option.explanation && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <strong>Explanation:</strong>
                          <div 
                            className="mt-1"
                            dangerouslySetInnerHTML={{ __html: option.explanation }}
                          >
                            {/* LaTeX rendering will be handled by the HTML content */}
                          </div>
                        </div>
                      )}
                    </div>
                    {option.isCorrect && (
                      <span className="text-green-600 font-medium text-sm">✓ Correct</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionEditor;