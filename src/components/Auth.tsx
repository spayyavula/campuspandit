
import React, { useState } from 'react';
import { Rocket, Brain, Trophy, Zap, Star, Award, Shield, Users, LogIn } from 'lucide-react';


const Auth: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);

  // Add missing state and handlers
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    optin: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMessage('This is a demo. No real authentication.');
    }, 200);
  };
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Progress Bar */}
        {loading && (
          <div className="fixed top-0 left-0 w-full z-50">
            <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 animate-pulse relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-white/70 animate-progressbar" style={{ width: '40%' }} />
            </div>
            <style>{`
              @keyframes progressbar {
                0% { left: -40%; width: 40%; }
                50% { left: 30%; width: 60%; }
                100% { left: 100%; width: 40%; }
              }
              .animate-progressbar {
                animation: progressbar 1s linear infinite;
              }
            `}</style>
          </div>
        )}
        {/* Animated floating shapes */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-pink-400 opacity-30 blur-2xl animate-pulse" />
          <div className="absolute top-1/2 right-20 w-32 h-32 rounded-full bg-blue-400 opacity-20 blur-2xl animate-ping" style={{animationDuration: '3s'}} />
          <div className="absolute bottom-20 left-1/4 w-56 h-56 rounded-full bg-purple-400 opacity-20 blur-2xl animate-pulse" style={{animationDelay: '1s'}} />
          <div className="absolute top-1/3 right-1/3 w-24 h-24 rounded-full bg-yellow-400 opacity-20 blur-2xl animate-ping" style={{animationDuration: '4s', animationDelay: '2s'}} />
        </div>
        {/* Hero Section */}
        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center py-16 px-4 md:px-0">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
              <Rocket className="w-8 h-8 text-white" />
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">CampusPandit</h1>
          </div>
          <h2 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 text-transparent bg-clip-text mb-6 drop-shadow-xl animate-fade-in-up">India's Most Addictive Learning Platform</h2>
          <p className="text-2xl md:text-3xl text-white/90 font-medium mb-10 max-w-2xl mx-auto animate-fade-in-up delay-100">Gamified, AI-powered, and 100% FREE. Join 10,000+ students who are learning smarter, not harder.</p>
          <div className="flex flex-wrap justify-center gap-8 mb-12 animate-fade-in-up delay-200">
            <div className="flex flex-col items-center">
              <Brain className="w-10 h-10 text-yellow-300 mb-2 animate-bounce" />
              <span className="text-lg text-white font-semibold">Personalized AI Learning</span>
            </div>
            <div className="flex flex-col items-center">
              <Trophy className="w-10 h-10 text-pink-300 mb-2 animate-bounce delay-100" />
              <span className="text-lg text-white font-semibold">Live Tournaments</span>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-10 h-10 text-purple-300 mb-2 animate-bounce delay-200" />
              <span className="text-lg text-white font-semibold">3x Faster Learning</span>
            </div>
          </div>
          <button
            className="px-12 py-5 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 text-2xl font-extrabold rounded-full shadow-2xl hover:scale-105 hover:from-yellow-500 hover:to-purple-700 transition-transform flex items-center gap-3 ring-4 ring-yellow-300/30 animate-glow"
            onClick={() => setShowLogin(true)}
          >
            <LogIn className="w-7 h-7" />
            Get Started
          </button>
          {showLogin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full relative animate-fade-in-up">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                  onClick={() => setShowLogin(false)}
                  aria-label="Close"
                >
                  ×
                </button>
                <div className="text-center mb-6">
                  <LogIn className="w-10 h-10 mx-auto text-blue-600 mb-2" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    {mode === 'register' ? 'Register for CampusPandit' : mode === 'forgot' ? 'Reset Password' : 'Sign in to CampusPandit'}
                  </h2>
                  <p className="text-gray-600">
                    {mode === 'register' ? 'Create your free account' : mode === 'forgot' ? 'Enter your email to reset password' : 'Resume your learning adventure'}
                  </p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {mode === 'register' && (
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg px-4 py-2"
                        placeholder="Your Name"
                      />
                    </div>
                  )}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg px-4 py-2"
                      placeholder="you@example.com"
                    />
                  </div>
                  {mode !== 'forgot' && (
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        value={form.password}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg px-4 py-2"
                        placeholder="••••••••"
                      />
                    </div>
                  )}
                  {mode === 'register' && (
                    <div className="flex items-center">
                      <input
                        id="optin"
                        name="optin"
                        type="checkbox"
                        checked={form.optin}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="optin" className="ml-2 block text-sm text-gray-700">
                        I want to receive updates and offers from CampusPandit
                      </label>
                    </div>
                  )}
                  {message && (
                    <div className="text-center text-sm font-medium text-red-600">{message}</div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-6 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 text-white text-xl font-bold rounded-full shadow-lg hover:scale-105 transition-transform mt-2 disabled:opacity-60"
                  >
                    {loading ? 'Please wait...' : mode === 'register' ? 'Register' : mode === 'login' ? 'Login' : 'Send Reset Email'}
                  </button>
                </form>
                <div className="mt-4 flex flex-col items-center gap-2">
                  {mode === 'login' && (
                    <>
                      <button type="button" className="text-blue-600 hover:underline text-sm" onClick={() => { setMode('register'); setMessage(null); }}>
                        New here? Register
                      </button>
                      <button type="button" className="text-blue-600 hover:underline text-sm" onClick={() => { setMode('forgot'); setMessage(null); }}>
                        Forgot password?
                      </button>
                    </>
                  )}
                  {mode === 'register' && (
                    <button type="button" className="text-blue-600 hover:underline text-sm" onClick={() => { setMode('login'); setMessage(null); }}>
                      Already have an account? Login
                    </button>
                  )}
                  {mode === 'forgot' && (
                    <button type="button" className="text-blue-600 hover:underline text-sm" onClick={() => { setMode('login'); setMessage(null); }}>
                      Back to Login
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Auth;