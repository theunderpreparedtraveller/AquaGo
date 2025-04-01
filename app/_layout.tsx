import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '../context/ThemeContext';
import { SessionProvider, useSession } from '../context/SessionContext';
import { View, ActivityIndicator } from 'react-native';

function useProtectedRoute() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (session && inAuthGroup) {
      // Redirect to home if authenticated and trying to access auth pages
      router.replace('/');
    }
  }, [session, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1f2b' }}>
        <ActivityIndicator size="large" color="#FFA500" />
      </View>
    );
  }

  return null;
}

function RootLayoutNav() {
  const loading = useProtectedRoute();
  
  if (loading) return loading;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="wallet" options={{ headerShown: false }} />
      <Stack.Screen name="activity" options={{ headerShown: false }} />
      <Stack.Screen name="payment-methods" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <SessionProvider>
      <ThemeProvider>
        <StatusBar style="light" />
        <RootLayoutNav />
      </ThemeProvider>
    </SessionProvider>
  );
}