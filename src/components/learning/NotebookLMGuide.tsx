import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, ArrowLeft, ExternalLink, CheckCircle, Lightbulb,
  FileText, Zap, Star, Download, Upload, Brain, Target
} from 'lucide-react';

interface NotebookLMGuideProps {
  studentId: string;
}

export const NotebookLMGuide: React.FC<NotebookLMGuideProps> = ({ studentId }) => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
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
                  <Brain className="w-7 h-7 text-purple-600" />
                  NotebookLM Study Guide
                </h1>
                <p className="text-sm text-gray-600">Transform textbooks into comprehensive notes & flashcards</p>
              </div>
            </div>
            <a
              href="https://notebooklm.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
            >
              Open NotebookLM
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 mb-8 text-white">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-4">What is NotebookLM?</h2>
            <p className="text-lg text-purple-100 mb-6">
              NotebookLM is Google's AI-powered note-taking assistant that helps you create comprehensive
              study notes and flashcards from textbooks automatically. Save hundreds of hours and ace your exams!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Source Grounded</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Time-Saving</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Interactive</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Free to Use</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Organized</span>
              </div>
            </div>
          </div>
        </div>

        {/* Study Workflow */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Complete Study Workflow</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">1</div>
              <h4 className="font-semibold text-gray-900 mb-2">Upload Textbook</h4>
              <p className="text-sm text-gray-600">Upload chapter PDFs to NotebookLM</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">2</div>
              <h4 className="font-semibold text-gray-900 mb-2">AI Creates Notes</h4>
              <p className="text-sm text-gray-600">Get comprehensive notes instantly</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">3</div>
              <h4 className="font-semibold text-gray-900 mb-2">Generate Flashcards</h4>
              <p className="text-sm text-gray-600">Create flashcards for active recall</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="w-12 h-12 bg-yellow-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">4</div>
              <h4 className="font-semibold text-gray-900 mb-2">Ace the Exam</h4>
              <p className="text-sm text-gray-600">Master concepts with spaced repetition</p>
            </div>
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          <button
            onClick={() => toggleSection('getting-started')}
            className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Getting Started with NotebookLM</h3>
            </div>
            <div className={`transform transition-transform ${expandedSection === 'getting-started' ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </button>
          {expandedSection === 'getting-started' && (
            <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
                    Create Your Account
                  </h4>
                  <ul className="ml-8 space-y-2 text-gray-700">
                    <li>• Visit <a href="https://notebooklm.google.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">notebooklm.google.com</a></li>
                    <li>• Sign in with your Google account</li>
                    <li>• Accept terms and conditions</li>
                    <li>• You're ready to start!</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                    Create Subject-Specific Notebooks
                  </h4>
                  <div className="ml-8 space-y-3">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">For Physics:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• "JEE Physics - Mechanics"</li>
                        <li>• "JEE Physics - Thermodynamics"</li>
                        <li>• "JEE Physics - Electromagnetism"</li>
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">For Mathematics:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• "JEE Math - Calculus"</li>
                        <li>• "JEE Math - Algebra"</li>
                        <li>• "JEE Math - Coordinate Geometry"</li>
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">For Chemistry:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• "JEE Chemistry - Physical"</li>
                        <li>• "JEE Chemistry - Organic"</li>
                        <li>• "JEE Chemistry - Inorganic"</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
                    Upload Your Sources
                  </h4>
                  <ul className="ml-8 space-y-2 text-gray-700">
                    <li>• Click "Add Source" in your notebook</li>
                    <li>• Upload PDF textbooks (H.C. Verma, NCERT, etc.)</li>
                    <li>• Add class notes (scanned or typed)</li>
                    <li>• Include previous year papers</li>
                    <li>• Wait for processing (1-2 minutes)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Creating Notes Section */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          <button
            onClick={() => toggleSection('creating-notes')}
            className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Creating Comprehensive Notes</h3>
            </div>
            <div className={`transform transition-transform ${expandedSection === 'creating-notes' ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </button>
          {expandedSection === 'creating-notes' && (
            <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Perfect Prompt Template
                  </h4>
                  <div className="bg-white p-4 rounded border border-purple-300 text-sm text-gray-800 font-mono whitespace-pre-line">
{`Create comprehensive study notes for this chapter covering:
1. All key concepts and definitions
2. Important formulas with explanations
3. Derivations step-by-step
4. Solved examples
5. Common mistakes to avoid
6. Important points for JEE Main/Advanced

Organize by topics and make it easy to revise.`}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Sample Questions to Ask:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-900 mb-2">For Physics:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• "Explain instantaneous velocity"</li>
                        <li>• "Difference between speed and velocity"</li>
                        <li>• "Three equations of motion"</li>
                        <li>• "5 solved acceleration problems"</li>
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-900 mb-2">For Chemistry:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• "Important reactions of alkenes"</li>
                        <li>• "Mechanism of electrophilic addition"</li>
                        <li>• "SN1 vs SN2 conditions"</li>
                        <li>• "Summary of name reactions"</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h4 className="font-semibold text-green-900 mb-3">Pro Tips:</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Upload one chapter at a time for focused notes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Ask specific, detailed questions for better answers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Review AI-generated content and add your insights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Export notes to Google Docs or save as PDF</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Creating Flashcards Section */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          <button
            onClick={() => toggleSection('flashcards')}
            className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-yellow-600" />
              <h3 className="text-xl font-bold text-gray-900">Creating Flashcards for Active Recall</h3>
            </div>
            <div className={`transform transition-transform ${expandedSection === 'flashcards' ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </button>
          {expandedSection === 'flashcards' && (
            <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h4 className="font-semibold text-yellow-900 mb-3">Why Flashcards Work</h4>
                  <p className="text-gray-700 mb-4">
                    Research shows <strong>active recall</strong> is the most effective study technique.
                    Flashcards force your brain to retrieve information, identify weak areas immediately,
                    and use spaced repetition for long-term retention.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Flashcard Generation Prompt
                  </h4>
                  <div className="bg-white p-4 rounded border border-blue-300 text-sm text-gray-800 font-mono whitespace-pre-line">
{`Create 50 flashcards for JEE Main covering this chapter.

Format each flashcard as:
Q: [Question]
A: [Concise Answer]

Include:
- Definitions (20 cards)
- Formulas (15 cards)
- Conceptual questions (10 cards)
- Problem-solving strategies (5 cards)

Make questions challenging but clear.`}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Example Flashcards:</h4>
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">Q: Define instantaneous velocity</p>
                      <p className="text-gray-700">A: Rate of change of displacement at a specific instant. Mathematically: v = lim(Δt→0) Δx/Δt</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">Q: State the first equation of motion</p>
                      <p className="text-gray-700">A: v = u + at (Where v=final velocity, u=initial velocity, a=acceleration, t=time)</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">Q: When do you use the equation v² = u² + 2as?</p>
                      <p className="text-gray-700">A: When time (t) is not given and you need to find velocity or displacement</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h4 className="font-semibold text-green-900 mb-3">Recommended Sets:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded border border-gray-200">
                      <p className="font-semibold text-sm text-gray-900 mb-2">Physics - Mechanics</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Newton's Laws (25 cards)</li>
                        <li>• Work & Energy (30 cards)</li>
                        <li>• Momentum (20 cards)</li>
                        <li>• Rotation (35 cards)</li>
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded border border-gray-200">
                      <p className="font-semibold text-sm text-gray-900 mb-2">Chemistry - Organic</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Alkanes (20 cards)</li>
                        <li>• Alkenes (25 cards)</li>
                        <li>• Aromatics (30 cards)</li>
                        <li>• Name Reactions (40 cards)</li>
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded border border-gray-200">
                      <p className="font-semibold text-sm text-gray-900 mb-2">Math - Calculus</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Limits (30 cards)</li>
                        <li>• Derivatives (40 cards)</li>
                        <li>• Integration (45 cards)</li>
                        <li>• Applications (25 cards)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Study Schedule Section */}
        <div className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden">
          <button
            onClick={() => toggleSection('schedule')}
            className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">Daily Study Schedule with NotebookLM</h3>
            </div>
            <div className={`transform transition-transform ${expandedSection === 'schedule' ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </button>
          {expandedSection === 'schedule' && (
            <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Morning (30 min)</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Review 50 flashcards</li>
                    <li>• Focus on wrong answers</li>
                  </ul>
                </div>
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Study Time (2 hrs)</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Read textbook chapter</li>
                    <li>• Upload to NotebookLM</li>
                    <li>• Generate notes</li>
                  </ul>
                </div>
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Afternoon (1 hr)</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Create flashcards</li>
                    <li>• Review & edit</li>
                    <li>• Add to system</li>
                  </ul>
                </div>
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Evening (1 hr)</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Practice problems</li>
                    <li>• Use NotebookLM for doubts</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Study Routine?</h3>
          <p className="text-lg text-green-100 mb-6 max-w-2xl mx-auto">
            NotebookLM combined with CampusPandit tutors gives you the perfect study system.
            Start creating notes today and see the difference!
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://notebooklm.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold flex items-center gap-2"
            >
              Start with NotebookLM
              <ExternalLink className="w-5 h-5" />
            </a>
            <Link
              to="/tutors"
              className="px-8 py-4 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-semibold"
            >
              Find a Tutor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotebookLMGuide;
