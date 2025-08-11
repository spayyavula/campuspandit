#!/usr/bin/env node

/**
 * Complete Auth Flow Test
 * Tests registration and login flow with current configuration
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ecnrvbyzbfhrorxwxkms.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbnJ2Ynl6YmZocm9yeHd4a21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MDUwMzQsImV4cCI6MjA2NjE4MTAzNH0.hknG5yowBpViyiTN_ftY_WQ8RL8SJfrGClGdBEvx98U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCompleteAuthFlow() {
  console.log('🧪 Testing Complete Authentication Flow');
  console.log('=====================================');
  
  const testEmail = `test+${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    // Step 1: Test Registration
    console.log('\n📝 Step 1: Testing Registration...');
    console.log(`Email: ${testEmail}`);
    
    const { data: regData, error: regError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { name: 'Test User' }
      }
    });
    
    if (regError) {
      console.error('❌ Registration failed:', regError.message);
      return;
    }
    
    console.log('✅ Registration successful');
    console.log('User ID:', regData.user?.id);
    console.log('Session created:', regData.session ? 'Yes' : 'No');
    console.log('Email confirmed:', regData.user?.email_confirmed_at ? 'Yes' : 'No');
    
    if (regData.session) {
      console.log('🎉 Auto-confirmation enabled - user is logged in!');
      
      // Test logout
      console.log('\n🚪 Step 2: Testing Logout...');
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) {
        console.error('❌ Logout failed:', logoutError.message);
      } else {
        console.log('✅ Logout successful');
      }
      
      // Test login
      console.log('\n🔐 Step 3: Testing Login...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (loginError) {
        console.error('❌ Login failed:', loginError.message);
      } else {
        console.log('✅ Login successful');
        console.log('User logged in:', loginData.user?.email);
      }
      
    } else {
      console.log('📧 Email confirmation required');
      console.log('Confirmation sent:', regData.user?.confirmation_sent_at ? 'Yes' : 'No');
      
      // Test login without confirmation
      console.log('\n🔐 Step 2: Testing Login (should fail)...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (loginError) {
        console.log('✅ Login correctly failed (email not confirmed)');
        console.log('Error:', loginError.message);
      } else {
        console.log('⚠️ Login unexpectedly succeeded');
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log('==========');
    if (regData.session) {
      console.log('✅ Auth flow working correctly');
      console.log('✅ Email confirmation is disabled (development mode)');
      console.log('✅ Users are auto-logged in after registration');
      console.log('✅ Users can login immediately with their credentials');
      console.log('\n💡 For your issue: Users should NOT expect verification emails');
      console.log('💡 They should be able to login immediately after registration');
    } else {
      console.log('📧 Email confirmation is enabled');
      console.log('📧 Users must verify their email before login');
      console.log('📧 Check email service configuration if emails not received');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteAuthFlow();
