import React, { useState } from 'react';
import { ArrowRight, BookOpen, Check, Menu, X, Star, MessageCircle, Award, Brain, Shield, PlayCircle, Video, Target, TrendingUp } from 'lucide-react';
import Seo from './Seo';

const LandingPageStudent: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const studentBreadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.campuspandit.ai/' },
      { '@type': 'ListItem', position: 2, name: 'For Students', item: 'https://www.campuspandit.ai/for-students' },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title="Is Your JEE/NEET Coaching Center Using the Right Tech? — CampusPandit"
        description="Students: if your coaching center still runs on WhatsApp, paper attendance, and Saturday tests, here's what they could be running instead. Tell them about CampusPandit — branded app, AI Coach, parent dashboard."
        canonical="https://www.campuspandit.ai/for-students"
        jsonLd={studentBreadcrumbs}
      />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-neutral-900">CampusPandit</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">How it works</a>
              <a href="#pricing" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Pricing</a>
              <a href="/tutor/register" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">For tutors</a>
              <a href="/blog" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Blog</a>
              <a href="/materials" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Materials</a>
              <a href="/roadmap" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Roadmap</a>
              <a href="/ideas" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Ideas</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <a href="mailto:founders@campuspandit.ai?subject=Tell%20us%20about%20your%20coaching%20center&body=I%20study%20at%20a%20coaching%20center%20that%20might%20benefit%20from%20CampusPandit.%0A%0ACoaching%20center%20name%3A%0ALocation%3A%0AWebsite%2FInstagram%3A%0A" className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                Tell your coaching center about CampusPandit
              </a>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-600 hover:text-neutral-900"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white animate-slide-down">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Features</a>
              <a href="#how-it-works" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">How it works</a>
              <a href="#pricing" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Pricing</a>
              <a href="/tutor/register" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">For tutors</a>
              <a href="/blog" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Blog</a>
              <a href="/materials" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Materials</a>
              <a href="/roadmap" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Roadmap</a>
              <a href="/ideas" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Ideas</a>
              <div className="pt-4 space-y-2">
                <a href="mailto:founders@campuspandit.ai?subject=Tell%20us%20about%20your%20coaching%20center&body=I%20study%20at%20a%20coaching%20center%20that%20might%20benefit%20from%20CampusPandit.%0A%0ACoaching%20center%20name%3A%0ALocation%3A%0AWebsite%2FInstagram%3A%0A" className="block w-full px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-center">
                  Tell your coaching center about CampusPandit
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
            <div className="animate-slide-up">
              <div className="inline-block mb-6 px-4 py-2 bg-success-50 text-success-700 rounded-full text-sm font-semibold">
                🎉 First 6 months free — no card required
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight mb-6">
                Crack JEE &amp; NEET<br />
                with an AI coach that knows<br />
                your weak spots.
              </h1>
              <p className="text-lg sm:text-xl text-neutral-600 mb-8 leading-relaxed">
                Personalized practice, expert tutors on demand, and recorded lessons you can rewatch. Built for Class 11–12 aspirants.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="mailto:founders@campuspandit.ai?subject=Tell%20us%20about%20your%20coaching%20center&body=I%20study%20at%20a%20coaching%20center%20that%20might%20benefit%20from%20CampusPandit.%0A%0ACoaching%20center%20name%3A%0ALocation%3A%0AWebsite%2FInstagram%3A%0A" className="px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 font-medium">
                  Tell your coaching center about CampusPandit
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a href="/tutors" className="px-8 py-4 border-2 border-neutral-200 text-neutral-900 rounded-lg hover:border-neutral-300 transition-colors font-medium text-center">
                  Find a tutor
                </a>
              </div>

              {/* Trust strip — verifiable claims only */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-neutral-200">
                <div>
                  <div className="text-sm font-semibold text-neutral-900">JEE Main</div>
                  <div className="text-sm font-semibold text-neutral-900">JEE Advanced</div>
                  <div className="text-sm font-semibold text-neutral-900">NEET</div>
                  <div className="text-xs text-neutral-500 mt-1">Aligned syllabi</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900">Physics</div>
                  <div className="text-sm font-semibold text-neutral-900">Chemistry</div>
                  <div className="text-sm font-semibold text-neutral-900">Math &amp; Biology</div>
                  <div className="text-xs text-neutral-500 mt-1">Class 11 &amp; 12</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900">AI Coach</div>
                  <div className="text-sm font-semibold text-neutral-900">Live tutors</div>
                  <div className="text-sm font-semibold text-neutral-900">Video library</div>
                  <div className="text-xs text-neutral-500 mt-1">All in one place</div>
                </div>
              </div>
            </div>

            {/* AI Coach mockup — illustrative */}
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
                          <div className="text-sm text-neutral-500">Your weekly plan</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-success-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-neutral-900">Physics — Mechanics</div>
                          <div className="text-xs text-success-600 mt-1">Mastered — moving to Rotational</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-4 h-4 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-neutral-900">Math — Integration</div>
                          <div className="text-xs text-neutral-500 mt-1">Improving — 8 problems left this week</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Target className="w-4 h-4 text-secondary-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-neutral-900">Chemistry — Organic</div>
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
              <p className="text-xs text-neutral-400 text-center mt-3">Illustrative preview of the AI Coach dashboard</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section — 3 cards, student-facing only */}
      <section id="features" className="py-20 bg-neutral-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Three ways to level up
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Coaching, live help, and lessons you can rewatch — designed for the JEE/NEET grind.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* AI Coach */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">AI Coach</h3>
              <p className="text-neutral-600 leading-relaxed">
                Finds the chapters and problem types you're weakest on, then builds a weekly practice plan around them. Spaced repetition keeps the gains.
              </p>
            </div>

            {/* Live Tutors */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mb-6">
                <Video className="w-6 h-6 text-secondary-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Live tutors, on demand</h3>
              <p className="text-neutral-600 leading-relaxed">
                Stuck at 11pm before a mock? Book a 1:1 video session in minutes. Screen sharing, whiteboard, and the session is saved for later review.
              </p>
            </div>

            {/* Video Library */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mb-6">
                <PlayCircle className="w-6 h-6 text-success-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Video library</h3>
              <p className="text-neutral-600 leading-relaxed">
                Recorded chapter explainers and full courses — rewatch at 1.5×, take notes inline, mark sections for later. Progress synced across devices.
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
              Get started in minutes
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              No credit card, no upload, no setup hassle.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Sign up</h3>
              <p className="text-neutral-600">
                Free for 6 months. No card needed.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Take a diagnostic</h3>
              <p className="text-neutral-600">
                Quick quiz so the AI Coach can find your weak chapters.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Practice daily</h3>
              <p className="text-neutral-600">
                Follow the weekly plan. Book a tutor whenever you're stuck.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-success-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                ✓
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Track progress</h3>
              <p className="text-neutral-600">
                Watch your accuracy climb chapter by chapter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing — INR primary for India market */}
      <section id="pricing" className="py-20 bg-neutral-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Simple pricing, honest billing
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Free for the first 6 months. Cancel anytime. Prices in ₹ — international students <a href="#" className="text-primary-500 hover:underline">see USD</a>.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white p-8 rounded-2xl border-2 border-neutral-200 hover:border-primary-300 transition-all">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-neutral-900 mb-2">₹0</div>
                <div className="text-sm text-neutral-500">first 6 months</div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">AI Coach &amp; weekly practice plans</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Smart flashcards with spaced repetition</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Full video library &amp; chapter explainers</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Progress tracking &amp; weak-area reports</span>
                </li>
              </ul>

              <a href="mailto:founders@campuspandit.ai?subject=Tell%20us%20about%20your%20coaching%20center&body=I%20study%20at%20a%20coaching%20center%20that%20might%20benefit%20from%20CampusPandit.%0A%0ACoaching%20center%20name%3A%0ALocation%3A%0AWebsite%2FInstagram%3A%0A" className="block w-full px-6 py-3 text-center bg-neutral-100 text-neutral-900 rounded-lg hover:bg-neutral-200 transition-colors font-medium">
                Tell your coaching center about CampusPandit
              </a>
            </div>

            {/* Student Pro — highlighted */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-8 rounded-2xl border-2 border-primary-500 shadow-xl relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-secondary-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Most popular
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Student Pro</h3>
                <div className="text-4xl font-bold text-white mb-2">₹799</div>
                <div className="text-sm text-primary-100">per month after free period</div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Everything in Free</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Unlimited AI Coach conversations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">2 included tutor session credits per month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Unlimited messaging with your tutors</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Priority support</span>
                </li>
              </ul>

              <a href="mailto:founders@campuspandit.ai?subject=Tell%20us%20about%20your%20coaching%20center&body=I%20study%20at%20a%20coaching%20center%20that%20might%20benefit%20from%20CampusPandit.%0A%0ACoaching%20center%20name%3A%0ALocation%3A%0AWebsite%2FInstagram%3A%0A" className="block w-full px-6 py-3 text-center bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium">
                Tell your coaching center about CampusPandit
              </a>
            </div>

            {/* Pay per session */}
            <div className="bg-white p-8 rounded-2xl border-2 border-neutral-200 hover:border-primary-300 transition-all">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Pay per session</h3>
                <div className="text-4xl font-bold text-neutral-900 mb-2">₹499+</div>
                <div className="text-sm text-neutral-500">per hour with a tutor</div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">No subscription required</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Browse tutors by subject and rating</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Rates set by each tutor — see them upfront</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Session recording included</span>
                </li>
              </ul>

              <a href="/tutors" className="block w-full px-6 py-3 text-center bg-neutral-100 text-neutral-900 rounded-lg hover:bg-neutral-200 transition-colors font-medium">
                Browse tutors
              </a>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-neutral-500">
              🎉 First 6 months completely free — no credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof — early-cohort framing, no fabricated outcomes */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-success-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              From the early cohort
            </h2>
            <p className="text-sm text-neutral-500 max-w-2xl mx-auto">
              Quotes from students using CampusPandit during our 2025 beta.
            </p>
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
                "The AI Coach actually pointed out that I was weaker in rotational mechanics than I thought. Drilling that for two weeks changed my mock scores."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                  RK
                </div>
                <div>
                  <div className="font-semibold text-neutral-900">Rahul K.</div>
                  <div className="text-sm text-neutral-500">Class 12, JEE aspirant</div>
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
                "Being able to message my tutor between sessions is the best part. I get unstuck in 10 minutes instead of waiting a week."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center text-white font-semibold">
                  PS
                </div>
                <div>
                  <div className="font-semibold text-neutral-900">Priya S.</div>
                  <div className="text-sm text-neutral-500">Class 12, NEET aspirant</div>
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
                "Rewatching session recordings at 1.5× is underrated. I've gone back through tricky organic chemistry sessions four times."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-white font-semibold">
                  AV
                </div>
                <div>
                  <div className="font-semibold text-neutral-900">Ankit V.</div>
                  <div className="text-sm text-neutral-500">Class 11, JEE aspirant</div>
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
            🎉 First 6 months absolutely free
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-neutral-900 mb-6">
            Stop guessing what to study.
          </h2>
          <p className="text-lg text-neutral-600 mb-8">
            Let the AI Coach tell you. Free for 6 months — no card required.
          </p>
          <a href="mailto:founders@campuspandit.ai?subject=Tell%20us%20about%20your%20coaching%20center&body=I%20study%20at%20a%20coaching%20center%20that%20might%20benefit%20from%20CampusPandit.%0A%0ACoaching%20center%20name%3A%0ALocation%3A%0AWebsite%2FInstagram%3A%0A" className="inline-flex px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors items-center justify-center gap-2 font-medium text-lg">
            Tell your coaching center about CampusPandit
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-sm text-neutral-500 mt-4">No credit card required • Full access for 6 months</p>

          <div className="mt-16 pt-8 border-t border-neutral-200">
            <p className="text-sm text-neutral-500">
              Are you a tutor?{' '}
              <a href="/tutor/register" className="text-primary-500 hover:underline font-medium">
                Teach on CampusPandit →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">CampusPandit</span>
              </div>
              <p className="text-neutral-400 text-sm">
                AI-powered JEE &amp; NEET prep — coaching, tutors, and lessons in one place.
              </p>
              <p className="text-neutral-500 text-xs mt-4">
                Powered by free educational resources including OpenStax and NotebookLM.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/tutors" className="hover:text-white transition-colors">Find a tutor</a></li>
                <li><a href="/tutor/register" className="hover:text-white transition-colors">Become a tutor</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">Help center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-neutral-400">
              © {currentYear} CampusPandit. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-neutral-400 hover:text-white transition-colors" aria-label="Contact">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors" aria-label="Achievements">
                <Award className="w-5 h-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors" aria-label="Security">
                <Shield className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageStudent;
