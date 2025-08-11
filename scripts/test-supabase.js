// Test Supabase connection and configuration
import { supabase } from '../src/utils/supabase.js';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...');
  console.log('================================');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Supabase connection successful');
    console.log('Current session:', data.session ? 'Active' : 'None');
    
    // Test auth settings by attempting to get user
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError && !userError.message.includes('not authenticated')) {
      console.log('❌ Auth error:', userError.message);
    } else {
      console.log('✅ Auth endpoint accessible');
    }
    
    // Test if we can query the auth users (this will fail with RLS, which is expected)
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
      
    if (profileError) {
      if (profileError.message.includes('RLS')) {
        console.log('✅ RLS is properly configured (access denied as expected)');
      } else {
        console.log('⚠️ User profiles table issue:', profileError.message);
      }
    } else {
      console.log('✅ User profiles table accessible');
    }
    
    console.log('\n📋 Configuration Check:');
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Try registering with a real email address');
    console.log('2. Check if you receive a verification email');
    console.log('3. If no email, check Supabase Dashboard > Authentication > Settings');
    console.log('4. Ensure "Enable email confirmations" is configured correctly');
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
  }
}

// Test registration flow
async function testRegistration(email, password) {
  console.log('\n🧪 Testing Registration Flow...');
  console.log('================================');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { name: 'Test User' }
      }
    });
    
    if (error) {
      console.error('❌ Registration failed:', error.message);
      return;
    }
    
    console.log('✅ Registration request sent');
    console.log('User created:', data.user ? '✅' : '❌');
    console.log('Session created:', data.session ? '✅ (Auto-confirmed)' : '❌ (Email confirmation required)');
    
    if (data.user && !data.session) {
      console.log('📧 Email confirmation required');
      console.log('Check your email for verification link');
    }
    
  } catch (error) {
    console.error('❌ Registration test failed:', error);
  }
}

// Run tests
testSupabaseConnection();

// Uncomment to test registration with a real email
// testRegistration('your-test-email@example.com', 'test-password-123');
