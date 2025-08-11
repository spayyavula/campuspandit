import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Mail, AlertTriangle, CheckCircle, RefreshCw, Settings } from 'lucide-react';

const EmailTroubleshooter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, message]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testEmailConfiguration = async () => {
    if (!email) {
      addResult('❌ Please enter an email address first');
      return;
    }

    setLoading(true);
    clearResults();
    
    addResult('🔍 Starting email configuration test...');
    
    try {
      // Test 1: Try registration to see email behavior
      addResult('\n📝 Testing registration process...');
      const testEmail = email.includes('+test') ? email : email.replace('@', '+test@');
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'test123456',
        options: {
          data: { name: 'Test User' }
        }
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          addResult('ℹ️ Email already registered - this is normal for testing');
          // Try resend instead
          await testResendEmail(email);
        } else {
          addResult(`❌ Registration failed: ${error.message}`);
        }
        return;
      }
      
      addResult('✅ Registration request completed');
      
      // Analyze results
      if (data.session) {
        addResult('🟢 EMAIL CONFIRMATION IS DISABLED');
        addResult('   → Users are automatically logged in');
        addResult('   → No verification emails are sent');
        addResult('   → This is why you\'re not receiving emails');
      } else if (data.user?.confirmation_sent_at) {
        addResult('🟡 EMAIL CONFIRMATION IS ENABLED');
        addResult('   → Verification email should have been sent');
        addResult('   → Check your email (including spam folder)');
        addResult(`   → Email sent at: ${data.user.confirmation_sent_at}`);
      } else {
        addResult('🔴 EMAIL CONFIGURATION PROBLEM');
        addResult('   → Email confirmation is enabled but email was not sent');
        addResult('   → Check Supabase SMTP configuration');
      }
      
    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testResendEmail = async (emailToTest?: string) => {
    const targetEmail = emailToTest || email;
    if (!targetEmail) return;
    
    addResult('\n🔄 Testing email resend...');
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail
      });
      
      if (error) {
        if (error.message.includes('rate limit')) {
          addResult('⏱️ Rate limited - wait 60 seconds before trying again');
        } else if (error.message.includes('not found')) {
          addResult('❌ User not found - email may not be registered');
        } else {
          addResult(`❌ Resend failed: ${error.message}`);
        }
      } else {
        addResult('✅ Resend request completed');
        addResult('📧 If email is configured, you should receive it soon');
      }
    } catch (error) {
      addResult(`❌ Resend test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const showSolutions = () => {
    clearResults();
    addResult('🛠️ SOLUTIONS FOR EMAIL ISSUES:\n');
    
    addResult('1. 📧 IF NO EMAILS ARE BEING SENT:');
    addResult('   • Check Supabase Dashboard > Authentication > Settings');
    addResult('   • Verify "Enable email confirmations" is checked');
    addResult('   • Configure SMTP settings or use Supabase email service');
    addResult('   • Set up email templates\n');
    
    addResult('2. ⚡ QUICK FIX FOR DEVELOPMENT:');
    addResult('   • Disable email confirmation in Supabase settings');
    addResult('   • Users will be auto-logged in after registration');
    addResult('   • Re-enable for production\n');
    
    addResult('3. 🔧 SMTP CONFIGURATION:');
    addResult('   • Use Gmail, SendGrid, or other SMTP provider');
    addResult('   • Verify host, port, username, password');
    addResult('   • Test with a simple email first\n');
    
    addResult('4. 🌐 URL CONFIGURATION:');
    addResult('   • Set correct Site URL in Supabase');
    addResult('   • Add redirect URLs for auth callbacks');
    addResult('   • Ensure URLs match your domain\n');
    
    addResult('5. 📋 RATE LIMITS:');
    addResult('   • Supabase has email rate limits');
    addResult('   • Wait between resend attempts');
    addResult('   • Consider upgrading plan for higher limits');
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 max-w-2xl mx-auto mt-8">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        <Mail className="w-5 h-5 mr-2" />
        Email Troubleshooter
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-white text-sm mb-2">Email to test:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 rounded-lg border border-white border-opacity-30 focus:border-opacity-60 focus:outline-none"
            placeholder="Enter your email address"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={testEmailConfiguration}
            disabled={loading || !email}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Testing...' : 'Test Email Config'}
          </button>
          
          <button
            onClick={() => testResendEmail()}
            disabled={loading || !email}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
          >
            <Mail className="w-4 h-4 mr-2" />
            Test Resend
          </button>
          
          <button
            onClick={showSolutions}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            Show Solutions
          </button>
          
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            Clear
          </button>
        </div>
        
        {results.length > 0 && (
          <div className="bg-black bg-opacity-30 rounded-lg p-4 max-h-96 overflow-y-auto">
            <h4 className="text-white font-semibold mb-2 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Test Results:
            </h4>
            <div className="text-white text-sm font-mono whitespace-pre-wrap">
              {results.join('\n')}
            </div>
          </div>
        )}
        
        <div className="bg-yellow-500 bg-opacity-20 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-300 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-yellow-100 text-sm">
              <p className="font-semibold mb-1">Common Email Issues:</p>
              <ul className="space-y-1 text-xs">
                <li>• Email confirmation disabled in Supabase → No emails sent</li>
                <li>• SMTP not configured → Emails fail to send</li>
                <li>• Rate limits → Too many attempts too quickly</li>
                <li>• Spam filters → Emails go to spam folder</li>
                <li>• Wrong redirect URLs → Email links don't work</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTroubleshooter;
