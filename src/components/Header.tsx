import React from 'react';
import { BookOpen, User, Settings, Gamepad2, Coins, Bell, Search } from 'lucide-react';
import { config, isFeatureEnabled } from '../config/env.ts';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity group"
              onClick={() => onViewChange('dashboard')}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">✨</span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {config.app.title.split(' - ')[0]}
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Learning Platform</p>
                {config.app.environment !== 'production' && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                    {config.app.environment}
                  </span>
                )}
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-2 ml-8">
              <button
                onClick={() => onViewChange('dashboard')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 ${
                  currentView === 'dashboard'
                    ? 'text-blue-600 bg-blue-50 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs">🏠</span>
                </div>
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => onViewChange('board-selector')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 ${
                  currentView === 'board-selector' || currentView === 'board-courses' 
                    ? 'text-purple-600 bg-purple-50 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="w-5 h-5 bg-gradient-to-br from-purple-400 to-purple-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs">🎓</span>
                </div>
                <span>Boards & Exams</span>
              </button>
              <button
                onClick={() => onViewChange('courses')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 ${
                  currentView === 'courses'
                    ? 'text-blue-600 bg-blue-50 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 rounded flex items-center justify-center">
                  <BookOpen className="w-3 h-3 text-white" />
                </div>
                <span>Courses</span>
              </button>
              <button
                onClick={() => isFeatureEnabled('gaming') && onViewChange('gaming')}
                disabled={!isFeatureEnabled('gaming')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 ${
                  !isFeatureEnabled('gaming') ? 'opacity-50 cursor-not-allowed' :
                  currentView === 'gaming' || currentView === 'tournament' || currentView === 'teams' || currentView === 'battle'
                    ? 'text-purple-600 bg-purple-50 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="w-5 h-5 bg-gradient-to-br from-purple-400 to-pink-600 rounded flex items-center justify-center">
                  <Gamepad2 className="w-3 h-3 text-white" />
                </div>
                <span>Gaming</span>
                {isFeatureEnabled('gaming') && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </button>
              <button
                onClick={() => onViewChange('progress')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 ${
                  currentView === 'progress'
                    ? 'text-blue-600 bg-blue-50 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-red-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs">📊</span>
                </div>
                <span>Progress</span>
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Search */}
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Search className="w-5 h-5" />
            </button>
            
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </button>
            
            {/* Coins */}
            <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg">
              <div className="w-5 h-5 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Coins className="w-3 h-3" />
              </div>
              <span className="text-sm font-bold">1,850</span>
            </div>
            
            {/* Settings */}
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            
            {/* Profile */}
            <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </button>
            <button
              onClick={() => onViewChange('admin')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 ${
                currentView === 'admin'
                  ? 'text-red-600 bg-red-50 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="w-5 h-5 bg-gradient-to-br from-red-400 to-pink-600 rounded flex items-center justify-center">
                <span className="text-white text-xs">👑</span>
              </div>
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;