/**
 * Custom hook for managing session state
 */

import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Session loading timeout - proceeding without session');
      setLoading(false);
    }, 3000);

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
        clearTimeout(timeout);
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        setLoading(false);
        clearTimeout(timeout);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
