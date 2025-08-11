import { supabase } from '../src/utils/supabase.js';

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow');
  console.log('============================');
  
  // Test 1: Check if we can access auth
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Auth endpoint accessible');
    console.log('Current session:', data.session ? 'Active' : 'None');
  } catch (error) {
    console.error('❌ Auth endpoint error:', error);
    return;
  }
  
  // Test 2: Try to get user (should fail if not authenticated)
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error && error.message.includes('not authenticated')) {
      console.log('✅ Auth protection working (not authenticated)');
    } else if (data.user) {
      console.log('✅ User already authenticated:', data.user.email);
    }
  } catch (error) {
    console.log('⚠️ Unexpected auth error:', error);
  }
  
  // Test 3: Check environment variables
  console.log('\n📋 Environment Check:');
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL || 'Using fallback');
  console.log('Key (partial):', (import.meta.env.VITE_SUPABASE_ANON_KEY || 'Using fallback').substring(0, 20) + '...');
  
  console.log('\n🔍 Common Issues & Solutions:');
  console.log('1. "Invalid login credentials" usually means:');
  console.log('   - Email/password combination not found');
  console.log('   - User needs to verify email first');
  console.log('   - User account was not created successfully');
  
  console.log('\n2. To fix this:');
  console.log('   - Try registering with a different email');
  console.log('   - Check if verification email was received');
  console.log('   - Check Supabase Dashboard > Authentication > Users');
  console.log('   - Look for the user in the auth.users table');
  
  console.log('\n3. Debug registration process:');
  console.log('   - Registration should return user object and maybe session');
  console.log('   - If no session, email confirmation is required');
  console.log('   - Email must be clicked before login will work');
}

testAuthFlow();
