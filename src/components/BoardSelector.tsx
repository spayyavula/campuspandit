import React from 'react';
import { GraduationCap, Globe, BookOpen, Award } from 'lucide-react';

interface BoardSelectorProps {
  courses: Course[];
  onBoardSelect: (board: string) => void;
}

const BoardSelector: React.FC<BoardSelectorProps> = ({ courses, onBoardSelect }) => {
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  
  const boards = [
    {
      id: 'cambridge',
      name: 'Cambridge',
      fullName: 'Cambridge International',
      description: 'IGCSE, AS & A Levels with global recognition',
      icon: '🇬🇧',
      gradient: 'from-blue-600 to-indigo-700',
      bgGradient: 'from-blue-50 to-indigo-50',
      features: ['IGCSE (9-10)', 'AS Level (11)', 'A Level (12)', 'Global Recognition'],
      subjects: ['Physics', 'Mathematics', 'Chemistry', 'Biology'],
      assessmentStyle: 'Structured questions, practical assessments'
    },
    {
      id: 'ib',
      name: 'IB',
      fullName: 'International Baccalaureate',
      description: 'Diploma Programme with holistic education approach',
      icon: '🌍',
      gradient: 'from-green-600 to-emerald-700',
      bgGradient: 'from-green-50 to-emerald-50',
      features: ['DP1-DP2 (11-12)', 'Internal Assessment', 'Extended Essay', 'CAS Program'],
      subjects: ['Physics SL/HL', 'Math AA/AI', 'Chemistry SL/HL', 'Biology SL/HL'],
      assessmentStyle: 'Conceptual understanding, investigation skills'
    },
    {
      id: 'cbse',
      name: 'CBSE',
      fullName: 'Central Board of Secondary Education',
      description: 'National curriculum with competency-based learning',
      icon: '🇮🇳',
      gradient: 'from-orange-600 to-red-700',
      bgGradient: 'from-orange-50 to-red-50',
      features: ['Class 9-10', 'Class 11-12', 'NEP 2020 Aligned', 'NCERT Based'],
      subjects: ['Physics', 'Mathematics', 'Chemistry', 'Biology'],
      assessmentStyle: 'Competency-based, application-oriented'
    },
    {
      id: 'isc',
      name: 'ISC',
      fullName: 'Indian School Certificate',
      description: 'Comprehensive education with practical emphasis',
      icon: '📚',
      gradient: 'from-purple-600 to-pink-700',
      bgGradient: 'from-purple-50 to-pink-50',
      features: ['Class 9-10 (ICSE)', 'Class 11-12 (ISC)', 'Practical Focus', 'Detailed Syllabus'],
      subjects: ['Physics', 'Mathematics', 'Chemistry', 'Biology'],
      assessmentStyle: 'Detailed study, practical applications'
    }
  ];

  const competitiveExams = [
    {
      id: 'jee',
      name: 'JEE',
      fullName: 'Joint Entrance Examination',
      description: 'IIT, NIT & Engineering College Entrance',
      icon: '🏗️',
      gradient: 'from-indigo-600 to-blue-700',
      bgGradient: 'from-indigo-50 to-blue-50',
      features: ['JEE Main', 'JEE Advanced', 'IIT Admission', 'Engineering Focus'],
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      assessmentStyle: 'Problem-solving, analytical thinking'
    },
    {
      id: 'neet',
      name: 'NEET',
      fullName: 'National Eligibility cum Entrance Test',
      description: 'Medical & Dental College Entrance',
      icon: '🏥',
      gradient: 'from-red-600 to-pink-700',
      bgGradient: 'from-red-50 to-pink-50',
      features: ['MBBS Admission', 'BDS Admission', 'Medical Focus', 'All India Quota'],
      subjects: ['Physics', 'Chemistry', 'Biology'],
      assessmentStyle: 'Conceptual understanding, application'
    }
  ];

  const bridgePrograms = [
    {
      id: 'ib-jee-bridge',
      name: 'IB to JEE Bridge',
      fullName: 'IB to JEE Transition Program',
      description: 'Comprehensive 18-month bridge program for IB students preparing for JEE',
      icon: '🌉',
      gradient: 'from-blue-600 via-purple-600 to-green-600',
      bgGradient: 'from-blue-50 via-purple-50 to-green-50',
      features: ['Gap Analysis', '3-Phase Program', 'Speed Building', 'JEE Adaptation'],
      subjects: ['Physics Bridge', 'Math Bridge', 'Chemistry Bridge'],
      assessmentStyle: 'IB conceptual to JEE computational transition'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
          Choose Your Board
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Select your curriculum board to access tailored content, assessments, and learning paths designed specifically for your educational system
        </p>
        
        <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-600">
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>International Boards</span>
          </span>
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Competitive Exams</span>
          </span>
        </div>
      </div>

      {/* International Boards */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">International & National Boards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {boards.map((board) => (
          <div
            key={board.id}
            className={`relative bg-gradient-to-br ${board.bgGradient} rounded-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border-2 ${
              selectedBoard === board.id ? 'border-blue-500 ring-4 ring-blue-200' : 'border-gray-200'
            } group overflow-hidden`}
            onClick={() => {
              setSelectedBoard(board.id);
              onBoardSelect(board.id);
            onClick={() => {
              setSelectedBoard(exam.id);
              onBoardSelect(exam.id);
            onClick={() => {
              setSelectedBoard(program.id);
              onBoardSelect(program.id);
            }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 right-4 text-6xl">{board.icon}</div>
              <div className="absolute bottom-4 left-4 text-4xl opacity-50">
                <GraduationCap className="w-12 h-12" />
              </div>
            </div>

            {/* Selection Indicator */}
            {selectedBoard === board.id && (
              <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
            )}

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${board.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow text-3xl`}>
                    {board.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{board.name}</h3>
                    <p className="text-sm font-medium text-gray-600">{board.fullName}</p>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">{board.description}</p>

              {/* Features */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Award className="w-4 h-4 mr-2" />
                  Key Features
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {board.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subjects */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Available Subjects
                </h4>
                <div className="flex flex-wrap gap-2">
                  {board.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white bg-opacity-70 rounded-full text-sm font-medium text-gray-700 border border-gray-200"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {/* Assessment Style */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Assessment Style
                </h4>
                <p className="text-sm text-gray-600 italic">{board.assessmentStyle}</p>
              </div>

              {/* Action Button */}
              <button className={`w-full bg-gradient-to-r ${board.gradient} text-white rounded-xl py-3 font-medium hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center space-x-2`}>
                <span>Select {board.name}</span>
                <div className="w-5 h-5 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-xs">→</span>
                </div>
              </button>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Competitive Exams Section */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Competitive Exam Preparation</h3>
          <p className="text-gray-600">Specialized courses for IIT-JEE and NEET with expert guidance</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {competitiveExams.map((exam) => (
            <div
              key={exam.id}
              className={`relative bg-gradient-to-br ${exam.bgGradient} rounded-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border-2 ${
                selectedBoard === exam.id ? 'border-blue-500 ring-4 ring-blue-200' : 'border-gray-200'
              } group overflow-hidden`}
              onClick={() => onSelectBoard(exam.id)}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 right-4 text-6xl">{exam.icon}</div>
                <div className="absolute bottom-4 left-4 text-4xl opacity-50">
                  <GraduationCap className="w-12 h-12" />
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedBoard === exam.id && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${exam.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow text-3xl`}>
                      {exam.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{exam.name}</h3>
                      <p className="text-sm font-medium text-gray-600">{exam.fullName}</p>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed">{exam.description}</p>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    Exam Features
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {exam.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subjects */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Subjects Covered
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {exam.subjects.map((subject, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white bg-opacity-70 rounded-full text-sm font-medium text-gray-700 border border-gray-200"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Assessment Style */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Focus Areas
                  </h4>
                  <p className="text-sm text-gray-600 italic">{exam.assessmentStyle}</p>
                </div>

                {/* Action Button */}
                <button className={`w-full bg-gradient-to-r ${exam.gradient} text-white rounded-xl py-3 font-medium hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center space-x-2`}>
                  <span>Start {exam.name} Prep</span>
                  <div className="w-5 h-5 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-xs">🚀</span>
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bridge Programs Section */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Transition Bridge Programs</h3>
          <p className="text-gray-600">Specialized programs for students transitioning between different educational systems</p>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {bridgePrograms.map((program) => (
            <div
              key={program.id}
              className={`relative bg-gradient-to-br ${program.bgGradient} rounded-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border-2 ${
                selectedBoard === program.id ? 'border-blue-500 ring-4 ring-blue-200' : 'border-gray-200'
              } group overflow-hidden`}
              onClick={() => onSelectBoard(program.id)}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 right-4 text-6xl">{program.icon}</div>
                <div className="absolute bottom-4 left-4 text-4xl opacity-50">
                  <GraduationCap className="w-12 h-12" />
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedBoard === program.id && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-20 h-20 bg-gradient-to-br ${program.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow text-4xl`}>
                      {program.icon}
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-1">{program.name}</h3>
                      <p className="text-lg font-medium text-gray-600">{program.fullName}</p>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed text-lg">{program.description}</p>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    Program Features
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {program.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subjects */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Bridge Courses
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {program.subjects.map((subject, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white bg-opacity-70 rounded-full text-sm font-medium text-gray-700 border border-gray-200"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Assessment Style */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Transition Focus
                  </h4>
                  <p className="text-sm text-gray-600 italic">{program.assessmentStyle}</p>
                </div>

                {/* Action Button */}
                <button className={`w-full bg-gradient-to-r ${program.gradient} text-white rounded-xl py-3 font-medium hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center space-x-2`}>
                  <span>Start Bridge Program</span>
                  <div className="w-5 h-5 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-xs">🚀</span>
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedBoard && (
        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-2xl mx-auto">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">✓</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {[...boards, ...competitiveExams, ...bridgePrograms].find(b => b.id === selectedBoard)?.fullName} Selected
            </h3>
            <p className="text-gray-600 mb-6">
              You'll now see courses, assessments, and content specifically designed for your {
                competitiveExams.find(e => e.id === selectedBoard) ? 'exam preparation' :
                bridgePrograms.find(p => p.id === selectedBoard) ? 'transition program' :
                'curriculum board'
              }.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Globe className="w-4 h-4" />
              <span>
                {competitiveExams.find(e => e.id === selectedBoard) 
                  ? 'Expert guidance • Mock tests • Previous year questions • Strategy sessions'
                  : bridgePrograms.find(p => p.id === selectedBoard)
                  ? 'Gap analysis • Transition strategy • Speed building • Adaptation training'
                  : 'Curriculum-aligned content • Board-specific assessments • Exam preparation'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardSelector;