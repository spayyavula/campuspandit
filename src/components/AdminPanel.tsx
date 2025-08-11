import React, { useState } from 'react';
import { Tabs, Tab } from './ui/Tabs';
import CourseManager from './admin/CourseManager';
import ContentUploader from './admin/ContentUploader';
import StudentManagement from './admin/StudentManagement';
import TeacherManagement from './admin/TeacherManagement';
import DiscussionForums from './admin/DiscussionForums';
import Analytics from './admin/Analytics';
import { Shield, BookOpen, Upload, Users, MessageSquare, BarChart3 } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('courses');

  const tabs = [
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'content', label: 'Content Library', icon: Upload },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Manage courses, content, and users</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'courses' && <CourseManager />}
        {activeTab === 'content' && <ContentUploader />}
        {activeTab === 'students' && <StudentManagement />}
        {activeTab === 'teachers' && <TeacherManagement />}
        {activeTab === 'discussions' && <DiscussionForums />}
        {activeTab === 'analytics' && <Analytics />}
      </div>
    </div>
  );
};

export default AdminPanel;