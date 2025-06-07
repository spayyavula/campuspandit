import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Wifi, WifiOff, RefreshCw, Share2 } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

const PWAPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isOnline, isUpdateAvailable, installApp, updateApp, shareApp } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    if (isInstallable && !isInstalled) {
      const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
      if (!hasSeenPrompt) {
        setTimeout(() => setShowInstallPrompt(true), 3000);
      }
    }
  }, [isInstallable, isInstalled]);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineNotice(true);
      setTimeout(() => setShowOfflineNotice(false), 5000);
    }
  }, [isOnline]);

  useEffect(() => {
    if (isUpdateAvailable) {
      setShowUpdatePrompt(true);
    }
  }, [isUpdateAvailable]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowInstallPrompt(false);
      localStorage.setItem('pwa-install-prompt-seen', 'true');
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
  };

  const handleUpdate = () => {
    updateApp();
    setShowUpdatePrompt(false);
  };

  const handleShare = async () => {
    await shareApp();
  };

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 z-50 animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Install CampusPandit</h3>
                <p className="text-sm text-gray-600">Get the full app experience</p>
              </div>
            </div>
            <button
              onClick={handleDismissInstall}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Monitor className="w-4 h-4" />
              <span>Works offline</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Download className="w-4 h-4" />
              <span>Fast loading</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Smartphone className="w-4 h-4" />
              <span>Native app feel</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl py-3 px-4 font-medium hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Install App</span>
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Offline Notice */}
      {showOfflineNotice && (
        <div className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-orange-100 border border-orange-200 rounded-xl p-4 z-50 animate-slide-down">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <WifiOff className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-orange-900">You're offline</h4>
              <p className="text-sm text-orange-700">Some features may be limited</p>
            </div>
          </div>
        </div>
      )}

      {/* Online Notice */}
      {!showOfflineNotice && !isOnline && (
        <div className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-green-100 border border-green-200 rounded-xl p-4 z-50 animate-slide-down">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Wifi className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-green-900">Back online!</h4>
              <p className="text-sm text-green-700">All features are now available</p>
            </div>
          </div>
        </div>
      )}

      {/* Update Prompt */}
      {showUpdatePrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-50 border border-blue-200 rounded-2xl p-6 z-50 animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900">Update Available</h3>
                <p className="text-sm text-blue-700">New features and improvements</p>
              </div>
            </div>
            <button
              onClick={() => setShowUpdatePrompt(false)}
              className="text-blue-400 hover:text-blue-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={handleUpdate}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl py-3 px-4 font-medium hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Update Now</span>
          </button>
        </div>
      )}

      {/* Connection Status Indicator */}
      <div className="fixed top-4 right-4 z-40">
        <div className={`w-3 h-3 rounded-full transition-colors ${
          isOnline ? 'bg-green-500' : 'bg-red-500'
        }`} title={isOnline ? 'Online' : 'Offline'} />
      </div>
    </>
  );
};

export default PWAPrompt;