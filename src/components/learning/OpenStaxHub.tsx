import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, ArrowLeft, ExternalLink, CheckCircle, Book,
  FileText, Video, Headphones, Download, Search, Star, GraduationCap
} from 'lucide-react';

interface OpenStaxHubProps {
  studentId: string;
}

interface TextbookResource {
  id: string;
  title: string;
  subject: string;
  description: string;
  coverImage: string;
  features: string[];
  targetExam: string[];
  url: string;
}

export const OpenStaxHub: React.FC<OpenStaxHubProps> = ({ studentId }) => {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Sample OpenStax resources
  const textbooks: TextbookResource[] = [
    {
      id: 'physics',
      title: 'College Physics',
      subject: 'Physics',
      description: 'Comprehensive physics textbook covering mechanics, thermodynamics, waves, electricity, magnetism, optics, and modern physics',
      coverImage: '📚',
      features: ['Free PDF Download', 'Interactive Simulations', 'Practice Problems', 'Video Explanations'],
      targetExam: ['JEE Main', 'JEE Advanced', 'NEET', 'Board Exams'],
      url: 'https://openstax.org/details/books/college-physics'
    },
    {
      id: 'physics-ap',
      title: 'University Physics',
      subject: 'Physics',
      description: 'Advanced physics covering classical mechanics, waves, thermodynamics, electricity & magnetism, optics, and quantum physics',
      coverImage: '🔬',
      features: ['Free PDF Download', '3000+ Practice Problems', 'Detailed Solutions', 'Concept Videos'],
      targetExam: ['JEE Advanced', 'NEET', 'Advanced Topics'],
      url: 'https://openstax.org/details/books/university-physics-volume-1'
    },
    {
      id: 'chemistry',
      title: 'Chemistry 2e',
      subject: 'Chemistry',
      description: 'Complete chemistry resource covering atomic structure, bonding, reactions, stoichiometry, gases, thermodynamics, and organic chemistry',
      coverImage: '🧪',
      features: ['Free PDF Download', 'Interactive Practice', 'Real-World Applications', 'Step-by-Step Solutions'],
      targetExam: ['JEE Main', 'JEE Advanced', 'NEET', 'Board Exams'],
      url: 'https://openstax.org/details/books/chemistry-2e'
    },
    {
      id: 'chemistry-atoms',
      title: 'Chemistry: Atoms First',
      subject: 'Chemistry',
      description: 'Alternative approach starting with atomic structure, building up to molecules, bonding, and reactions',
      coverImage: '⚗️',
      features: ['Free PDF Download', 'Unique Approach', 'Practice Exercises', 'Visual Learning'],
      targetExam: ['JEE Main', 'NEET', 'Foundation'],
      url: 'https://openstax.org/details/books/chemistry-atoms-first-2e'
    },
    {
      id: 'biology',
      title: 'Biology 2e',
      subject: 'Biology',
      description: 'Comprehensive biology textbook covering cell biology, genetics, evolution, ecology, and human anatomy',
      coverImage: '🧬',
      features: ['Free PDF Download', 'High-Quality Diagrams', 'Practice Questions', 'Concept Maps'],
      targetExam: ['NEET', 'Board Exams', 'Foundation'],
      url: 'https://openstax.org/details/books/biology-2e'
    },
    {
      id: 'calculus',
      title: 'Calculus Volume 1',
      subject: 'Mathematics',
      description: 'Limits, derivatives, integration, and applications of calculus with extensive practice problems',
      coverImage: '📐',
      features: ['Free PDF Download', '2000+ Practice Problems', 'Detailed Solutions', 'Application Examples'],
      targetExam: ['JEE Main', 'JEE Advanced', 'Board Exams'],
      url: 'https://openstax.org/details/books/calculus-volume-1'
    },
    {
      id: 'calculus-2',
      title: 'Calculus Volume 2',
      subject: 'Mathematics',
      description: 'Integration techniques, sequences, series, parametric equations, and polar coordinates',
      coverImage: '📊',
      features: ['Free PDF Download', 'Advanced Topics', 'Practice Sets', 'Real-World Problems'],
      targetExam: ['JEE Advanced', 'Advanced Topics'],
      url: 'https://openstax.org/details/books/calculus-volume-2'
    },
    {
      id: 'algebra',
      title: 'Algebra and Trigonometry',
      subject: 'Mathematics',
      description: 'Foundation in algebra, functions, exponentials, logarithms, and trigonometry',
      coverImage: '🔢',
      features: ['Free PDF Download', 'Step-by-Step Solutions', 'Practice Exercises', 'Visual Aids'],
      targetExam: ['JEE Main', 'Board Exams', 'Foundation'],
      url: 'https://openstax.org/details/books/algebra-and-trigonometry'
    }
  ];

  const subjects = [
    { id: 'all', name: 'All Subjects', icon: '📚', color: 'gray' },
    { id: 'Physics', name: 'Physics', icon: '⚛️', color: 'blue' },
    { id: 'Chemistry', name: 'Chemistry', icon: '🧪', color: 'green' },
    { id: 'Mathematics', name: 'Mathematics', icon: '📐', color: 'purple' },
    { id: 'Biology', name: 'Biology', icon: '🧬', color: 'pink' }
  ];

  const filteredTextbooks = selectedSubject === 'all'
    ? textbooks
    : textbooks.filter(book => book.subject === selectedSubject);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
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
                  <Book className="w-7 h-7 text-orange-600" />
                  OpenStax Learning Hub
                </h1>
                <p className="text-sm text-gray-600">Free, peer-reviewed, openly licensed textbooks for adaptive learning</p>
              </div>
            </div>
            <a
              href="https://openstax.org"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 font-medium"
            >
              Visit OpenStax
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 mb-8 text-white">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-4">What is OpenStax?</h2>
            <p className="text-lg text-orange-100 mb-6">
              OpenStax is a nonprofit educational initiative based at Rice University. All OpenStax
              textbooks are free to download, openly licensed, and peer-reviewed by expert educators.
              Perfect for JEE, NEET, and Board exam preparation!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <Download className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-semibold">100% Free</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-semibold">Peer Reviewed</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <Book className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-semibold">High Quality</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <Star className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-semibold">Trusted</p>
              </div>
            </div>
          </div>
        </div>

        {/* Why OpenStax Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Choose OpenStax for JEE/NEET Preparation?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Completely Free Access</h4>
                <p className="text-sm text-gray-600">
                  Download entire textbooks as PDFs at no cost. No subscriptions, no hidden fees.
                  Save ₹50,000+ on textbook costs while getting quality education.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Expert-Reviewed Content</h4>
                <p className="text-sm text-gray-600">
                  All books are peer-reviewed by professors and education experts. Quality matches
                  or exceeds traditional textbooks like H.C. Verma and NCERT.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Adaptive Learning Features</h4>
                <p className="text-sm text-gray-600">
                  Includes practice problems, interactive simulations, and self-assessment tools
                  to adapt to your learning pace and style.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Video className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Multi-Format Learning</h4>
                <p className="text-sm text-gray-600">
                  Available as PDF, web view, and mobile app. Compatible with NotebookLM for
                  AI-powered note generation and flashcards.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How to Use Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">How to Use OpenStax with CampusPandit</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Download Textbooks</h4>
                <p className="text-sm text-gray-600">
                  Choose textbooks relevant to your exam (JEE/NEET/Boards) and download PDFs for offline access.
                  Completely free, no registration required.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Upload to NotebookLM</h4>
                <p className="text-sm text-gray-600">
                  Upload chapters to <Link to="/notebooklm" className="text-purple-600 hover:underline">NotebookLM</Link> to
                  automatically generate comprehensive notes and flashcards using AI.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Combine with Google Learn</h4>
                <p className="text-sm text-gray-600">
                  Use <Link to="/google-learn" className="text-green-600 hover:underline">Google Learn Your Way</Link> modules
                  alongside OpenStax textbooks for interactive practice and self-paced learning.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Get Tutor Help</h4>
                <p className="text-sm text-gray-600">
                  When you encounter difficult concepts, <Link to="/tutors" className="text-orange-600 hover:underline">book a tutor session</Link> to
                  get personalized help and clarify doubts from OpenStax content.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Filter */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Browse by Subject</h3>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                  selectedSubject === subject.id
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span className="text-xl">{subject.icon}</span>
                {subject.name}
              </button>
            ))}
          </div>
        </div>

        {/* Textbooks Grid */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Available Textbooks {selectedSubject !== 'all' && `- ${selectedSubject}`}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTextbooks.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="text-center mb-4">
                  <div className="text-6xl mb-3">{book.coverImage}</div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{book.title}</h4>
                  <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                    {book.subject}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{book.description}</p>

                {/* Features */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Features:</p>
                  <div className="flex flex-wrap gap-2">
                    {book.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Target Exams */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Perfect for:</p>
                  <div className="flex flex-wrap gap-2">
                    {book.targetExam.map((exam, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-semibold"
                      >
                        {exam}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <a
                    href={book.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-center font-medium flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download Free
                  </a>
                  <a
                    href={book.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 text-gray-600" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 mb-8 border border-blue-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Additional OpenStax Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg">
              <Video className="w-10 h-10 text-blue-600 mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Video Lectures</h4>
              <p className="text-sm text-gray-600 mb-3">
                Access free video explanations and lectures aligned with OpenStax textbooks
              </p>
              <a
                href="https://www.youtube.com/c/openstax"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                Watch Videos <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <Headphones className="w-10 h-10 text-purple-600 mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Study Guides</h4>
              <p className="text-sm text-gray-600 mb-3">
                Download study guides, chapter summaries, and practice problem sets
              </p>
              <a
                href="https://openstax.org/subjects"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-600 hover:underline flex items-center gap-1"
              >
                Browse Guides <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <Search className="w-10 h-10 text-green-600 mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Interactive Tools</h4>
              <p className="text-sm text-gray-600 mb-3">
                Use interactive simulations, calculators, and practice exercises
              </p>
              <a
                href="https://openstax.org/subjects"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:underline flex items-center gap-1"
              >
                Explore Tools <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Complete Free Learning Ecosystem</h3>
          <p className="text-lg text-orange-100 mb-6 max-w-2xl mx-auto">
            Combine OpenStax textbooks (100% free) with NotebookLM notes, Google Learn modules, and expert tutoring
            (starting ₹299/hour) for the ultimate exam preparation system!
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href="https://openstax.org"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white text-orange-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold flex items-center gap-2"
            >
              Browse OpenStax
              <ExternalLink className="w-5 h-5" />
            </a>
            <Link
              to="/notebooklm"
              className="px-8 py-4 bg-orange-700 text-white rounded-lg hover:bg-orange-800 transition-colors font-semibold"
            >
              NotebookLM Guide
            </Link>
            <Link
              to="/google-learn"
              className="px-8 py-4 bg-orange-700 text-white rounded-lg hover:bg-orange-800 transition-colors font-semibold"
            >
              Google Learn
            </Link>
            <Link
              to="/tutors"
              className="px-8 py-4 bg-orange-700 text-white rounded-lg hover:bg-orange-800 transition-colors font-semibold"
            >
              Find a Tutor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenStaxHub;
