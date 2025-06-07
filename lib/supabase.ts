import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get environment variables with fallbacks to prevent crashes
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://oxyimxjovmpxcezrwadk.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eWlteGpvdm1weGNlenJ3YWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTgzMzksImV4cCI6MjA1NzY5NDMzOX0.3p82gmqulrDoVE5mRgALG7r-2jS89DauXHQ-KQygOuQ';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase Config Warning]: Using fallback environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
    storage: AsyncStorage,
    autoRefreshToken: true,
  },
});

// Log initialization success
console.log('[Supabase]: Client initialized successfully');