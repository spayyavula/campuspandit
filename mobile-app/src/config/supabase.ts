/**
 * Supabase Configuration
 * Initialize Supabase client for authentication and real-time
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://ecnrvbyzbfhrorxwxkms.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbnJ2Ynl6YmZocm9yeHd4a21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MDUwMzQsImV4cCI6MjA2NjE4MTAzNH0.hknG5yowBpViyiTN_ftY_WQ8RL8SJfrGClGdBEvx98U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
