import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface AuthProps {
  onAuthStateChange?: (user: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthStateChange }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'tutor'>('student');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
              role: role, // Pass selected role to user metadata
            },
          },
        });

        if (error) throw error;

        setMessage({
          type: 'success',
          text: 'Account created! Please check your email to verify your account.',
        });

        // Auto-switch to login after 2 seconds
        setTimeout(() => {
          setMode('login');
          setPassword('');
        }, 2000);
      } else if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setMessage({ type: 'success', text: 'Login successful!' });

        if (onAuthStateChange && data.user) {
          onAuthStateChange(data.user);
        }

        // Redirect to coach page
        setTimeout(() => {
          navigate('/coach');
        }, 500);
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) throw error;

        setMessage({
          type: 'success',
          text: 'Password reset email sent! Check your inbox.',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-neutral-900">CampusPandit</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Auth Form */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'reset' && 'Reset password'}
            </h1>
            <p className="text-neutral-600">
              {mode === 'login' && 'Sign in to continue learning'}
              {mode === 'signup' && 'Start your learning journey today'}
              {mode === 'reset' && 'Enter your email to reset your password'}
            </p>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                message.type === 'error'
                  ? 'bg-error-50 text-error-700 border border-error-200'
                  : 'bg-success-50 text-success-700 border border-success-200'
              }`}
            >
              {message.type === 'error' ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    I am a...
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        role === 'student'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">🎓</div>
                        <div className="font-semibold">Student</div>
                        <div className="text-xs mt-1 opacity-75">Learn and grow</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('tutor')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        role === 'tutor'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">👨‍🏫</div>
                        <div className="font-semibold">Tutor</div>
                        <div className="text-xs mt-1 opacity-75">Teach students</div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your password"
                    minLength={6}
                  />
                </div>
                {mode === 'signup' && (
                  <p className="mt-1 text-xs text-neutral-500">Must be at least 6 characters</p>
                )}
              </div>
            )}

            {/* Forgot Password Link */}
            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  {mode === 'login' && 'Sign in'}
                  {mode === 'signup' && 'Create account'}
                  {mode === 'reset' && 'Send reset email'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 text-center">
            {mode === 'login' && (
              <p className="text-sm text-neutral-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setMessage(null);
                  }}
                  className="text-primary-600 font-medium hover:text-primary-700"
                >
                  Sign up
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p className="text-sm text-neutral-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setMessage(null);
                  }}
                  className="text-primary-600 font-medium hover:text-primary-700"
                >
                  Sign in
                </button>
              </p>
            )}

            {mode === 'reset' && (
              <p className="text-sm text-neutral-600">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setMessage(null);
                  }}
                  className="text-primary-600 font-medium hover:text-primary-700"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Free Trial Banner */}
          {mode === 'signup' && (
            <div className="mt-8 p-4 bg-success-50 border border-success-200 rounded-lg text-center">
              <p className="text-sm font-semibold text-success-700">
                🎉 First 6 months absolutely FREE
              </p>
              <p className="text-xs text-success-600 mt-1">No credit card required</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-neutral-500">
            © 2025 CampusPandit. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
