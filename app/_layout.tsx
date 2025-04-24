import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '../context/ThemeContext';
import { SessionProvider, useSession } from '../context/SessionContext';
import { View, ActivityIndicator } from 'react-native';
import LoadingScreen from '../components/LoadingScreen';

function useProtectedRoute() {
  const { session, isLoading } = useSession();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      // Show loading screen for at least 2 seconds
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading || showLoading) {
    return <LoadingScreen />;
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