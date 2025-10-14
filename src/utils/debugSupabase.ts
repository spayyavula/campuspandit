// Diagnostic utility to debug Supabase configuration and API key issues
// Import and call these functions in your component to diagnose issues

import { supabase } from './supabase';

export async function diagnoseSupabaseConnection() {
  const results = {
    envVarsLoaded: false,
    supabaseUrlValid: false,
    apiKeyValid: false,
    authSessionValid: false,
    canConnectToDatabase: false,
    errors: [] as string[]
  };

  // 1. Check environment variables
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  console.log('🔍 Diagnosing Supabase Connection...');
  console.log('Environment Variables:');
  console.log('  VITE_SUPABASE_URL:', url || '❌ NOT SET');
  console.log('  VITE_SUPABASE_ANON_KEY:', key ? `✓ Set (${key.length} chars)` : '❌ NOT SET');

  if (url && key) {
    results.envVarsLoaded = true;
    results.supabaseUrlValid = url.includes('supabase.co');
    results.apiKeyValid = key.length > 100; // JWT tokens are typically longer
  } else {
    results.errors.push('Environment variables not loaded');
  }

  // 2. Check authentication session
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    console.log('\n🔐 Authentication Status:');
    if (error) {
      console.log('  ❌ Error getting session:', error.message);
      results.errors.push(`Auth error: ${error.message}`);
    } else if (session) {
      console.log('  ✓ User authenticated');
      console.log('  User ID:', session.user.id);
      console.log('  Email:', session.user.email);
      console.log('  Token expires:', new Date(session.expires_at! * 1000).toLocaleString());
      results.authSessionValid = true;
    } else {
      console.log('  ⚠️  No active session (user not logged in)');
      results.errors.push('No active session');
    }
  } catch (error: any) {
    console.log('  ❌ Exception checking auth:', error.message);
    results.errors.push(`Auth exception: ${error.message}`);
  }

  // 3. Test database connection with a simple query
  try {
    console.log('\n🗄️  Testing Database Connection...');
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('id')
      .limit(1);

    if (error) {
      console.log('  ❌ Database query failed:', error.message);
      console.log('  Error code:', error.code);
      console.log('  Error details:', error.details);
      results.errors.push(`Database error: ${error.message} (${error.code})`);
    } else {
      console.log('  ✓ Database connection successful');
      console.log('  Query returned:', data?.length || 0, 'records');
      results.canConnectToDatabase = true;
    }
  } catch (error: any) {
    console.log('  ❌ Exception querying database:', error.message);
    results.errors.push(`Database exception: ${error.message}`);
  }

  // 4. Summary
  console.log('\n📊 Diagnosis Summary:');
  console.log('  Environment Variables:', results.envVarsLoaded ? '✓' : '❌');
  console.log('  Supabase URL Valid:', results.supabaseUrlValid ? '✓' : '❌');
  console.log('  API Key Valid:', results.apiKeyValid ? '✓' : '❌');
  console.log('  Auth Session:', results.authSessionValid ? '✓' : '⚠️');
  console.log('  Database Connection:', results.canConnectToDatabase ? '✓' : '❌');

  if (results.errors.length > 0) {
    console.log('\n❌ Errors Found:');
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  // 5. Recommendations
  console.log('\n💡 Recommendations:');
  if (!results.envVarsLoaded) {
    console.log('  1. Check .env.local file exists and has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    console.log('  2. Restart your development server');
  }
  if (!results.authSessionValid) {
    console.log('  1. Log in to the application');
    console.log('  2. Check if authentication is required for this route');
  }
  if (!results.canConnectToDatabase) {
    console.log('  1. Verify Supabase project is running');
    console.log('  2. Check Row Level Security policies');
    console.log('  3. Run: fix_all_crm_foreign_keys.sql');
    console.log('  4. Reload PostgREST schema cache');
  }

  return results;
}

// Quick check function
export async function quickCheck() {
  console.log('🚀 Quick Supabase Check');
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('User:', user ? user.email : 'Not authenticated');
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

// Test a specific table
export async function testTable(tableName: string) {
  console.log(`\n🔍 Testing table: ${tableName}`);

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error);
      return false;
    } else {
      console.log('✓ Success! Found', data?.length || 0, 'records');
      if (data && data.length > 0) {
        console.log('Sample record keys:', Object.keys(data[0]));
      }
      return true;
    }
  } catch (e: any) {
    console.error('❌ Exception:', e.message);
    return false;
  }
}

// Export for use in React DevTools console
if (typeof window !== 'undefined') {
  (window as any).diagnoseSupabase = diagnoseSupabaseConnection;
  (window as any).quickCheck = quickCheck;
  (window as any).testTable = testTable;
}
