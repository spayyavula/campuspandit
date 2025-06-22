import React, { useState } from 'react';
import { BookOpen, Target, Clock, TrendingUp, Award, Calculator, Atom, Zap, Brain, CheckCircle, Play, Star } from 'lucide-react';
import { jeeMainCourses, jeeMainExamInfo, jeeMainWeightage } from '../data/jeeMainContent';
import JEEMainMockTest from './JEEMainMockTest';

interface JEEMainDashboardProps {
  onSelectCourse: (courseId: string) => void;
  onSelectLesson: (courseId: string, topicId: string, lessonId: string) => void;
}

const JEEMainDashboard: React.FC<JEEMainDashboardProps> = ({ onSelectCourse, onSelectLesson }) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMockTest, setShowMockTest] = useState(false);

  if (showMockTest) {
    return (
      <JEEMainMockTest
        onBack={() => setShowMockTest(false)}
        onComplete={(score, analysis) => {
          console.log('Mock test completed:', { score, analysis });
          setShowMockTest(false);
        }}
      />
    );
  }

  const subjects = [
    {
      id: 'physics',
      name: 'Physics',
      icon: Atom,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      courses: jeeMainCourses.filter(c => c.subject === 'physics'),
      weightage: jeeMainWeightage.physics,
      description: 'Master mechanics, electromagnetism, and modern physics'
    },
    {
      id: 'chemistry',
      name: 'Chemistry',
      icon: Zap,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      courses: jeeMainCourses.filter(c => c.subject === 'chemistry'),
      weightage: jeeMainWeightage.chemistry,
      description: 'Comprehensive physical, inorganic, and organic chemistry'
    },
    {
      id: 'math',
      name: 'Mathematics',
      icon: Calculator,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      courses: jeeMainCourses.filter(c => c.subject === 'math'),
      weightage: jeeMainWeightage.mathematics,
      description: 'Advanced algebra, calculus, and coordinate geometry'
    }
  ];

  const examStats = [
    {
      title: 'Total Questions',
      value: '90',
      subtitle: '30 per subject',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Duration',
      value: '3 hrs',
      subtitle: '180 minutes',
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Marks',
      value: '360',
      subtitle: '+4, -1 marking',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Success Rate',
      value: '2.5%',
      subtitle: 'Top IITs',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg relative">
            <Brain className="w-10 h-10 text-white" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-yellow-800 text-lg font-bold">🏗️</span>
            </div>
          </div>
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          JEE Main 2025
        </h1>
        <p className="text-gray-600 text-xl max-w-3xl mx-auto leading-relaxed">
          Complete preparation for Joint Entrance Examination with expert guidance, 
          comprehensive study material, and unlimited practice tests
        </p>
        
        <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Classes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Mock Tests</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            <span>Doubt Resolution</span>
          </div>
        </div>
      </div>

      {/* Exam Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {examStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${stat.bgColor} rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center shadow-sm`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-right">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-700 mb-1">{stat.title}</p>
              <p className="text-xs text-gray-500">{stat.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-1 bg-gray-100 rounded-xl p-1 max-w-md mx-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'subjects', label: 'Subjects', icon: BookOpen },
            { id: 'strategy', label: 'Strategy', icon: Brain },
            { id: 'practice', label: 'Practice', icon: Play }
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
          {/* Exam Pattern */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Target className="w-6 h-6 mr-3 text-blue-600" />
              JEE Main 2025 Pattern
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(jeeMainExamInfo.pattern.subjects).map(([subject, info]) => (
                <div key={subject} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 capitalize">{subject}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Questions:</span>
                      <span className="font-medium">{info.questions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Marks:</span>
                      <span className="font-medium">{info.marks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">{jeeMainExamInfo.strategy.timeManagement[subject as keyof typeof jeeMainExamInfo.strategy.timeManagement]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h5 className="font-semibold text-blue-900 mb-2">Marking Scheme</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-green-600 font-bold">+4</div>
                  <div className="text-gray-600">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-red-600 font-bold">-1</div>
                  <div className="text-gray-600">Incorrect</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600 font-bold">0</div>
                  <div className="text-gray-600">Unattempted</div>
                </div>
              </div>
            </div>
          </div>

          {/* Preparation Timeline */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Clock className="w-6 h-6 mr-3 text-green-600" />
              Preparation Timeline
            </h3>
            
            <div className="space-y-4">
              {Object.entries(jeeMainExamInfo.preparation.timeline).map(([duration, description], index) => (
                <div key={duration} className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{duration}</h4>
                    <p className="text-gray-600">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="space-y-8">
          {/* Subject Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {subjects.map((subject) => {
              const Icon = subject.icon;
              return (
                <div
                  key={subject.id}
                  className={`bg-gradient-to-br ${subject.bgGradient} rounded-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border border-gray-200 group`}
                  onClick={() => setSelectedSubject(selectedSubject === subject.id ? null : subject.id)}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${subject.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{subject.courses.length}</div>
                      <div className="text-sm text-gray-600">Courses</div>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{subject.name}</h3>
                  <p className="text-gray-700 mb-6">{subject.description}</p>
                  
                  {/* Weightage Preview */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 text-sm">Chapter Weightage:</h4>
                    {Object.entries(subject.weightage).slice(0, 3).map(([chapter, info]) => (
                      <div key={chapter} className="flex justify-between text-sm">
                        <span className="text-gray-700">{chapter}</span>
                        <span className="font-medium">{info.marks} marks</span>
                      </div>
                    ))}
                  </div>
                  
                  <button className={`w-full mt-6 bg-gradient-to-r ${subject.gradient} text-white rounded-xl py-3 font-medium hover:opacity-90 transition-opacity shadow-lg`}>
                    Start Learning
                  </button>
                </div>
              );
            })}
          </div>

          {/* Detailed Subject View */}
          {selectedSubject && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              {(() => {
                const subject = subjects.find(s => s.id === selectedSubject)!;
                return (
                  <div>
                    <div className="flex items-center mb-6">
                      <div className={`w-12 h-12 bg-gradient-to-br ${subject.gradient} rounded-xl flex items-center justify-center shadow-lg mr-4`}>
                        <subject.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{subject.name} Courses</h3>
                        <p className="text-gray-600">Complete preparation with expert guidance</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {subject.courses.map((course) => (
                        <div key={course.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h4>
                              <p className="text-gray-600 text-sm mb-3">{course.description}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <BookOpen className="w-4 h-4 mr-1" />
                                  {course.totalLessons} lessons
                                </span>
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {course.grade}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Topics Preview */}
                          <div className="space-y-2 mb-4">
                            {course.topics.slice(0, 2).map((topic) => (
                              <div key={topic.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-900">{topic.title}</span>
                                <span className="text-xs text-gray-500">{topic.lessons.length} lessons</span>
                              </div>
                            ))}
                            {course.topics.length > 2 && (
                              <div className="text-center text-sm text-gray-500">
                                +{course.topics.length - 2} more topics
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => onSelectCourse(course.id)}
                            className={`w-full bg-gradient-to-r ${subject.gradient} text-white rounded-lg py-2 hover:opacity-90 transition-opacity`}
                          >
                            Start Course
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {activeTab === 'strategy' && (
        <div className="space-y-8">
          {/* Time Management Strategy */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Clock className="w-6 h-6 mr-3 text-blue-600" />
              Time Management Strategy
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {Object.entries(jeeMainExamInfo.strategy.subjectWiseStrategy).map(([subject, strategy]) => (
                <div key={subject} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 capitalize">{subject}</h4>
                  <p className="text-gray-600 mb-4">{strategy.focus}</p>
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">Key Tips:</h5>
                    <ul className="space-y-1">
                      {strategy.tips.map((tip, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Question Selection Strategy</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(jeeMainExamInfo.strategy.questionSelection).map(([level, description]) => (
                  <div key={level} className="text-center">
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      level === 'easy' ? 'bg-green-500' :
                      level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      <span className="text-white font-bold capitalize">{level[0]}</span>
                    </div>
                    <h5 className="font-medium text-gray-900 capitalize">{level}</h5>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Resources */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <BookOpen className="w-6 h-6 mr-3 text-green-600" />
              Recommended Resources
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Essential Books</h4>
                <div className="space-y-3">
                  {jeeMainExamInfo.preparation.resources.books.map((book, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-900 font-medium">{book}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Online Platforms</h4>
                <div className="space-y-3">
                  {jeeMainExamInfo.preparation.resources.onlinePlatforms.map((platform, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-900 font-medium">{platform}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'practice' && (
        <div className="space-y-8">
          {/* Mock Tests */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Play className="w-6 h-6 mr-3 text-blue-600" />
              Practice Tests
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-blue-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Full Mock Test</h4>
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-gray-600 mb-4">Complete JEE Main simulation with 90 questions</p>
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>3 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span>90 (30 each)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Marking:</span>
                    <span>+4, -1</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowMockTest(true)}
                  className="w-full bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 transition-colors"
                >
                  Start Test
                </button>
              </div>

              <div className="border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-green-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Subject Tests</h4>
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-gray-600 mb-4">Subject-wise practice tests</p>
                <div className="space-y-2 mb-4">
                  {['Physics', 'Chemistry', 'Mathematics'].map((subject) => (
                    <button
                      key={subject}
                      className="w-full text-left p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
                    >
                      {subject} Test
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-purple-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Previous Years</h4>
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-gray-600 mb-4">Solve previous year question papers</p>
                <div className="space-y-2 mb-4">
                  {['2024', '2023', '2022'].map((year) => (
                    <button
                      key={year}
                      className="w-full text-left p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
                    >
                      JEE Main {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Analytics */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 mr-3 text-green-600" />
              Performance Analytics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">Overall Progress</h4>
                <div className="text-3xl font-bold text-blue-600 mb-2">75%</div>
                <p className="text-sm text-blue-700">Syllabus completed</p>
              </div>
              
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3">Mock Test Average</h4>
                <div className="text-3xl font-bold text-green-600 mb-2">245</div>
                <p className="text-sm text-green-700">Out of 360 marks</p>
              </div>
              
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3">Rank Prediction</h4>
                <div className="text-3xl font-bold text-purple-600 mb-2">15K</div>
                <p className="text-sm text-purple-700">Expected JEE Main rank</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JEEMainDashboard;