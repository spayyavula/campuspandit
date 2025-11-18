import React, { useState } from 'react';
import { ArrowRight, BookOpen, Users, Target, TrendingUp, Check, Menu, X, Star, MessageCircle, Award, Brain, Zap, Shield, PlayCircle, Video, BarChart3, VideoIcon, Film, Camera } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-neutral-900">CampusPandit</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">How it works</a>
              <a href="/tutor/register" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">For Tutors</a>
              <a href="#pricing" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Pricing</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <a href="/auth" className="px-4 py-2 text-sm text-primary-500 hover:text-primary-600 transition-colors">
                Log in
              </a>
              <a href="/auth" className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                Sign up free
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-600 hover:text-neutral-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white animate-slide-down">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Features</a>
              <a href="#how-it-works" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">How it works</a>
              <a href="/tutor/register" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">For Tutors</a>
              <a href="#pricing" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Pricing</a>
              <div className="pt-4 space-y-2">
                <a href="/auth" className="block w-full px-4 py-2 text-sm text-primary-500 border border-primary-500 rounded-lg hover:bg-primary-50 transition-colors text-center">
                  Log in
                </a>
                <a href="/auth" className="block w-full px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-center">
                  Sign up free
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="animate-slide-up">
              <div className="inline-block mb-6 px-4 py-2 bg-success-50 text-success-700 rounded-full text-sm font-semibold">
                🎉 First 6 months FREE for students
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight mb-6">
                Master concepts.<br />
                Excel in exams.
              </h1>
              <p className="text-lg sm:text-xl text-neutral-600 mb-8 leading-relaxed">
                Complete learning platform with video courses, recording studio, AI coaching, live tutoring sessions, real-time messaging, CRM tools, and progress tracking. Record like Udemy, learn like never before.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="/auth" className="px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 font-medium">
                  Start free for 6 months
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a href="/tutors" className="px-8 py-4 border-2 border-neutral-200 text-neutral-900 rounded-lg hover:border-neutral-300 transition-colors font-medium text-center">
                  Find a tutor
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-neutral-200">
                <div>
                  <div className="text-2xl font-bold text-primary-500">10k+</div>
                  <div className="text-sm text-neutral-600 mt-1">Students</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-500">500+</div>
                  <div className="text-sm text-neutral-600 mt-1">Expert Tutors</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-500">95%</div>
                  <div className="text-sm text-neutral-600 mt-1">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative animate-fade-in">
              <div className="aspect-square bg-gradient-to-br from-primary-50 to-success-50 rounded-3xl p-8 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-md">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <Brain className="w-6 h-6 text-primary-500" />
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-900">AI Coach</div>
                          <div className="text-sm text-neutral-500">Your learning companion</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-success-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-neutral-900">Physics - Mechanics</div>
                          <div className="text-xs text-success-600 mt-1">85% accuracy - Target reached!</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-4 h-4 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-neutral-900">Calculus - Integration</div>
                          <div className="text-xs text-neutral-500 mt-1">Improving: +15% this week</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Target className="w-4 h-4 text-secondary-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-neutral-900">Chemistry - Organic</div>
                          <div className="text-xs text-neutral-500 mt-1">Practice scheduled for today</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-200">
                      <div className="text-xs text-neutral-500 mb-2">Study streak</div>
                      <div className="flex items-center gap-1">
                        {[...Array(7)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded-full ${
                              i < 5 ? 'bg-primary-500' : 'bg-neutral-200'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-right text-sm font-semibold text-primary-500 mt-2">5 days 🔥</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-neutral-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Complete learning platform. Simple and effective.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1 - Recording Studio (NEW!) */}
            <div className="bg-white p-8 rounded-2xl border-2 border-red-300 hover:border-red-400 hover:shadow-lg transition-all relative">
              <div className="absolute -top-3 -right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                NEW!
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <Camera className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Recording Studio</h3>
              <p className="text-neutral-600 leading-relaxed">
                Record lessons directly in your browser like Udemy! Webcam, screen, or both. No software needed. Pause/resume. Professional quality.
              </p>
            </div>

            {/* Feature Card 2 - Video Library & Courses */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                <PlayCircle className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Video Library & Courses</h3>
              <p className="text-neutral-600 leading-relaxed">
                Browse recorded sessions and courses. Watch anytime, anywhere. Progress tracking. Like and save favorites. Certificates on completion.
              </p>
            </div>

            {/* Feature Card 3 - AI Coaching */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-success-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">AI Coaching</h3>
              <p className="text-neutral-600 leading-relaxed">
                Identify weak areas automatically. Get personalized practice recommendations. Smart spaced repetition for better retention.
              </p>
            </div>

            {/* Feature Card 4 - Live Video Sessions */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mb-6">
                <Video className="w-6 h-6 text-secondary-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Live Tutoring Sessions</h3>
              <p className="text-neutral-600 leading-relaxed">
                One-on-one video sessions with expert tutors. Screen sharing. Interactive whiteboard. Sessions auto-saved to library for review.
              </p>
            </div>

            {/* Feature Card 5 - Expert Tutors */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Global Tutor Network</h3>
              <p className="text-neutral-600 leading-relaxed">
                500+ expert tutors worldwide. Math, Physics, Chemistry, and more. Record and share your lessons. Build your library.
              </p>
            </div>

            {/* Feature Card 6 - Real-time Messaging */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6 text-secondary-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Real-time Messaging</h3>
              <p className="text-neutral-600 leading-relaxed">
                Slack-like messaging with tutors. Instant doubt solving. File sharing. Discussion channels. Always connected.
              </p>
            </div>

            {/* Feature Card 7 - CRM System */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">CRM & Analytics</h3>
              <p className="text-neutral-600 leading-relaxed">
                Track contacts, deals, and activities. Marketing campaigns. Support tickets. Advanced reporting and analytics.
              </p>
            </div>

            {/* Feature Card 8 - Smart Flashcards */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6 text-success-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Smart Flashcards</h3>
              <p className="text-neutral-600 leading-relaxed">
                Spaced repetition algorithm. NotebookLM integration. AI-generated flashcards. Review at optimal intervals.
              </p>
            </div>

            {/* Feature Card 9 - Progress Tracking */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-secondary-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Progress Tracking</h3>
              <p className="text-neutral-600 leading-relaxed">
                Detailed analytics. Performance reports. Weak area identification. Study streaks. Goal tracking. Milestone celebrations.
              </p>
            </div>

            {/* Feature Card 9 - Learning Resources */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-success-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Curated Resources</h3>
              <p className="text-neutral-600 leading-relaxed">
                OpenStax textbooks. Google Learn Your Way. NotebookLM guides. Practice problems. Everything in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Simple, effective learning
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Get started in minutes and see results in weeks
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Sign Up</h3>
              <p className="text-neutral-600">
                Create account. No credit card needed. Free for 6 months.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Get AI Coaching</h3>
              <p className="text-neutral-600">
                AI identifies weak areas. Personalized practice plans generated.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Connect with Tutors</h3>
              <p className="text-neutral-600">
                Book sessions. Chat anytime. Get instant help when stuck.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-success-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                ✓
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Excel & Track</h3>
              <p className="text-neutral-600">
                Monitor progress. Improve scores. Achieve your goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Tutors Section */}
      <section id="tutors" className="py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-block mb-6 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-semibold">
                For Tutors
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-6">
                Teach students worldwide.<br />
                Earn on your schedule.
              </h2>
              <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
                Join 500+ expert tutors teaching Physics, Chemistry, Math, and more. Set your own rates, create your schedule, record your lessons like Udemy, and build a global student base.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Camera className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-1">🆕 Built-in Recording Studio</h4>
                    <p className="text-neutral-600">Record lessons in your browser. Webcam, screen, or both. No software needed. Build your video library!</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-success-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-1">Flexible Schedule</h4>
                    <p className="text-neutral-600">Teach when you want. Set your own availability and rates ($20-$50/hr)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-success-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-1">Global Reach</h4>
                    <p className="text-neutral-600">Connect with students from India and around the world. Build your reputation.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-success-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-1">Complete Platform</h4>
                    <p className="text-neutral-600">Recording studio, video library, messaging, scheduling, whiteboard - everything in one place.</p>
                  </div>
                </div>
              </div>

              <a href="/tutor/register" className="inline-flex px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors items-center gap-2 font-medium">
                Become a Tutor
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>

            {/* Right Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-8 rounded-2xl">
                <div className="text-4xl font-bold text-primary-600 mb-2">$30/hr</div>
                <div className="text-sm text-neutral-600">Average hourly rate</div>
              </div>

              <div className="bg-gradient-to-br from-success-50 to-success-100 p-8 rounded-2xl">
                <div className="text-4xl font-bold text-success-600 mb-2">500+</div>
                <div className="text-sm text-neutral-600">Active tutors</div>
              </div>

              <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 p-8 rounded-2xl">
                <div className="text-4xl font-bold text-secondary-600 mb-2">10k+</div>
                <div className="text-sm text-neutral-600">Students served</div>
              </div>

              <div className="bg-gradient-to-br from-primary-50 to-success-50 p-8 rounded-2xl">
                <div className="text-4xl font-bold text-primary-600 mb-2">4.8★</div>
                <div className="text-sm text-neutral-600">Average rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-neutral-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Start free for 6 months. No credit card required. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white p-8 rounded-2xl border-2 border-neutral-200 hover:border-primary-300 transition-all">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-neutral-900 mb-2">$0</div>
                <div className="text-sm text-neutral-500">First 6 months</div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Video library & courses access</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">AI Coach & weak area identification</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Smart flashcards with spaced repetition</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Progress tracking & analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Access to learning resources</span>
                </li>
              </ul>

              <a href="/auth" className="block w-full px-6 py-3 text-center bg-neutral-100 text-neutral-900 rounded-lg hover:bg-neutral-200 transition-colors font-medium">
                Get Started
              </a>
            </div>

            {/* Student Plan - Highlighted */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-8 rounded-2xl border-2 border-primary-500 shadow-xl relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-secondary-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Student Pro</h3>
                <div className="text-4xl font-bold text-white mb-2">$10</div>
                <div className="text-sm text-primary-100">per month after free period</div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Everything in Free</span>
                </li>
                <li className="flex items-start gap-3">
                  <Camera className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white"><strong>Recording Studio</strong> - Create your own courses</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Live video tutoring sessions</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Real-time messaging with tutors</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">CRM tools & advanced analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Priority support</span>
                </li>
              </ul>

              <a href="/auth" className="block w-full px-6 py-3 text-center bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium">
                Start Free Trial
              </a>
            </div>

            {/* Pay Per Session */}
            <div className="bg-white p-8 rounded-2xl border-2 border-neutral-200 hover:border-primary-300 transition-all">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Pay Per Session</h3>
                <div className="text-4xl font-bold text-neutral-900 mb-2">$25+</div>
                <div className="text-sm text-neutral-500">per hour with tutor</div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">No subscription needed</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Choose from 500+ expert tutors</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Rates from $20-$50/hr</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Book sessions anytime</span>
                </li>
              </ul>

              <a href="/tutors" className="block w-full px-6 py-3 text-center bg-neutral-100 text-neutral-900 rounded-lg hover:bg-neutral-200 transition-colors font-medium">
                Browse Tutors
              </a>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-neutral-600 mb-2">
              All plans include access to OpenStax textbooks, NotebookLM, and Google Learn Your Way
            </p>
            <p className="text-sm text-neutral-500">
              🎉 <strong>Special Offer:</strong> First 6 months completely free for students • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-success-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Loved by students everywhere
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 - Rahul (Boy) */}
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-secondary-500 text-secondary-500" />
                ))}
              </div>
              <p className="text-neutral-700 mb-6 leading-relaxed">
                "CampusPandit's AI coach helped me identify my weak areas in Physics. I improved my accuracy from 60% to 90% in just 6 weeks!"
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"
                  alt="Rahul Kumar"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-100"
                />
                <div>
                  <div className="font-semibold text-neutral-900">Rahul Kumar</div>
                  <div className="text-sm text-neutral-500">JEE Main 2024</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 - Priya (Girl) */}
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-secondary-500 text-secondary-500" />
                ))}
              </div>
              <p className="text-neutral-700 mb-6 leading-relaxed">
                "The tutors are amazing! I can book sessions anytime I'm stuck. The flashcard system with spaced repetition really works."
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces"
                  alt="Priya Sharma"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-success-100"
                />
                <div>
                  <div className="font-semibold text-neutral-900">Priya Sharma</div>
                  <div className="text-sm text-neutral-500">NEET 2024</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 - Ankit (Boy) */}
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-secondary-500 text-secondary-500" />
                ))}
              </div>
              <p className="text-neutral-700 mb-6 leading-relaxed">
                "Best investment in my education. The progress tracking keeps me motivated and the recommendations are spot-on."
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=faces"
                  alt="Ankit Verma"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-secondary-100"
                />
                <div>
                  <div className="font-semibold text-neutral-900">Ankit Verma</div>
                  <div className="text-sm text-neutral-500">IB Student</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-6 py-3 bg-success-50 text-success-700 rounded-full text-lg font-bold">
            🎉 First 6 months absolutely FREE
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-neutral-900 mb-6">
            Start learning today
          </h2>
          <p className="text-lg text-neutral-600 mb-8">
            Join 10,000+ students achieving their academic goals with CampusPandit
          </p>
          <a href="/auth" className="inline-flex px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors items-center justify-center gap-2 font-medium text-lg">
            Start free for 6 months
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-sm text-neutral-500 mt-4">No credit card required • Full access for 6 months</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">CampusPandit</span>
              </div>
              <p className="text-neutral-400 text-sm">
                Making quality education accessible to everyone, everywhere.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutors</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AI Coach</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-neutral-400">
              © 2025 CampusPandit. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <Award className="w-5 h-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <Shield className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
