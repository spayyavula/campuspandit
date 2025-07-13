import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Edit, Trash2, Eye, Mail, Clock, CheckCircle, XCircle, Plus, Download, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';

interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  enrolledCourses: string[];
  progress: number;
  lastActive: string;
  joinDate: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('lastActive');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    grade: '',
    status: '',
    progress: ''
  });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);

  // Sample student data
  const sampleStudents: Student[] = [
    {
      id: '1',
      name: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      grade: 'Grade 12',
      enrolledCourses: ['Advanced Physics', 'Calculus for JEE'],
      progress: 78,
      lastActive: '2025-01-20T14:30:00Z',
      joinDate: '2024-09-05T10:00:00Z',
      status: 'active'
    },
    {
      id: '2',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      grade: 'Grade 11',
      enrolledCourses: ['Organic Chemistry', 'Algebra and Coordinate Geometry'],
      progress: 65,
      lastActive: '2025-01-19T09:15:00Z',
      joinDate: '2024-08-12T11:30:00Z',
      status: 'active'
    },
    {
      id: '3',
      name: 'Michael Chen',
      email: 'michael.chen@example.com',
      grade: 'A Level',
      enrolledCourses: ['Advanced Physics', 'Organic Chemistry', 'Calculus for JEE'],
      progress: 92,
      lastActive: '2025-01-20T16:45:00Z',
      joinDate: '2024-07-22T08:00:00Z',
      status: 'active'
    },
    {
      id: '4',
      name: 'Sarah Williams',
      email: 'sarah.williams@example.com',
      grade: 'Grade 10',
      enrolledCourses: ['Biology: Human Physiology'],
      progress: 34,
      lastActive: '2025-01-10T12:00:00Z',
      joinDate: '2024-10-15T10:00:00Z',
      status: 'inactive'
    },
    {
      id: '5',
      name: 'Raj Patel',
      email: 'raj.patel@example.com',
      grade: 'DP2',
      enrolledCourses: ['Organic Chemistry', 'Biology: Human Physiology'],
      progress: 85,
      lastActive: '2025-01-18T15:20:00Z',
      joinDate: '2024-09-01T09:30:00Z',
      status: 'active'
    }
  ];

  useEffect(() => {
    // In a real app, fetch students from Supabase
    // For now, use sample data
    setStudents(sampleStudents);
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

  const filteredAndSortedStudents = students
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGrade = !filters.grade || student.grade === filters.grade;
      const matchesStatus = !filters.status || student.status === filters.status;
      const matchesProgress = !filters.progress || 
                             (filters.progress === 'high' && student.progress >= 75) ||
                             (filters.progress === 'medium' && student.progress >= 50 && student.progress < 75) ||
                             (filters.progress === 'low' && student.progress < 50);
      
      return matchesSearch && matchesGrade && matchesStatus && matchesProgress;
    })
    .sort((a, b) => {
      const fieldA = a[sortField as keyof Student];
      const fieldB = b[sortField as keyof Student];
      
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

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
  };

  const handleToggleStatus = (studentId: string) => {
    setStudents(students.map(student => 
      student.id === studentId 
        ? { ...student, status: student.status === 'active' ? 'inactive' : 'active' }
        : student
    ));
  };

  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      setStudents(students.filter(student => student.id !== studentId));
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  const grades = ['Grade 10', 'Grade 11', 'Grade 12', 'A Level', 'DP1', 'DP2'];

  return (
    <div className="space-y-6">
      {showStudentDetails && selectedStudent ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Student Profile
            </h2>
            <button
              onClick={() => setShowStudentDetails(false)}
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
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                    {selectedStudent.avatar ? (
                      <img 
                        src={selectedStudent.avatar} 
                        alt={selectedStudent.name} 
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      selectedStudent.name.charAt(0)
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedStudent.name}</h3>
                  <p className="text-gray-600 mb-3">{selectedStudent.email}</p>
                  <div className="flex items-center justify-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedStudent.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedStudent.status}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {selectedStudent.grade}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Joined</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedStudent.joinDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Active</p>
                    <p className="font-medium text-gray-900">{formatDateTime(selectedStudent.lastActive)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Overall Progress</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${getProgressColor(selectedStudent.progress)}`}
                          style={{ width: `${selectedStudent.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{selectedStudent.progress}%</span>
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
                      onClick={() => handleToggleStatus(selectedStudent.id)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedStudent.status === 'active'
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {selectedStudent.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Enrolled Courses & Activity */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrolled Courses</h3>
                
                {selectedStudent.enrolledCourses.length === 0 ? (
                  <p className="text-gray-600">No courses enrolled</p>
                ) : (
                  <div className="space-y-4">
                    {selectedStudent.enrolledCourses.map((course, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{course}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>Progress: {Math.floor(Math.random() * 100)}%</span>
                              <span>•</span>
                              <span>Last accessed: {format(new Date(selectedStudent.lastActive), 'MMM d')}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Course Progress"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                
                <div className="space-y-4">
                  {[
                    { action: 'Completed lesson', target: 'Newton\'s Laws of Motion', time: '2 hours ago', icon: CheckCircle, iconColor: 'text-green-500' },
                    { action: 'Started quiz', target: 'Organic Chemistry Test 3', time: '1 day ago', icon: Play, iconColor: 'text-blue-500' },
                    { action: 'Submitted assignment', target: 'Calculus Problem Set 2', time: '2 days ago', icon: Upload, iconColor: 'text-purple-500' },
                    { action: 'Posted in discussion', target: 'Understanding Quantum Mechanics', time: '3 days ago', icon: MessageSquare, iconColor: 'text-orange-500' }
                  ].map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white ${activity.iconColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-gray-900">
                            <span className="font-medium">{activity.action}</span>
                            {' '}{activity.target}
                          </p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Average Score</p>
                    <p className="text-2xl font-bold text-gray-900">87%</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Assignments Completed</p>
                    <p className="text-2xl font-bold text-gray-900">24/30</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Study Time</p>
                    <p className="text-2xl font-bold text-gray-900">42h 30m</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Subject Performance</h4>
                  <div className="space-y-3">
                    {[
                      { subject: 'Physics', score: 92 },
                      { subject: 'Chemistry', score: 78 },
                      { subject: 'Mathematics', score: 85 }
                    ].map((subject, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">{subject.subject}</span>
                          <span className="text-sm font-medium text-gray-900">{subject.score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(subject.score)}`}
                            style={{ width: `${subject.score}%` }}
                          ></div>
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
              <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
              <p className="text-gray-600">Manage student accounts and track their progress</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900">{students.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Students</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {students.filter(s => s.status === 'active').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Progress</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New This Month</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {students.filter(s => new Date(s.joinDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-orange-600" />
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
                    placeholder="Search students by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={filters.grade}
                  onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Grades</option>
                  {grades.map((grade, index) => (
                    <option key={index} value={grade}>{grade}</option>
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
                  value={filters.progress}
                  onChange={(e) => setFilters(prev => ({ ...prev, progress: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Progress</option>
                  <option value="high">High (≥75%)</option>
                  <option value="medium">Medium (50-74%)</option>
                  <option value="low">Low (<50%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Students Table */}
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
                        <span>Student</span>
                        {sortField === 'name' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleSort('grade')}
                      >
                        <span>Grade</span>
                        {sortField === 'grade' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Courses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => toggleSort('progress')}
                      >
                        <span>Progress</span>
                        {sortField === 'progress' && (
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
                  ) : filteredAndSortedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No students found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {student.avatar ? (
                                <img 
                                  src={student.avatar} 
                                  alt={student.name} 
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                student.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-600">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {student.grade}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {student.enrolledCourses.map((course, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                title={course}
                              >
                                {course.length > 15 ? course.substring(0, 15) + '...' : course}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${getProgressColor(student.progress)}`}
                                style={{ width: `${student.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{student.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(student.lastActive)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewStudent(student)}
                              className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="View Student"
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
                              onClick={() => handleToggleStatus(student.id)}
                              className={`p-1 rounded transition-colors ${
                                student.status === 'active'
                                  ? 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={student.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {student.status === 'active' ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Student"
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

export default StudentManagement;