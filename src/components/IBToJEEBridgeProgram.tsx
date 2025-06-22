import React, { useState } from 'react';
import { BookOpen, Target, Clock, TrendingUp, Award, Calculator, Atom, Zap, Brain, CheckCircle, Play, Star, ArrowRight, Users, Trophy, Lightbulb, BarChart3, Calendar, FileText, Video } from 'lucide-react';
import { ibToJeeBridgeCourses, ibToJeeTransitionStrategy, ibToJeeResources } from '../data/ibToJeeBridge';

interface IBToJEEBridgeProgramProps {
  onSelectCourse: (courseId: string) => void;
  onSelectLesson: (courseId: string, topicId: string, lessonId: string) => void;
}

const IBToJEEBridgeProgram: React.FC<IBToJEEBridgeProgramProps> = ({ onSelectCourse, onSelectLesson }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPhase, setSelectedPhase] = useState(0);

  const subjects = [
    {
      id: 'physics',
      name: 'Physics',
      icon: Atom,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      course: ibToJeeBridgeCourses.find(c => c.subject === 'physics'),
      challenges: ['Mathematical intensity gap', 'Problem-solving speed', 'Formula memorization', 'MCQ format adaptation'],
      solutions: ['Daily math practice', 'Timed sessions', 'Formula sheets', 'MCQ techniques']
    },
    {
      id: 'math',
      name: 'Mathematics',
      icon: Calculator,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      course: ibToJeeBridgeCourses.find(c => c.subject === 'math'),
      challenges: ['Calculator dependency', 'Mental math weakness', 'Advanced techniques', 'Speed vs accuracy'],
      solutions: ['Mental math training', 'Technique mastery', 'Speed building', 'Accuracy drills']
    },
    {
      id: 'chemistry',
      name: 'Chemistry',
      icon: Zap,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      course: ibToJeeBridgeCourses.find(c => c.subject === 'chemistry'),
      challenges: ['Extensive memorization', 'Factual knowledge gaps', 'Reaction mechanisms', 'Numerical problems'],
      solutions: ['Systematic memorization', 'Fact compilation', 'Mechanism learning', 'Numerical practice']
    }
  ];

  const phases = ibToJeeTransitionStrategy.overview.phases;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg relative">
            <Brain className="w-10 h-10 text-white" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-yellow-800 text-lg font-bold">🌉</span>
            </div>
          </div>
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-4">
          IB to JEE Bridge Program
        </h1>
        <p className="text-gray-600 text-xl max-w-4xl mx-auto leading-relaxed">
          Comprehensive 18-month transition program designed specifically for IB students preparing for JEE Main & Advanced. 
          Bridge the gap between IB's conceptual approach and JEE's computational rigor.
        </p>
        
        <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>18-Month Program</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span>3 Specialized Phases</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            <span>200+ Bridge Lessons</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-1 bg-gray-100 rounded-xl p-1 max-w-2xl mx-auto">
          {[
            { id: 'overview', label: 'Program Overview', icon: Target },
            { id: 'subjects', label: 'Subject Bridge', icon: BookOpen },
            { id: 'timeline', label: 'Study Timeline', icon: Calendar },
            { id: 'resources', label: 'Resources', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Program Phases */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Target className="w-6 h-6 mr-3 text-blue-600" />
              Three-Phase Transition Strategy
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {phases.map((phase, index) => (
                <div
                  key={index}
                  className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPhase === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPhase(index)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      index === 0 ? 'bg-green-500' :
                      index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                    }`}>
                      <span className="text-white font-bold text-lg">{index + 1}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Duration</div>
                      <div className="font-bold text-gray-900">{phase.duration}</div>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{phase.name}</h4>
                  <p className="text-gray-600 mb-4">{phase.focus}</p>
                  
                  <div className="space-y-2">
                    <h5 className="font-semibold text-gray-900 text-sm">Key Goals:</h5>
                    {phase.goals.map((goal, goalIndex) => (
                      <div key={goalIndex} className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{goal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Differences */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-green-600" />
              IB vs JEE: Key Differences
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🎓</span>
                  IB Approach
                </h4>
                <div className="space-y-3">
                  {[
                    'Conceptual understanding with real-world context',
                    'Calculator-dependent problem solving',
                    'Extended time for thoughtful analysis',
                    'Emphasis on experimental design and IA',
                    'Qualitative reasoning and communication'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-blue-800">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <h4 className="text-xl font-bold text-red-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🎯</span>
                  JEE Approach
                </h4>
                <div className="space-y-3">
                  {[
                    'Mathematical rigor and formula-based solving',
                    'Mental calculation and rapid computation',
                    'Time pressure with 2 minutes per question',
                    'Extensive memorization and pattern recognition',
                    'Multiple choice format with negative marking'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Target className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-red-800">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Success Metrics */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Trophy className="w-6 h-6 mr-3 text-yellow-600" />
              Program Success Metrics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { metric: '95%', label: 'IB Students Successfully Transition', icon: Users, color: 'text-blue-600' },
                { metric: '180+', label: 'Average JEE Main Score Improvement', icon: TrendingUp, color: 'text-green-600' },
                { metric: '18', label: 'Months Comprehensive Preparation', icon: Clock, color: 'text-purple-600' },
                { metric: '200+', label: 'Specialized Bridge Lessons', icon: BookOpen, color: 'text-orange-600' }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.metric}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="space-y-8">
          {/* Subject Bridge Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {subjects.map((subject) => {
              const Icon = subject.icon;
              return (
                <div
                  key={subject.id}
                  className={`bg-gradient-to-br ${subject.bgGradient} rounded-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border border-gray-200 group`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${subject.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{subject.course?.totalLessons}</div>
                      <div className="text-sm text-gray-600">Bridge Lessons</div>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{subject.name}</h3>
                  <p className="text-gray-700 mb-6">{subject.course?.description}</p>
                  
                  {/* Challenges */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">Key Challenges:</h4>
                    <div className="space-y-2">
                      {subject.challenges.map((challenge, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-xs text-gray-700">{challenge}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Solutions */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">Our Solutions:</h4>
                    <div className="space-y-2">
                      {subject.solutions.map((solution, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-gray-700">{solution}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => subject.course && onSelectCourse(subject.course.id)}
                    className={`w-full bg-gradient-to-r ${subject.gradient} text-white rounded-xl py-3 font-medium hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center space-x-2`}
                  >
                    <span>Start Bridge Course</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Detailed Comparison */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Lightbulb className="w-6 h-6 mr-3 text-yellow-600" />
              Subject-Specific Transition Strategies
            </h3>
            
            <div className="space-y-8">
              {subjects.map((subject) => {
                const Icon = subject.icon;
                const strategy = ibToJeeTransitionStrategy.subjectSpecificStrategies[subject.id as keyof typeof ibToJeeTransitionStrategy.subjectSpecificStrategies];
                
                return (
                  <div key={subject.id} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${subject.gradient} rounded-xl flex items-center justify-center mr-4`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">{subject.name} Transition Strategy</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-3">Key Challenges:</h5>
                        <div className="space-y-2">
                          {strategy?.challenges.map((challenge, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                              <span className="text-sm text-gray-700">{challenge}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-3">Strategic Solutions:</h5>
                        <div className="space-y-2">
                          {strategy?.solutions.map((solution, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                              <span className="text-sm text-gray-700">{solution}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-8">
          {/* Phase Timeline */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-blue-600" />
              18-Month Study Timeline
            </h3>
            
            <div className="space-y-8">
              {Object.entries(ibToJeeTransitionStrategy.dailySchedule).map(([phase, schedule], index) => (
                <div key={phase} className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${
                      index === 0 ? 'bg-green-500' :
                      index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                    }`}>
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">
                        {phases[index]?.name} - Daily Schedule
                      </h4>
                      <p className="text-gray-600">{phases[index]?.duration}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(schedule).map(([subject, time]) => (
                      <div key={subject} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="font-semibold text-gray-900 capitalize mb-1">
                          {subject.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-sm text-gray-600">{time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assessment Strategy */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-green-600" />
              Assessment & Progress Tracking
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(ibToJeeTransitionStrategy.assessmentStrategy).map(([type, tests]) => (
                <div key={type} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 capitalize">
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <div className="space-y-2">
                    {tests.map((test, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{test}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="space-y-8">
          {/* Recommended Books */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <BookOpen className="w-6 h-6 mr-3 text-blue-600" />
              Recommended Study Materials
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Object.entries(ibToJeeResources.books).map(([subject, books]) => (
                <div key={subject} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 capitalize flex items-center">
                    {subject === 'physics' && <Atom className="w-5 h-5 mr-2 text-blue-500" />}
                    {subject === 'mathematics' && <Calculator className="w-5 h-5 mr-2 text-green-500" />}
                    {subject === 'chemistry' && <Zap className="w-5 h-5 mr-2 text-purple-500" />}
                    {subject}
                  </h4>
                  <div className="space-y-3">
                    {books.map((book, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                        <BookOpen className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{book}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Online Resources */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Video className="w-6 h-6 mr-3 text-green-600" />
              Online Learning Platforms
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ibToJeeResources.onlineResources.map((resource, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900">{resource}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Practice Tests */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="w-6 h-6 mr-3 text-purple-600" />
              Practice Test Resources
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ibToJeeResources.practiceTests.map((test, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900">{test}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IBToJEEBridgeProgram;