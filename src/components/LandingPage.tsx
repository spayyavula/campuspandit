import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Menu,
  X,
  Brain,
  Shield,
  Smartphone,
  BarChart3,
  Zap,
  AlertCircle,
  Users,
  TrendingUp,
  Calculator,
  Sparkles,
  Building2,
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-neutral-900">CampusPandit</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Platform</a>
              <a href="#how-it-works" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">How it works</a>
              <a href="#pricing" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Pricing</a>
              <a href="#faq" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">FAQ</a>
              <a href="/for-students" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">For students</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <a href="/apply" className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                Apply for pilot
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
              <a href="#features" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Platform</a>
              <a href="#how-it-works" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">How it works</a>
              <a href="#pricing" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Pricing</a>
              <a href="#faq" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">FAQ</a>
              <a href="/for-students" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">For students</a>
              <div className="pt-4 space-y-2">
                <a href="/apply" className="block w-full px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-center">
                  Apply for pilot
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                Founding 10 — applications open
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight mb-6">
                Run your coaching center<br />
                like the big chains.<br />
                <span className="text-primary-500">Without becoming one.</span>
              </h1>
              <p className="text-lg sm:text-xl text-neutral-600 mb-8 leading-relaxed">
                Stop losing students to PhysicsWallah and Allen. CampusPandit gives your coaching center a branded student app, an AI tutor for every learner, and one dashboard to run the whole operation. <strong className="text-neutral-900">Pilot setup in 7 days.</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="/apply" className="px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 font-medium">
                  Apply for the pilot
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a href="#how-it-works" className="px-8 py-4 border-2 border-neutral-200 text-neutral-900 rounded-lg hover:border-neutral-300 transition-colors font-medium text-center">
                  See how it works
                </a>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-neutral-200">
                <div>
                  <div className="text-2xl font-bold text-primary-500">7 days</div>
                  <div className="text-sm text-neutral-600 mt-1">Branded app live</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-500">100%</div>
                  <div className="text-sm text-neutral-600 mt-1">Your content, your IP</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-500">24×7</div>
                  <div className="text-sm text-neutral-600 mt-1">AI tutor per student</div>
                </div>
              </div>
            </div>

            {/* Center-owner dashboard mockup */}
            <div className="relative animate-fade-in">
              <div className="aspect-square bg-gradient-to-br from-primary-50 to-success-50 rounded-3xl p-8 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md">
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                        ST
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900 text-sm">Sharma Tutorials</div>
                        <div className="text-xs text-neutral-500">Powered by CampusPandit</div>
                      </div>
                    </div>
                    <div className="text-xs text-success-600 font-medium">Live</div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 my-5">
                    <div className="text-center">
                      <div className="text-xl font-bold text-neutral-900">247</div>
                      <div className="text-xs text-neutral-500">Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-neutral-900">18</div>
                      <div className="text-xs text-neutral-500">Tutors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-success-600">92%</div>
                      <div className="text-xs text-neutral-500">Attendance</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200">
                    <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                      AI Coach: this week's interventions
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-red-50">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-semibold">PR</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-neutral-900">Priya R. — JEE Main</div>
                          <div className="text-xs text-red-600">Rotational mech accuracy: 32%</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-yellow-50">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 text-xs font-semibold">AS</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-neutral-900">Arjun S. — NEET</div>
                          <div className="text-xs text-yellow-700">Missed 3 mocks — outreach needed</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-success-50">
                        <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center text-success-700 text-xs font-semibold">MK</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-neutral-900">Manas K. — JEE Adv.</div>
                          <div className="text-xs text-success-700">Ready for Advanced-level set</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-neutral-400 text-center mt-3">Illustrative center-owner dashboard. Your center's name and brand.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The pain */}
      <section className="py-20 bg-neutral-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Why coaching centers lose students
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Three quiet leaks every 50–1,000-student center is fighting right now.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-neutral-200">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">PhysicsWallah has an app. You don't.</h3>
              <p className="text-neutral-600 leading-relaxed">
                Parents see a polished branded experience there and group chats with mixed PDFs from you. The perception gap costs renewals.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-neutral-200">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Your tutors can't give 1:1 to 30 students.</h3>
              <p className="text-neutral-600 leading-relaxed">
                Weaker students fall behind quietly. By the time you find out at the next mock, they've already decided to switch.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-neutral-200">
              <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Six WhatsApp groups and three spreadsheets.</h3>
              <p className="text-neutral-600 leading-relaxed">
                Fees, attendance, mock scores, parent comms — all scattered. You can't see who's struggling until it's too late.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The solution — 3 pillars */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              One platform. Your brand. Their tech.
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              CampusPandit closes all three leaks at once — without you hiring a developer.
            </p>
          </div>

          <div className="space-y-12">
            {/* Pillar 1 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold">
                  <Smartphone className="w-4 h-4" />
                  Pillar 1
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4">
                  Your brand. Your app. Your domain.
                </h3>
                <p className="text-lg text-neutral-600 mb-6 leading-relaxed">
                  Students download <em>your center's name</em>, not ours. Your logo on the splash screen, your domain in the URL, your fees in the checkout. CampusPandit disappears — we're just the engine underneath.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700">Custom logo, colors, and domain (your-center.app)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700">Published to Play Store under your brand</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700">All payments go to your Razorpay / PayU account</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-primary-50 to-success-50 rounded-2xl p-8 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-lg mx-auto mb-4 flex items-center justify-center">
                    <Smartphone className="w-10 h-10 text-primary-500" />
                  </div>
                  <div className="text-sm text-neutral-500">Your center's app — illustrative</div>
                </div>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="bg-gradient-to-br from-success-50 to-primary-50 rounded-2xl p-8 aspect-video flex items-center justify-center lg:order-1">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-lg mx-auto mb-4 flex items-center justify-center">
                    <Brain className="w-10 h-10 text-success-600" />
                  </div>
                  <div className="text-sm text-neutral-500">AI Coach — illustrative</div>
                </div>
              </div>
              <div className="lg:order-2">
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-success-50 text-success-700 rounded-full text-xs font-semibold">
                  <Brain className="w-4 h-4" />
                  Pillar 2
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4">
                  An AI tutor for every student — diagnosing weak chapters by PYQ.
                </h3>
                <p className="text-lg text-neutral-600 mb-6 leading-relaxed">
                  Your tutors can't sit with 30 students at once. The AI Coach can. It diagnoses each student's weakest 6 chapters — weighted by how often they appear in actual JEE/NEET PYQs — and runs personalized practice 24×7.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700">PYQ-weighted diagnosis (every JEE Main since 2015, NEET since 2017)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700">Auto-escalates to your tutors when AI gets stuck</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700">Tracks accuracy chapter-by-chapter, surfaces interventions to you</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-secondary-50 text-secondary-700 rounded-full text-xs font-semibold">
                  <BarChart3 className="w-4 h-4" />
                  Pillar 3
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4">
                  One dashboard to run the whole center.
                </h3>
                <p className="text-lg text-neutral-600 mb-6 leading-relaxed">
                  Stop juggling six WhatsApp groups and three spreadsheets. Leads, enrollments, fees, attendance, mock scores, parent comms, and tutor scheduling — all in one place. You see who's at risk before they leave.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700">Built-in CRM: leads, deals, tickets, renewals</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700">Weekly "at-risk students" report for the owner</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700">Tutor performance, session attendance, and earnings</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-secondary-50 to-primary-50 rounded-2xl p-8 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-lg mx-auto mb-4 flex items-center justify-center">
                    <BarChart3 className="w-10 h-10 text-secondary-600" />
                  </div>
                  <div className="text-sm text-neutral-500">Center dashboard — illustrative</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-neutral-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              From application to launch in 7 days
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              No engineering work on your side. We do the heavy lifting.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Apply</h3>
              <p className="text-neutral-600">
                Quick form. We review fit within 48 hours.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">20-min discovery call</h3>
              <p className="text-neutral-600">
                We learn your subjects, fees, tutor count, and what you've tried.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Branded app live</h3>
              <p className="text-neutral-600">
                Your logo, colors, and domain — published in 7 days.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-success-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Onboard students</h3>
              <p className="text-neutral-600">
                Import your roster. AI starts diagnosing weak chapters week 1.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              The math is uncomfortably simple
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              If you charge ₹15,000/year per student, here's what it takes to break even on CampusPandit.
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary-50 to-success-50 rounded-3xl p-8 sm:p-12">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 text-center">
                <Calculator className="w-8 h-8 text-primary-500 mx-auto mb-3" />
                <div className="text-sm text-neutral-500 mb-1">Cost to you</div>
                <div className="text-3xl font-bold text-neutral-900">₹1,800</div>
                <div className="text-sm text-neutral-500 mt-1">per student / year</div>
              </div>
              <div className="bg-white rounded-2xl p-6 text-center">
                <TrendingUp className="w-8 h-8 text-success-500 mx-auto mb-3" />
                <div className="text-sm text-neutral-500 mb-1">Revenue per student</div>
                <div className="text-3xl font-bold text-neutral-900">₹15,000</div>
                <div className="text-sm text-neutral-500 mt-1">your annual fee</div>
              </div>
              <div className="bg-white rounded-2xl p-6 text-center">
                <Sparkles className="w-8 h-8 text-secondary-500 mx-auto mb-3" />
                <div className="text-sm text-neutral-500 mb-1">Break-even</div>
                <div className="text-3xl font-bold text-neutral-900">1 in 10</div>
                <div className="text-sm text-neutral-500 mt-1">students retained</div>
              </div>
            </div>
            <p className="text-center text-neutral-700 leading-relaxed">
              If CampusPandit helps you retain just <strong>1 in 10 students</strong> who would have otherwise churned, the platform pays for itself. Everything beyond that is upside.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-neutral-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Founder pricing while we're early
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              We're selecting 10 coaching centers in 2026 to pilot at zero cost. After the pilot, you keep founder pricing for life.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Pilot — Highlighted */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-8 rounded-2xl shadow-xl relative transform md:scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-secondary-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Founding 10
                </div>
              </div>

              <div className="text-center mb-6 mt-2">
                <h3 className="text-xl font-bold text-white mb-2">Pilot</h3>
                <div className="text-4xl font-bold text-white mb-2">₹0</div>
                <div className="text-sm text-primary-100">first 3 months · up to 100 students</div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Branded app published in 7 days</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">AI Coach for every student</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Full center dashboard &amp; CRM</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Founder pricing locked in for life</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">Direct line to the product team</span>
                </li>
              </ul>

              <a href="/apply" className="block w-full px-6 py-3 text-center bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium">
                Apply for the pilot
              </a>
            </div>

            {/* Growth */}
            <div className="bg-white p-8 rounded-2xl border-2 border-neutral-200">
              <div className="text-center mb-6 mt-2">
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Growth</h3>
                <div className="text-4xl font-bold text-neutral-900 mb-2">₹149</div>
                <div className="text-sm text-neutral-500">per active student / month, billed annually</div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Everything in Pilot</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Minimum 100 active students</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Email support, 24h SLA</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Quarterly product reviews</span>
                </li>
              </ul>

              <a href="/apply" className="block w-full px-6 py-3 text-center bg-neutral-100 text-neutral-900 rounded-lg hover:bg-neutral-200 transition-colors font-medium">
                Talk to us
              </a>
            </div>

            {/* Center+ */}
            <div className="bg-white p-8 rounded-2xl border-2 border-neutral-200">
              <div className="text-center mb-6 mt-2">
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Center+</h3>
                <div className="text-4xl font-bold text-neutral-900 mb-2">Custom</div>
                <div className="text-sm text-neutral-500">multi-branch · 500+ students</div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Multi-branch admin &amp; reporting</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Dedicated success manager</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">API access &amp; integrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-600">Custom AI fine-tuning on your content</span>
                </li>
              </ul>

              <a href="/apply" className="block w-full px-6 py-3 text-center bg-neutral-100 text-neutral-900 rounded-lg hover:bg-neutral-200 transition-colors font-medium">
                Contact sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Owner questions, answered
            </h2>
          </div>

          <div className="space-y-6">
            <details className="bg-white border border-neutral-200 rounded-2xl p-6 group">
              <summary className="font-semibold text-neutral-900 cursor-pointer flex items-center justify-between">
                How long does it take to launch our branded app?
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-neutral-600 leading-relaxed mt-4">
                Seven days from the discovery call to a Play Store-published app with your logo, colors, and domain. iOS follows in ~3 weeks (Apple's review timeline is slower than Google's).
              </p>
            </details>

            <details className="bg-white border border-neutral-200 rounded-2xl p-6 group">
              <summary className="font-semibold text-neutral-900 cursor-pointer flex items-center justify-between">
                Do we own our content and student data?
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-neutral-600 leading-relaxed mt-4">
                Yes. All recordings, notes, student records, and CRM data belong to your center. We're processors, not owners. Full export available in CSV/MP4/PDF on request, and immediately on contract exit.
              </p>
            </details>

            <details className="bg-white border border-neutral-200 rounded-2xl p-6 group">
              <summary className="font-semibold text-neutral-900 cursor-pointer flex items-center justify-between">
                Can the AI Coach be tuned to our curriculum?
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-neutral-600 leading-relaxed mt-4">
                The base model is already PYQ-weighted for JEE Main, JEE Advanced, and NEET. For Center+ clients we fine-tune on your past mock papers, assignment sets, and chapter weightages — so the AI speaks in your center's voice and emphasizes what you teach.
              </p>
            </details>

            <details className="bg-white border border-neutral-200 rounded-2xl p-6 group">
              <summary className="font-semibold text-neutral-900 cursor-pointer flex items-center justify-between">
                How are payments handled?
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-neutral-600 leading-relaxed mt-4">
                Students pay your center directly via Razorpay, PayU, or Instamojo — accounts you own. We invoice you separately for the platform fee. We never sit between you and your students' money.
              </p>
            </details>

            <details className="bg-white border border-neutral-200 rounded-2xl p-6 group">
              <summary className="font-semibold text-neutral-900 cursor-pointer flex items-center justify-between">
                What happens after the 3-month pilot?
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-neutral-600 leading-relaxed mt-4">
                You move to the Growth plan at founder pricing — locked in for as long as you stay. You can cancel any time; we'll hand back all your data and de-list the branded app gracefully.
              </p>
            </details>

            <details className="bg-white border border-neutral-200 rounded-2xl p-6 group">
              <summary className="font-semibold text-neutral-900 cursor-pointer flex items-center justify-between">
                Why should we trust you with zero customers?
                <span className="text-neutral-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-neutral-600 leading-relaxed mt-4">
                Honest answer: that's exactly why the pilot is free and founder pricing is permanent. We're trading early proof points for our first 10 logos — you're trading 3 months of zero-risk usage for software that would otherwise cost ₹1.5L+/year. If it doesn't work for your center, we shake hands and part ways.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Apply / CTA */}
      <section id="apply" className="py-20 bg-gradient-to-br from-primary-500 to-primary-700 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/15 backdrop-blur rounded-full text-sm font-semibold">
            <Sparkles className="w-4 h-4" />
            10 spots · founder pricing for life
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-6">
            Apply to be a founding pilot.
          </h2>
          <p className="text-lg text-primary-100 mb-8 leading-relaxed">
            We're choosing 10 coaching centers (50–1,000 students, JEE/NEET focus) for the 2026 pilot cohort. Three months free, fully branded app, AI Coach for every student, founder pricing locked in for life.
          </p>
          <a href="/apply" className="inline-flex px-8 py-4 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition-colors items-center justify-center gap-2 font-medium text-lg">
            Open application form
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-sm text-primary-100 mt-4">We respond within 48 hours · No sales calls without your ask</p>
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
                White-label coaching center platform — branded app, AI tutor, and one dashboard to run the operation.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/for-students" className="hover:text-white transition-colors">For students</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Trust</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">Data ownership</a></li>
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
            <div className="flex items-center gap-4 text-sm text-neutral-400">
              <a href="mailto:founders@campuspandit.ai" className="hover:text-white transition-colors">
                founders@campuspandit.ai
              </a>
              <span className="hidden md:inline">·</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                Built for Indian coaching centers
              </span>
              <span className="hidden md:inline">·</span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Your data, your IP
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
