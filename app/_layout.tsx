import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';

SplashScreen.preventAutoHideAsync();

// Options de navigation stables (hors composant = référence fixe)
const stackScreenOptions = { headerShown: false } as const;

const providerScreenOptions = {
  headerShown: true,
  headerTitle: '',
  headerTransparent: true,
} as const;

const chatScreenOptions = {
  headerShown: false,
} as const;

const modalScreenOptions = {
  presentation: 'modal',
  headerShown: true,
} as const;

export default function RootLayout() {
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  useEffect(() => {
    if (fontsLoaded && isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isInitialized]);

  // Tant que les fonts ou l'auth ne sont pas prêts, le splash screen reste visible
  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!isInitialized) {
    return null;
  }

  // Plus d'AuthGuard ici. Chaque group layout ((auth), (tabs))
  // gère sa propre redirection via <Redirect>.
  // Le root layout ne fait QUE rendre les providers et le Stack.
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <Stack screenOptions={stackScreenOptions}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="provider/[id]" options={providerScreenOptions} />
            <Stack.Screen name="event/create" />
            <Stack.Screen name="event/[id]" />
            <Stack.Screen name="booking/[providerId]" />
            <Stack.Screen name="booking/[id]/details" />
            <Stack.Screen name="chat/[conversationId]" options={chatScreenOptions} />
            <Stack.Screen name="chat/new" options={{ headerShown: false }} />
            <Stack.Screen name="reviews/write/[bookingId]" />
            <Stack.Screen name="reviews/provider/[providerId]" />
            <Stack.Screen name="reviews/user" />
            <Stack.Screen name="notifications/index" />
            <Stack.Screen name="settings/notifications" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
