import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient, Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

type AuthContextType = {
  session: Session | null;
  user: any;
  loading: boolean;
  userEmail: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage implementation
async function setStorageItem(key: string, value: string) {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error('Error setting storage item:', error);
  }
}

async function getStorageItem(key: string) {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Error getting storage item:', error);
    return null;
  }
}

async function removeStorageItem(key: string) {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error('Error removing storage item:', error);
  }
}

async function clearAllAuthData() {
  const authKeys = ['session', 'userEmail', 'user', 'supabase.auth.token'];
  
  for (const key of authKeys) {
    await removeStorageItem(key);
  }

  // Clear localStorage items on web
  if (Platform.OS === 'web') {
    localStorage.clear();
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setUserEmail(session?.user?.email ?? null);
      if (session?.access_token) {
        setStorageItem('session', session.access_token);
        setStorageItem('userEmail', session.user.email);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        await clearAllAuthData();
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setUserEmail(session?.user?.email ?? null);
      
      if (session?.access_token) {
        await setStorageItem('session', session.access_token);
        await setStorageItem('userEmail', session.user.email);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session?.access_token) {
        await setStorageItem('session', data.session.access_token);
        await setStorageItem('userEmail', data.session.user.email);
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      await clearAllAuthData();
      setSession(null);
      setUser(null);
      setUserEmail(null);
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      userEmail,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}