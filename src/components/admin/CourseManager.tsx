import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Search, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import CourseForm from './CourseForm';
import { supabase } from '../../utils/supabase';

interface Course {
  id: string;
  title: string;
  description: string;
  subject: string;
  board: string;
  grade: string;
  difficulty: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  topic_count?: number;
  lesson_count?: number;
}

const CourseManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    subject: '',
    board: '',
    difficulty: '',
    published: ''
  });

  // Sample course data
  const sampleCourses: Course[] = [
    {
      id: '1',
      title: 'Advanced Physics: Mechanics and Thermodynamics',
      description: 'Comprehensive study of classical mechanics and thermodynamics with real-world applications',
      subject: 'physics',
      board: 'cambridge',
      grade: 'A Level',
      difficulty: 'advanced',
      is_published: true,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-20T14:30:00Z',
      topic_count: 8,
      lesson_count: 24
    },
    {
      id: '2',
      title: 'Organic Chemistry Fundamentals',
      description: 'Master organic chemistry concepts from functional groups to reaction mechanisms',
      subject: 'chemistry',
      board: 'ib',
      grade: 'DP2',
      difficulty: 'intermediate',
      is_published: true,
      created_at: '2025-01-10T09:00:00Z',
      updated_at: '2025-01-18T11:45:00Z',
      topic_count: 6,
      lesson_count: 18
    },
    {
      id: '3',
      title: 'Calculus for JEE Main',
      description: 'Comprehensive calculus preparation for JEE Main with practice problems',
      subject: 'math',
      board: 'jee',
      grade: 'Class 12',
      difficulty: 'advanced',
      is_published: false,
      created_at: '2025-01-05T15:30:00Z',
      updated_at: '2025-01-15T08:20:00Z',
      topic_count: 5,
      lesson_count: 15
    },
    {
      id: '4',
      title: 'Biology: Human Physiology',
      description: 'Detailed exploration of human body systems and physiological processes',
      subject: 'biology',
      board: 'cbse',
      grade: 'Class 11',
      difficulty: 'intermediate',
      is_published: true,
      created_at: '2025-01-08T13:15:00Z',
      updated_at: '2025-01-16T10:10:00Z',
      topic_count: 7,
      lesson_count: 21
    },
    {
      id: '5',
      title: 'Algebra and Coordinate Geometry',
      description: 'Comprehensive coverage of algebraic concepts and coordinate geometry',
      subject: 'math',
      board: 'cambridge',
      grade: 'IGCSE',
      difficulty: 'beginner',
      is_published: true,
      created_at: '2025-01-12T11:45:00Z',
      updated_at: '2025-01-19T16:30:00Z',
      topic_count: 6,
      lesson_count: 18
    }
  ];

  useEffect(() => {
    // In a real app, fetch courses from Supabase
    // For now, use sample data
    setCourses(sampleCourses);
    setLoading(false);
  }, []);

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setShowForm(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setShowForm(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      // In a real app, delete from Supabase
      setCourses(courses.filter(course => course.id !== courseId));
    }
  };

  const handleSaveCourse = (courseData: Partial<Course>) => {
    if (editingCourse) {
      // Update existing course
      setCourses(courses.map(course => 
        course.id === editingCourse.id ? { ...course, ...courseData, updated_at: new Date().toISOString() } : course
      ));
    } else {
      // Create new course
      const newCourse: Course = {
        id: Date.now().toString(),
        title: courseData.title || '',
        description: courseData.description || '',
        subject: courseData.subject || 'physics',
        board: courseData.board || 'general',
        grade: courseData.grade || '',
        difficulty: courseData.difficulty || 'intermediate',
        is_published: courseData.is_published || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        topic_count: 0,
        lesson_count: 0
      };
      setCourses([newCourse, ...courses]);
    }
    setShowForm(false);
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedCourses = courses
    .filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSubject = !filters.subject || course.subject === filters.subject;
      const matchesBoard = !filters.board || course.board === filters.board;
      const matchesDifficulty = !filters.difficulty || course.difficulty === filters.difficulty;
      const matchesPublished = !filters.published || 
                              (filters.published === 'published' && course.is_published) ||
                              (filters.published === 'draft' && !course.is_published);
      
      return matchesSearch && matchesSubject && matchesBoard && matchesDifficulty && matchesPublished;
    })
    .sort((a, b) => {
      const fieldA = a[sortField as keyof Course];
      const fieldB = b[sortField as keyof Course];
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      }
      
      if (typeof fieldA === 'boolean' && typeof fieldB === 'boolean') {
        return sortDirection === 'asc' 
          ? (fieldA === fieldB ? 0 : fieldA ? 1 : -1)
          : (fieldA === fieldB ? 0 : fieldA ? -1 : 1);
      }
      
      if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        return sortDirection === 'asc' 
          ? fieldA - fieldB 
          : fieldB - fieldA;
      }
      
      return 0;
    });

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case 'physics': return '⚛️';
      case 'math': return '📐';
      case 'chemistry': return '🧪';
      case 'biology': return '🧬';
      default: return '📚';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {showForm ? (
        <CourseForm 
          course={editingCourse} 
          onSave={handleSaveCourse} 
          onCancel={() => setShowForm(false)} 
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Course Management</h2>
              <p className="text-gray-600">Create and manage your educational courses</p>
            </div>
            
            <button
              onClick={handleCreateCourse}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span>Create Course</span>
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search courses by title or description..."
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
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>

                <select
                  value={filters.published}
                  onChange={(e) => setFilters(prev => ({ ...prev, published: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>

          {/* Courses Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleSort('title')}
                      >
                        <span>Course</span>
                        {sortField === 'title' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleSort('subject')}
                      >
                        <span>Subject</span>
                        {sortField === 'subject' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleSort('board')}
                      >
                        <span>Board</span>
                        {sortField === 'board' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleSort('difficulty')}
                      >
                        <span>Difficulty</span>
                        {sortField === 'difficulty' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleSort('is_published')}
                      >
                        <span>Status</span>
                        {sortField === 'is_published' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleSort('updated_at')}
                      >
                        <span>Last Updated</span>
                        {sortField === 'updated_at' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      </td>
                    </tr>
                  ) : filteredAndSortedCourses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <p className="text-gray-500">No courses found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{getSubjectIcon(course.subject)}</div>
                            <div>
                              <p className="font-medium text-gray-900">{course.title}</p>
                              <p className="text-sm text-gray-600 truncate max-w-xs">{course.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 capitalize">
                          {course.subject}
                        </td>
                        <td className="px-6 py-4 capitalize">
                          {course.board}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                            {course.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {course.is_published ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(course.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span>{course.topic_count} topics</span>
                            <span>•</span>
                            <span>{course.lesson_count} lessons</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditCourse(course)}
                              className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Course"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => {/* View course details */}}
                              className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="View Course"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Course"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CourseManager;