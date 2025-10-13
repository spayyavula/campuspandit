import React, { useState, useEffect } from 'react';
import { Mail, Bell, BookOpen, Trophy, Gift, Check, X, Loader } from 'lucide-react';
import { emailMarketingAPI, EmailSubscriber } from '../utils/emailMarketing';
import { supabase } from '../utils/supabase';

/**
 * EmailPreferences Component
 * Allows users to manage their email subscription preferences
 */
export default function EmailPreferences() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [subscriber, setSubscriber] = useState<EmailSubscriber | null>(null);
  const [preferences, setPreferences] = useState({
    subscribed: false,
    course_updates: true,
    tournament_notifications: true,
    weekly_digest: true,
    promotional_offers: true
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: 'error', text: 'Please log in to manage preferences' });
        setLoading(false);
        return;
      }

      const subscriberData = await emailMarketingAPI.getSubscriberByUserId(user.id);

      if (subscriberData) {
        setSubscriber(subscriberData);
        setPreferences({
          subscribed: subscriberData.subscribed,
          course_updates: subscriberData.preferences?.course_updates ?? true,
          tournament_notifications: subscriberData.preferences?.tournament_notifications ?? true,
          weekly_digest: subscriberData.preferences?.weekly_digest ?? true,
          promotional_offers: subscriberData.preferences?.promotional_offers ?? true
        });
      } else {
        // User hasn't subscribed yet
        setPreferences({
          subscribed: false,
          course_updates: true,
          tournament_notifications: true,
          weekly_digest: true,
          promotional_offers: true
        });
      }
    } catch (error: any) {
      console.error('Error loading preferences:', error);
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        throw new Error('User not authenticated');
      }

      if (preferences.subscribed) {
        // Subscribe or update preferences
        const result = await emailMarketingAPI.subscribe(
          user.email,
          user.user_metadata?.name,
          user.id,
          'profile'
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to subscribe');
        }

        // Update specific preferences
        await emailMarketingAPI.updatePreferences(user.email, {
          course_updates: preferences.course_updates,
          tournament_notifications: preferences.tournament_notifications,
          weekly_digest: preferences.weekly_digest,
          promotional_offers: preferences.promotional_offers
        });

        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      } else {
        // Unsubscribe
        const result = await emailMarketingAPI.unsubscribe(user.email);
        if (!result.success) {
          throw new Error(result.error || 'Failed to unsubscribe');
        }
        setMessage({ type: 'success', text: 'You have been unsubscribed from marketing emails.' });
      }

      // Reload preferences to get updated data
      setTimeout(() => loadPreferences(), 1000);
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <Mail className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Email Preferences</h2>
              <p className="text-blue-100">Manage your email subscriptions</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Marketing Emails</h3>
                <p className="text-sm text-gray-600">Receive updates and promotional content</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('subscribed')}
              className={`relative w-16 h-8 rounded-full transition-colors ${
                preferences.subscribed ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.subscribed ? 'translate-x-8' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Preference Options */}
          {preferences.subscribed && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">What would you like to receive?</h3>

              {/* Course Updates */}
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Course Updates</h4>
                    <p className="text-sm text-gray-600">New courses, lessons, and learning materials</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('course_updates')}
                  className={`p-2 rounded-full ${
                    preferences.course_updates ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {preferences.course_updates ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
              </div>

              {/* Tournament Notifications */}
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Tournament Notifications</h4>
                    <p className="text-sm text-gray-600">Upcoming tournaments, quiz battles, and results</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('tournament_notifications')}
                  className={`p-2 rounded-full ${
                    preferences.tournament_notifications ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {preferences.tournament_notifications ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
              </div>

              {/* Weekly Digest */}
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Weekly Digest</h4>
                    <p className="text-sm text-gray-600">Weekly summary of your progress and tips</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('weekly_digest')}
                  className={`p-2 rounded-full ${
                    preferences.weekly_digest ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {preferences.weekly_digest ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
              </div>

              {/* Promotional Offers */}
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Gift className="w-5 h-5 text-purple-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Promotional Offers</h4>
                    <p className="text-sm text-gray-600">Special discounts, offers, and exclusive deals</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('promotional_offers')}
                  className={`p-2 rounded-full ${
                    preferences.promotional_offers ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {preferences.promotional_offers ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Preferences'
            )}
          </button>

          {/* Info Text */}
          <p className="text-xs text-gray-500 text-center">
            We respect your privacy. You can change your preferences anytime or unsubscribe completely.
          </p>
        </div>
      </div>
    </div>
  );
}
