import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';

// Empêcher le splash screen de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

// Auth Guard Component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading, isInitialized, profile } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session && !inAuthGroup) {
      // Pas connecté et pas sur une page auth -> rediriger vers welcome
      router.replace('/auth/welcome');
    } else if (session && inAuthGroup) {
      // Connecté mais sur une page auth
      if (profile?.is_onboarded) {
        // Onboarding complété -> aller aux tabs
        router.replace('/(tabs)');
      } else {
        // Onboarding pas complété -> aller à l'onboarding
        router.replace('/onboarding');
      }
    } else if (session && !profile?.is_onboarded && !inOnboarding && !inAuthGroup) {
      // Connecté mais onboarding pas complété
      router.replace('/onboarding');
    }
  }, [session, isInitialized, profile?.is_onboarded, segments]);

  if (isLoading || !isInitialized) {
    return null; // Le splash screen est toujours visible
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initialize = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // Ajoute d'autres fonts ici si nécessaire
  });

  // Initialiser l'auth au démarrage
  useEffect(() => {
    initialize();
  }, []);

  // Cacher le splash screen quand tout est prêt
  useEffect(() => {
    if (fontsLoaded && isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isInitialized]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGuard>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen 
                name="provider/[id]" 
                options={{ 
                  headerShown: true,
                  headerTitle: '',
                  headerTransparent: true,
                }} 
              />
              <Stack.Screen 
                name="chat/[conversationId]" 
                options={{ 
                  headerShown: true,
                  headerTitle: 'Conversation',
                }} 
              />
            </Stack>
          </AuthGuard>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}