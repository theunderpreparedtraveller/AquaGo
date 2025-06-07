import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '../context/ThemeContext';
import { SessionProvider, useSession } from '../context/SessionContext';
import { View, ActivityIndicator } from 'react-native';
import LoadingScreen from '../components/LoadingScreen';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://a336ec2be8c48c6df44db130255345a7@o4509456068902912.ingest.de.sentry.io/4509456071262288',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

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

export default Sentry.wrap(function RootLayout() {
  useFrameworkReady();

  return (
    <SessionProvider>
      <ThemeProvider>
        <StatusBar style="light" />
        <RootLayoutNav />
      </ThemeProvider>
    </SessionProvider>
  );
});