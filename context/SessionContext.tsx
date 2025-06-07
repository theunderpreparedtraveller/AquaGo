import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

type SessionContextType = {
  session: Session | null;
  isLoading: boolean;
  userEmail: string | null;
};

const SessionContext = createContext<SessionContextType>({
  session: null,
  isLoading: true,
  userEmail: null,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[Auth Error]:', error);
          setIsLoading(false);
          return;
        }
        
        setSession(data.session);
        setUserEmail(data.session?.user?.email ?? null);
      } catch (err) {
        console.error('[Auth Exception]:', err);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log('[Auth]: Session state changed', _event);
        setSession(session);
        setUserEmail(session?.user?.email ?? null);
        setIsLoading(false);
      });

      return () => {
        try {
          subscription.unsubscribe();
        } catch (err) {
          console.error('[Auth Unsubscribe Error]:', err);
        }
      };
    } catch (err) {
      console.error('[Auth Subscription Error]:', err);
      setIsLoading(false);
      return () => {};
    }
  }, []);

  return (
    <SessionContext.Provider value={{ session, isLoading, userEmail }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    console.warn('useSession called outside of SessionProvider, returning default context');
    return { session: null, isLoading: false, userEmail: null };
  }
  return context;
}