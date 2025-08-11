import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Search } from 'lucide-react';

const AuthDebugger: React.FC = () => {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkUserStatus = async () => {
    if (!email) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      // Try to reset password - this will tell us if the email exists
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        if (error.message.includes('not found') || error.message.includes('invalid')) {
          setResult('❌ Email not found - User needs to register first');
        } else {
          setResult(`⚠️ Error: ${error.message}`);
        }
      } else {
        setResult('✅ Email exists in system - Check if email is verified');
      }
    } catch (err) {
      setResult(`❌ Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    if (!email) return;
    
    setLoading(true);
    
    try {
      // Try login with a dummy password to see what error we get
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'dummy-password-test'
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setResult('📧 Email exists but either password is wrong or email not verified');
        } else if (error.message.includes('Email not confirmed')) {
          setResult('⚠️ Email exists but not verified - Check email for verification link');
        } else {
          setResult(`ℹ️ Error: ${error.message}`);
        }
      } else {
        setResult('⚠️ Unexpected: Login succeeded with dummy password');
      }
    } catch (err) {
      setResult(`❌ Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 max-w-md mx-auto mt-8">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        <Search className="w-5 h-5 mr-2" />
        Auth Debug Tool
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-white text-sm mb-2">Email to check:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 rounded-lg border border-white border-opacity-30 focus:border-opacity-60 focus:outline-none"
            placeholder="Enter email address"
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={checkUserStatus}
            disabled={loading || !email}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            {loading ? 'Checking...' : 'Check if Registered'}
          </button>
          
          <button
            onClick={testLogin}
            disabled={loading || !email}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
          >
            {loading ? 'Testing...' : 'Test Login'}
          </button>
        </div>
        
        {result && (
          <div className="p-3 bg-black bg-opacity-30 rounded-lg">
            <p className="text-white text-sm whitespace-pre-wrap">{result}</p>
          </div>
        )}
        
        <div className="text-xs text-white text-opacity-70">
          <p className="mb-1">💡 This tool helps diagnose auth issues:</p>
          <ul className="space-y-1 ml-4">
            <li>• Check if email is registered</li>
            <li>• Test login error messages</li>
            <li>• Identify verification status</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugger;
