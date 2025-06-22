import React, { useState } from 'react';
import { 
  BookOpen, 
  User, 
  Settings, 
  Gamepad2, 
  ChevronRight, 
  ChevronLeft,
  Home,
  GraduationCap,
  BarChart3,
  FileText,
  Shield,
  Menu
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'board-selector', label: 'Boards & Exams', icon: GraduationCap },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'questions', label: 'Questions', icon: FileText },
    { id: 'admin', label: 'Admin', icon: Shield },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <button
          onClick={toggleMobileMenu}
          className="p-2 bg-white rounded-lg shadow-md text-gray-700 hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0
          fixed lg:static
          z-50 lg:z-0
          h-full
          ${collapsed ? 'w-20' : 'w-64'}
          bg-white border-r border-gray-200 shadow-sm
          transition-all duration-300 ease-in-out
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className={`p-4 border-b border-gray-200 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CampusPandit
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Learning Platform</p>
              </div>
            )}
          </div>
          
          {/* Toggle button */}
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors lg:block hidden"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onViewChange(item.id);
                      if (mobileMenuOpen) setMobileMenuOpen(false);
                    }}
                    className={`text-base
                      w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start'} 
                      p-3 rounded-lg transition-colors
                      ${currentView === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className={`w-6 h-6 ${collapsed ? '' : 'mr-3'}`} />
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className={`p-4 border-t border-gray-200 ${collapsed ? 'items-center' : ''}`}>
          <div className={`flex ${collapsed ? 'justify-center' : 'items-center space-x-3'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <p className="font-medium text-gray-900">User Name</p>
                <p className="text-xs text-gray-500">user@example.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;