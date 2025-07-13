import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { User, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, BookOpen, GraduationCap, Zap, Trophy, Target, Brain, Rocket, Star, Award, Shield, Users } from 'lucide-react';

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
        setMessage({ 
          text: `Authentication error: ${error.message || 'Connection failed. Please try again later.'}`, 
          type: 'error' 
        });
        return;
      }
      
      setMessage({ 
        text: data?.user ? 'Signed up successfully! You can now sign in.' : 'Check your email for the confirmation link.', 
        type: 'success' 
      });
      setAuthMode('signin');
    } catch (err: any) {
      console.error('Signup error details:', err);
      setMessage({ 
        text: 'Connection error. Please check your internet connection and try again later.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row max-w-5xl w-full">
        {/* Left side - Animated App info */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 md:p-12 rounded-t-xl md:rounded-l-xl md:rounded-tr-none text-white md:w-1/2 space-y-6 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white animate-pulse"></div>
            <div className="absolute top-40 right-20 w-16 h-16 rounded-full bg-white animate-ping" style={{animationDuration: '3s'}}></div>
            <div className="absolute bottom-20 left-1/4 w-24 h-24 rounded-full bg-white animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/3 right-1/3 w-12 h-12 rounded-full bg-white animate-ping" style={{animationDuration: '4s', animationDelay: '2s'}}></div>
          </div>
          
          <div className="flex items-center space-x-3 relative">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
              <Rocket className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold">CampusPandit</h1>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mt-8 leading-tight">Unlock Your <span className="bg-white bg-opacity-20 px-2 rounded">Genius</span> Potential</h2>
          <p className="text-xl opacity-90 leading-relaxed">Not just another learning platform. A revolution in interactive, gamified education that makes learning addictive.</p>
          
          <div className="space-y-5 mt-10">
            <div className="flex items-center space-x-4 transform hover:translate-x-2 transition-transform">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-md">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <p className="text-white text-lg font-medium">AI-powered personalized learning paths</p>
            </div>
            <div className="flex items-center space-x-4 transform hover:translate-x-2 transition-transform">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-md">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <p className="text-white text-lg font-medium">Compete in live tournaments & win prizes</p>
            </div>
            <div className="flex items-center space-x-4 transform hover:translate-x-2 transition-transform">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <p className="text-white text-lg font-medium">Learn 3x faster with our proven methods</p>
            </div>
          </div>
          
          <div className="mt-12 pt-6 border-t border-white border-opacity-20">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-3xl font-bold">10k+</div>
                <div className="text-sm opacity-75">Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">95%</div>
                <div className="text-sm opacity-75">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm opacity-75">Top Ranks</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Auth form */}
        <div className="bg-white p-8 md:p-12 rounded-b-xl md:rounded-r-xl md:rounded-bl-none md:w-1/2 shadow-xl border-t-0 md:border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform">
                <LogIn className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {authMode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            {authMode === 'signin' 
              ? 'Resume your learning adventure' 
              : 'Begin your journey to academic excellence'}
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
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                What should we call you?
              </label>
              <div className="relative">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Your name (optional)"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                placeholder="your.email@example.com"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                placeholder="••••••••"
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
              <div className="text-sm transform hover:translate-x-1 transition-transform">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500 flex items-center">
                  Forgot your password?
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || (authMode === 'signup' && !email && !password)}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transform hover:scale-105 transition-transform"
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
                    <LogIn className="h-5 w-5 text-white group-hover:animate-pulse" />
                  ) : (
                    <UserPlus className="h-5 w-5 text-white group-hover:animate-pulse" />
                  )}
                </span>
              )}
              {authMode === 'signin' ? 'Launch Your Learning Journey' : 'Join the Learning Revolution'}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
            className="font-medium text-blue-600 hover:text-blue-500 transform hover:scale-105 transition-transform"
          >
            {authMode === 'signin'
              ? "New to CampusPandit? Create an account →"
              : '← Already have an account? Sign in'}
          </button>
        </div>
        
        {/* Testimonials */}
        {authMode === 'signup' && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">What our students say</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
                    R
                  </div>
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400" fill="#facc15" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 italic">"CampusPandit helped me secure a top rank in JEE. The interactive learning and competition features kept me motivated throughout my preparation."</p>
                  <p className="text-xs text-gray-500 mt-1">— Rahul S., IIT Delhi</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Trust indicators */}
        <div className="mt-8">
          <div className="flex flex-wrap justify-center items-center gap-4 text-gray-400 text-xs">
            <div className="flex items-center">
              <Award className="w-4 h-4 mr-1" />
              <span>ISO Certified</span>
            </div>
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span>10,000+ Students</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;