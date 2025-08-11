#!/usr/bin/env node

/**
 * Auth Debug Script
 * This script helps debug authentication issues in the CampusPandit app
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔍 CampusPandit Auth Debug Helper');
console.log('================================');
console.log('');

console.log('Common authentication issues and solutions:');
console.log('');

console.log('1. 📧 Email Verification Issues:');
console.log('   - After registration, users must verify their email');
console.log('   - Check if email confirmation is enabled in Supabase');
console.log('   - Users should click the link in their email before logging in');
console.log('   - Check spam folder for verification emails');
console.log('');

console.log('2. 🔐 Supabase Configuration:');
console.log('   - Ensure VITE_SUPABASE_URL is set correctly');
console.log('   - Ensure VITE_SUPABASE_ANON_KEY is set correctly');
console.log('   - Check that RLS policies are configured properly');
console.log('   - Verify that user_profiles table and triggers exist');
console.log('');

console.log('3. 🚪 Login Flow Issues:');
console.log('   - Users may be trying to login before email verification');
console.log('   - Session might not be persisting properly');
console.log('   - Auth state changes might not be handled correctly');
console.log('');

console.log('4. 🔧 Recent Fixes Applied:');
console.log('   ✅ Improved error handling for unverified emails');
console.log('   ✅ Added email verification callback handler');
console.log('   ✅ Added "resend verification email" button');
console.log('   ✅ Enhanced auth state debugging');
console.log('   ✅ Better user feedback during auth process');
console.log('');

console.log('5. 🧪 Testing Steps:');
console.log('   1. Register a new user');
console.log('   2. Check email for verification link');
console.log('   3. Click verification link');
console.log('   4. Try logging in with verified account');
console.log('   5. Check browser console for auth state changes');
console.log('');

rl.question('Would you like to check your environment variables? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('');
    console.log('Environment Variables Check:');
    console.log('============================');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    console.log(`VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Not set'}`);
    console.log(`VITE_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ Set' : '❌ Not set'}`);
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('');
      console.log('⚠️  Environment variables are missing!');
      console.log('Create a .env file in your project root with:');
      console.log('VITE_SUPABASE_URL=your_supabase_url');
      console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
    }
  }
  
  console.log('');
  console.log('🎯 Next Steps:');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Open browser console to see auth debug logs');
  console.log('3. Try the registration and login flow');
  console.log('4. Check for any error messages in the console');
  console.log('');
  console.log('Need more help? Check the README.md or contact support.');
  
  rl.close();
});
