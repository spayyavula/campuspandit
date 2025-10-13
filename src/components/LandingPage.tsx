import React, { useState } from 'react';
import { ArrowRight, BookOpen, Users, Target, TrendingUp, Check, Menu, X, Star, MessageCircle, Award, Brain, Zap, Shield } from 'lucide-react';

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
              <a href="#tutors" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">For Tutors</a>
              <a href="#pricing" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Pricing</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button className="px-4 py-2 text-sm text-primary-500 hover:text-primary-600 transition-colors">
                Log in
              </button>
              <button className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                Sign up
              </button>
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
              <a href="#tutors" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">For Tutors</a>
              <a href="#pricing" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Pricing</a>
              <div className="pt-4 space-y-2">
                <button className="w-full px-4 py-2 text-sm text-primary-500 border border-primary-500 rounded-lg hover:bg-primary-50 transition-colors">
                  Log in
                </button>
                <button className="w-full px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                  Sign up
                </button>
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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight mb-6">
                Master concepts.<br />
                Excel in exams.
              </h1>
              <p className="text-lg sm:text-xl text-neutral-600 mb-8 leading-relaxed">
                Connect with expert tutors worldwide, track your progress with AI coaching, and achieve your academic goals with personalized learning.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 font-medium">
                  Get started free
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="px-8 py-4 border-2 border-neutral-200 text-neutral-900 rounded-lg hover:border-neutral-300 transition-colors font-medium">
                  Find a tutor
                </button>
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
              A comprehensive platform designed for modern learners
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Expert Tutors</h3>
              <p className="text-neutral-600 leading-relaxed">
                Connect with qualified tutors from around the world specializing in Math, Physics, Chemistry, and more.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-success-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">AI Coaching</h3>
              <p className="text-neutral-600 leading-relaxed">
                Get personalized insights, identify weak areas, and receive smart recommendations to improve faster.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-secondary-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Progress Tracking</h3>
              <p className="text-neutral-600 leading-relaxed">
                Monitor your improvement with detailed analytics, performance reports, and milestone celebrations.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Smart Flashcards</h3>
              <p className="text-neutral-600 leading-relaxed">
                Create and study flashcards with spaced repetition algorithm for better retention and recall.
              </p>
            </div>

            {/* Feature Card 5 */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-success-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Goal Setting</h3>
              <p className="text-neutral-600 leading-relaxed">
                Set clear learning goals, track progress toward exams, and stay motivated with structured plans.
              </p>
            </div>

            {/* Feature Card 6 */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-secondary-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Instant Doubt Solving</h3>
              <p className="text-neutral-600 leading-relaxed">
                Book sessions instantly when you're stuck. Get help exactly when you need it most.
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
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Sign Up Free</h3>
              <p className="text-neutral-600">
                Create your account and set your learning goals
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Find Your Tutor</h3>
              <p className="text-neutral-600">
                Browse experts and book your first session
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Learn & Practice</h3>
              <p className="text-neutral-600">
                Study with AI-powered tools and flashcards
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-success-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                ✓
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Excel in Exams</h3>
              <p className="text-neutral-600">
                Track progress and achieve your goals
              </p>
            </div>
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
            {/* Testimonial 1 */}
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
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">RK</span>
                </div>
                <div>
                  <div className="font-semibold text-neutral-900">Rahul Kumar</div>
                  <div className="text-sm text-neutral-500">JEE Main 2024</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
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
                <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                  <span className="text-success-600 font-semibold">PS</span>
                </div>
                <div>
                  <div className="font-semibold text-neutral-900">Priya Sharma</div>
                  <div className="text-sm text-neutral-500">NEET 2024</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
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
                <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                  <span className="text-secondary-600 font-semibold">AV</span>
                </div>
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
          <h2 className="text-3xl sm:text-5xl font-bold text-neutral-900 mb-6">
            Start your learning journey today
          </h2>
          <p className="text-lg text-neutral-600 mb-8">
            Join thousands of students who are achieving their academic goals with CampusPandit
          </p>
          <button className="px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 font-medium mx-auto text-lg">
            Get started for free
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-neutral-500 mt-4">No credit card required • Free forever</p>
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
