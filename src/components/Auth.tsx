import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { User } from 'lucide-react';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, BookOpen, GraduationCap } from 'lucide-react';

interface AuthProps {
  onAuthStateChange: (user: any | null) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthStateChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        onAuthStateChange(data.session.user);
      }
    };
    
    checkUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          onAuthStateChange(session.user);
        } else if (event === 'SIGNED_OUT') {
          onAuthStateChange(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [onAuthStateChange]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      setMessage({ text: 'Signed in successfully!', type: 'success' });
      onAuthStateChange(data.user);
    } catch (error: any) {
      setMessage({ text: error.message || 'Error signing in', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email.trim()) {
      setMessage({ text: 'Email is required', type: 'error' });
      return;
    }
    
    if (!password.trim() || password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }
    
    try {
      setLoading(true);
      setMessage(null);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) {
        console.error('Signup error details:', error);
        throw error;
      }
      
      setMessage({ 
        text: data?.user ? 'Signed up successfully! You can now sign in.' : 'Check your email for the confirmation link.', 
        type: 'success' 
      });
      setAuthMode('signin');
    } catch (err: any) {
      console.error('Signup error details:', err);
      setMessage({ 
        text: err.message || 'Error signing up. Please check your connection and try again.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row max-w-5xl w-full">
        {/* Left side - App info */}
        <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-green-500 p-8 md:p-12 rounded-t-xl md:rounded-l-xl md:rounded-tr-none text-white md:w-1/2 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">CampusPandit</h1>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mt-8">Smart Learning Platform</h2>
          <p className="text-lg opacity-90">Interactive learning with gamified education for Physics, Math, and Chemistry</p>
          
          <div className="space-y-4 mt-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <p className="text-white opacity-90">Curriculum-aligned content for all major boards</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-white" />
              </div>
              <p className="text-white opacity-90">Compete with friends in educational battles</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <p className="text-white opacity-90">Comprehensive learning materials and practice tests</p>
            </div>
          </div>
          
          <div className="hidden md:block mt-12 text-sm opacity-75">
            <p>© 2025 CampusPandit. All rights reserved.</p>
          </div>
        </div>
        
        {/* Right side - Auth form */}
        <div className="bg-white p-8 md:p-12 rounded-b-xl md:rounded-r-xl md:rounded-bl-none md:w-1/2 shadow-lg border-t-0 md:border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                <LogIn className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {authMode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {authMode === 'signin' 
              ? 'Access your learning journey' 
              : 'Join our learning platform'}
          </p>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
          }`}>
            {message.text}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp}>
          {authMode === 'signup' && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name (Optional)
              </label>
              <div className="relative">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Your full name"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={authMode === 'signin' ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {authMode === 'signin' && (
            <div className="flex items-center justify-end">
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {authMode === 'signin' ? (
                    <LogIn className="h-5 w-5 text-white" />
                  ) : (
                    <UserPlus className="h-5 w-5 text-white" />
                  )}
                </span>
              )}
              {authMode === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {authMode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;