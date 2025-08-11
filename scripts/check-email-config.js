import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ecnrvbyzbfhrorxwxkms.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbnJ2Ynl6YmZocm9yeHd4a21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MDUwMzQsImV4cCI6MjA2NjE4MTAzNH0.hknG5yowBpViyiTN_ftY_WQ8RL8SJfrGClGdBEvx98U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEmailConfiguration() {
  console.log('🔍 Checking Supabase Email Configuration');
  console.log('======================================');
  
  try {
    // Test 1: Basic connectivity
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError);
      return;
    }
    console.log('✅ Supabase connection working');
    
    // Test 2: Try to register a test user to see what happens
    const testEmail = `test+${Date.now()}@campuspandit.test`;
    console.log(`\n📧 Testing registration with: ${testEmail}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'test123456',
      options: {
        data: { name: 'Test User' }
      }
    });
    
    if (error) {
      console.error('❌ Registration failed:', error.message);
      return;
    }
    
    console.log('✅ Registration request completed');
    console.log('Registration result:', {
      userId: data.user?.id,
      email: data.user?.email,
      emailConfirmed: data.user?.email_confirmed_at,
      confirmationSentAt: data.user?.confirmation_sent_at,
      sessionCreated: !!data.session
    });
    
    // Analyze the results
    if (data.session) {
      console.log('🟢 Email confirmation is DISABLED (auto-confirm enabled)');
      console.log('   → Users are automatically logged in after registration');
      console.log('   → No verification email needed');
    } else if (data.user?.confirmation_sent_at) {
      console.log('🟡 Email confirmation is ENABLED and email was sent');
      console.log('   → Verification email should have been sent');
      console.log('   → Check your email service provider settings in Supabase');
    } else {
      console.log('🔴 Email confirmation is ENABLED but email was NOT sent');
      console.log('   → This indicates an email configuration problem');
      console.log('   → Check Supabase Dashboard > Authentication > Settings > SMTP');
    }
    
    console.log('\n📋 Configuration Checklist:');
    console.log('1. Supabase Dashboard > Authentication > Settings');
    console.log('2. Check "Enable email confirmations" setting');
    console.log('3. Configure SMTP settings (or use Supabase built-in email)');
    console.log('4. Set up email templates');
    console.log('5. Configure redirect URLs');
    
    console.log('\n🛠️ Common Solutions:');
    console.log('• If using custom SMTP: verify credentials and settings');
    console.log('• If using Supabase email: check rate limits and quotas');
    console.log('• Verify site URL and redirect URLs are correct');
    console.log('• Check email templates are configured');
    console.log('• For development: consider disabling email confirmation');
    
  } catch (error) {
    console.error('❌ Configuration check failed:', error);
  }
}

async function testEmailResend(email) {
  console.log(`\n🔄 Testing email resend for: ${email}`);
  
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });
    
    if (error) {
      console.error('❌ Resend failed:', error.message);
      
      if (error.message.includes('rate limit')) {
        console.log('⏱️ Rate limited - wait before trying again');
      } else if (error.message.includes('not found')) {
        console.log('❌ User not found - may need to register again');
      } else {
        console.log('❌ Email service configuration issue');
      }
    } else {
      console.log('✅ Resend request completed');
      console.log('📧 If configured correctly, email should be sent');
    }
  } catch (error) {
    console.error('❌ Resend test failed:', error);
  }
}

// Run the checks
checkEmailConfiguration();

// Uncomment to test resend with a specific email
// testEmailResend('your-email@example.com');
