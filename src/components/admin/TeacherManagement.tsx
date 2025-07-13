import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Edit, Trash2, Eye, Mail, Clock, CheckCircle, XCircle, Plus, Download, ArrowUp, ArrowDown, Award, BookOpen, Star, MessageSquare, X } from 'lucide-react';
import { format } from 'date-fns';

interface Teacher {
  id: string;
  name: string;
  email: string;
  specialization: string[];
  assignedCourses: string[];
  rating: number;
  lastActive: string;
  joinDate: string;
  status: 'active' | 'inactive';
  avatar?: string;
  bio?: string;
  qualifications?: string[];
}

const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('lastActive');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    specialization: '',
    status: '',
    rating: ''
  });
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showTeacherDetails, setShowTeacherDetails] = useState(false);

  // Sample teacher data
  const sampleTeachers: Teacher[] = [
    {
      id: '1',
      name: 'Dr. Robert Chen',
      email: 'robert.chen@example.com',
      specialization: ['Physics', 'Mathematics'],
      assignedCourses: ['Advanced Physics', 'Calculus for JEE'],
      rating: 4.8,
      lastActive: '2025-01-20T14:30:00Z',
      joinDate: '2024-03-15T10:00:00Z',
      status: 'active',
      bio: 'Dr. Chen has over 15 years of experience teaching physics and mathematics. He specializes in making complex concepts accessible to students.',
      qualifications: ['PhD in Physics', 'M.Sc. Mathematics', 'Teaching Certification']
    },
    {
      id: '2',
      name: 'Prof. Anita Sharma',
      email: 'anita.sharma@example.com',
      specialization: ['Chemistry', 'Biology'],
      assignedCourses: ['Organic Chemistry', 'Biology: Human Physiology'],
      rating: 4.9,
      lastActive: '2025-01-19T16:45:00Z',
      joinDate: '2024-02-20T11:30:00Z',
      status: 'active',
      bio: 'Prof. Sharma is passionate about chemistry and biology education. She has published numerous research papers and loves inspiring students.',
      qualifications: ['PhD in Chemistry', 'M.Sc. Biology', 'Research Publications: 25+']
    },
    {
      id: '3',
      name: 'Dr. James Wilson',
      email: 'james.wilson@example.com',
      specialization: ['Mathematics'],
      assignedCourses: ['Algebra and Coordinate Geometry'],
      rating: 4.7,
      lastActive: '2025-01-18T09:15:00Z',
      joinDate: '2024-04-10T08:00:00Z',
      status: 'active',
      bio: 'Dr. Wilson specializes in advanced mathematics and has a talent for breaking down complex mathematical concepts into understandable steps.',
      qualifications: ['PhD in Mathematics', 'M.Sc. Applied Mathematics', 'IIT Alumni']
    },
    {
      id: '4',
      name: 'Dr. Priya Patel',
      email: 'priya.patel@example.com',
      specialization: ['Biology', 'Chemistry'],
      assignedCourses: ['Biology: Human Physiology'],
      rating: 4.6,
      lastActive: '2025-01-10T12:00:00Z',
      joinDate: '2024-05-05T10:00:00Z',
      status: 'inactive',
      bio: 'Dr. Patel brings real-world medical experience to her biology teaching, having worked as a practicing physician before joining education.',
      qualifications: ['MD Medicine', 'M.Sc. Biology', 'Clinical Experience: 8 years']
    },
    {
      id: '5',
      name: 'Prof. Michael Lee',
      email: 'michael.lee@example.com',
      specialization: ['Mathematics', 'Physics'],
      assignedCourses: ['Calculus for JEE', 'Advanced Physics'],
      rating: 4.8,
      lastActive: '2025-01-17T15:20:00Z',
      joinDate: '2024-01-12T09:30:00Z',
      status: 'active',
      bio: 'Prof. Lee has extensive experience in competitive exam preparation and has helped hundreds of students achieve their academic goals.',
      qualifications: ['M.Sc. Physics', 'M.Sc. Mathematics', 'JEE Coaching: 12+ years']
    }
  ];

  useEffect(() => {
    // In a real app, fetch teachers from Supabase
    // For now, use sample data
    setTeachers(sampleTeachers);
    setLoading(false);
  }, []);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedTeachers = teachers
    .filter(teacher => {
      const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           teacher.specialization.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSpecialization = !filters.specialization || teacher.specialization.includes(filters.specialization);
      const matchesStatus = !filters.status || teacher.status === filters.status;
      const matchesRating = !filters.rating || 
                           (filters.rating === 'high' && teacher.rating >= 4.5) ||
                           (filters.rating === 'medium' && teacher.rating >= 4.0 && teacher.rating < 4.5) ||
                           (filters.rating === 'low' && teacher.rating < 4.0);
      
      return matchesSearch && matchesSpecialization && matchesStatus && matchesRating;
    })
    .sort((a, b) => {
      const fieldA = a[sortField as keyof Teacher];
      const fieldB = b[sortField as keyof Teacher];
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      }
      
      if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        return sortDirection === 'asc' 
          ? fieldA - fieldB 
          : fieldB - fieldA;
      }
      
      return 0;
    });

  const handleViewTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowTeacherDetails(true);
  };

  const handleToggleStatus = (teacherId: string) => {
    setTeachers(teachers.map(teacher => 
      teacher.id === teacherId 
        ? { ...teacher, status: teacher.status === 'active' ? 'inactive' : 'active' }
        : teacher
    ));
  };

  const handleDeleteTeacher = (teacherId: string) => {
    if (window.confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
      setTeachers(teachers.filter(teacher => teacher.id !== teacherId));
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  const specializations = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

  return (
    <div className="space-y-6">
      {showTeacherDetails && selectedTeacher ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Teacher Profile
            </h2>
            <button
              onClick={() => setShowTeacherDetails(false)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="md:col-span-1">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                    {selectedTeacher.avatar ? (
                      <img 
                        src={selectedTeacher.avatar} 
                        alt={selectedTeacher.name} 
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      selectedTeacher.name.charAt(0)
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedTeacher.name}</h3>
                  <p className="text-gray-600 mb-3">{selectedTeacher.email}</p>
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <Star className={`w-5 h-5 ${getRatingColor(selectedTeacher.rating)}`} />
                    <span className={`font-bold ${getRatingColor(selectedTeacher.rating)}`}>
                      {selectedTeacher.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedTeacher.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedTeacher.status}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Joined</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedTeacher.joinDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Active</p>
                    <p className="font-medium text-gray-900">{formatDateTime(selectedTeacher.lastActive)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Specializations</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedTeacher.specialization.map((spec, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between">
                    <button
                      onClick={() => {/* Send message */}}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Message
                    </button>
                    <button
                      onClick={() => handleToggleStatus(selectedTeacher.id)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedTeacher.status === 'active'
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {selectedTeacher.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Courses & Details */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                <p className="text-gray-700 leading-relaxed">{selectedTeacher.bio}</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Qualifications</h3>
                <div className="space-y-2">
                  {selectedTeacher.qualifications?.map((qualification, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-700">{qualification}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Courses</h3>
                
                {selectedTeacher.assignedCourses.length === 0 ? (
                  <p className="text-gray-600">No courses assigned</p>
                ) : (
                  <div className="space-y-4">
                    {selectedTeacher.assignedCourses.map((course, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{course}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>Students: {Math.floor(Math.random() * 100) + 20}</span>
                              <span>•</span>
                              <span>Completion: {Math.floor(Math.random() * 30) + 70}%</span>
                            </div>
                          </div>
                        </div>
                        <button
                          className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Course Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Student Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedTeacher.rating.toFixed(1)}/5.0</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.floor(Math.random() * 200) + 50}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Course Completion</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.floor(Math.random() * 20) + 75}%</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
                  <div className="space-y-3">
                    {[
                      { action: 'Uploaded new lesson', course: 'Advanced Physics', time: '2 hours ago' },
                      { action: 'Graded assignments', course: 'Calculus for JEE', time: '1 day ago' },
                      { action: 'Responded to discussion', course: 'Advanced Physics', time: '2 days ago' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-gray-900">
                            <span className="font-medium">{activity.action}</span> in {activity.course}
                          </p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Teacher Management</h2>
              <p className="text-gray-600">Manage teacher accounts and course assignments</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              <button className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" />
                <span>Add Teacher</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Teachers</p>
                  <p className="text-3xl font-bold text-gray-900">{teachers.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Teachers</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {teachers.filter(t => t.status === 'active').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Rating</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(teachers.reduce((sum, t) => sum + t.rating, 0) / teachers.length).toFixed(1)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Courses</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {teachers.reduce((sum, t) => sum + t.assignedCourses.length, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search teachers by name, email, or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={filters.specialization}
                  onChange={(e) => setFilters(prev => ({ ...prev, specialization: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Specializations</option>
                  {specializations.map((spec, index) => (
                    <option key={index} value={spec}>{spec}</option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select
                  value={filters.rating}
                  onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Ratings</option>
                  <option value="high">High (≥4.5)</option>
                  <option value="medium">Medium (4.0-4.4)</option>
                  <option value="low">Low (&lt;4.0)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Teachers Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleSort('name')}
                      >
                        <span>Teacher</span>
                        {sortField === 'name' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Courses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleSort('rating')}
                      >
                        <span>Rating</span>
                        {sortField === 'rating' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleSort('lastActive')}
                      >
                        <span>Last Active</span>
                        {sortField === 'lastActive' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleSort('status')}
                      >
                        <span>Status</span>
                        {sortField === 'status' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      </td>
                    </tr>
                  ) : filteredAndSortedTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No teachers found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedTeachers.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              {teacher.avatar ? (
                                <img 
                                  src={teacher.avatar} 
                                  alt={teacher.name} 
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                teacher.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{teacher.name}</p>
                              <p className="text-sm text-gray-600">{teacher.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {teacher.specialization.map((spec, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {teacher.assignedCourses.map((course, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                                title={course}
                              >
                                {course.length > 15 ? course.substring(0, 15) + '...' : course}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1">
                            <Star className={`w-4 h-4 ${getRatingColor(teacher.rating)}`} />
                            <span className={`font-medium ${getRatingColor(teacher.rating)}`}>
                              {teacher.rating.toFixed(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(teacher.lastActive)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            teacher.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {teacher.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewTeacher(teacher)}
                              className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="View Teacher"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => {/* Send email */}}
                              className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Send Email"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleToggleStatus(teacher.id)}
                              className={`p-1 rounded transition-colors ${
                                teacher.status === 'active'
                                  ? 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={teacher.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {teacher.status === 'active' ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleDeleteTeacher(teacher.id)}
                              className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Teacher"
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

export default TeacherManagement;