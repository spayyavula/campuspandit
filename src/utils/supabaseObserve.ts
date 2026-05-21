import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_OBSERVE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_OBSERVE_ANON_KEY;

if (!url || !anonKey) {
  console.warn('[supabaseObserve] env vars missing — observe-window features will fail.');
}

// Separate Supabase client for the observe-window project — distinct from
// src/utils/supabase.ts which talks to the question-bank project.
export const supabaseObserve = createClient(url ?? '', anonKey ?? '', {
  auth: {
    storageKey: 'campuspandit-observe-auth-storage',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: { enabled: false },
});
