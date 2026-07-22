import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { VideoView, useVideoPlayer } from 'expo-video';
import { ChevronLeft } from 'lucide-react-native';

import { BadgeUnlockOverlay } from '@/components/gamification/BadgeUnlockOverlay';
import { RealtimeProvider } from '@/components/providers/RealtimeProvider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlobalToast } from '@/components/ui/GlobalToast';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { goBackOrFallback } from '@/lib/navigation';
import { queryClient } from '@/lib/queryClient';
import { initSentry, Sentry, sentryEnabled } from '@/lib/sentry';
import { useAuthStore } from '@/stores/authStore';

initSentry();

SplashScreen.preventAutoHideAsync();

// Options de navigation stables avec animations fluides
const stackScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  animationDuration: 300,
  fullScreenGestureEnabled: true,
  customAnimationOnGesture: true,
} as const;

const providerScreenOptions = {
  headerShown: true,
  headerTitle: '',
  headerTransparent: true,
  animation: 'slide_from_right',
} as const;

const chatScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
} as const;

const modalScreenOptions = {
  presentation: 'modal',
  headerShown: true,
  animation: 'slide_from_bottom',
} as const;

// Modal dont l'écran dessine déjà son propre en-tête : afficher le header
// natif en plus donnerait deux barres de retour et le nom de route brut.
const bareModalScreenOptions = {
  presentation: 'modal',
  headerShown: false,
  animation: 'slide_from_bottom',
} as const;

// Options pour les écrans qui s'ouvrent en fade
const fadeScreenOptions = {
  headerShown: false,
  animation: 'fade',
} as const;

function RootLayout() {
  const router = useRouter();
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const [showOpeningVideo, setShowOpeningVideo] = useState(true);
  const [isOpeningClosing, setIsOpeningClosing] = useState(false);
  const openingOpacity = useRef(new Animated.Value(1)).current;
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Inter-Regular': require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
    'Inter-Medium': require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
    'Inter-SemiBold': require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
    'Inter-Bold': require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
  });
  const openingPlayer = useVideoPlayer(require('../assets/videos/opening.mp4'), (player) => {
    player.loop = false;
    player.play();
  });

  const closeOpeningVideo = useCallback(
    (delayMs = 0) => {
      if (!showOpeningVideo || isOpeningClosing) {
        return;
      }

      setIsOpeningClosing(true);

      const startFade = () => {
        Animated.timing(openingOpacity, {
          toValue: 0,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          openingPlayer.pause();
          setShowOpeningVideo(false);
          setIsOpeningClosing(false);
          openingOpacity.setValue(1);
        });
      };

      if (delayMs > 0) {
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current);
        }
        closeTimerRef.current = setTimeout(startFade, delayMs);
        return;
      }

      startFade();
    },
    [showOpeningVideo, isOpeningClosing, openingOpacity, openingPlayer]
  );

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  useEffect(() => {
    if (fontsLoaded && isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isInitialized]);

  useEffect(() => {
    if (!showOpeningVideo) {
      return;
    }

    const endSubscription = openingPlayer.addListener('playToEnd', () => {
      closeOpeningVideo(120);
    });

    const errorSubscription = openingPlayer.addListener('statusChange', ({ status }) => {
      if (status === 'error') {
        closeOpeningVideo();
      }
    });

    // Fallback : ferme l'overlay après 6s si la vidéo ne joue pas (simulateur, iOS beta, etc.)
    const safetyTimer = setTimeout(() => closeOpeningVideo(), 6000);

    return () => {
      endSubscription.remove();
      errorSubscription.remove();
      clearTimeout(safetyTimer);
    };
  }, [showOpeningVideo, openingPlayer, closeOpeningVideo]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

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
          <BottomSheetModalProvider>
            <RealtimeProvider>
              <StatusBar style="auto" />
              <View style={{ flex: 1 }}>
                <ErrorBoundary>
                <Stack
                  screenOptions={({ navigation }) => ({
                    ...stackScreenOptions,
                    headerBackVisible: false,
                    headerLeft: ({ tintColor }) =>
                      navigation.canGoBack() ? (
                        <Pressable
                          onPress={() => goBackOrFallback(router)}
                          hitSlop={12}
                          style={styles.headerBackButton}
                        >
                          <ChevronLeft size={22} color={tintColor ?? '#1F1B2D'} />
                        </Pressable>
                      ) : undefined,
                  })}
                >
                  <Stack.Screen name="(auth)" options={fadeScreenOptions} />
                  <Stack.Screen name="(tabs)" options={fadeScreenOptions} />
                  <Stack.Screen name="provider/[id]" options={providerScreenOptions} />
                  <Stack.Screen name="event/create" options={modalScreenOptions} />
                  <Stack.Screen name="event/[id]" />
                  <Stack.Screen name="booking/[providerId]" options={bareModalScreenOptions} />
                  <Stack.Screen name="booking/[id]/details" />
                  <Stack.Screen name="booking/[id]/quote" />
                  <Stack.Screen name="compare" />
                  <Stack.Screen name="chat/[conversationId]" options={chatScreenOptions} />
                  <Stack.Screen name="chat/new" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                  <Stack.Screen name="reviews/write/[bookingId]" options={modalScreenOptions} />
                  <Stack.Screen name="reviews/provider/[providerId]" />
                  <Stack.Screen name="reviews/user" />
                  <Stack.Screen name="notifications/index" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="settings/notifications" />
                  <Stack.Screen name="settings/delete-account" />
                </Stack>
                </ErrorBoundary>
                <OfflineIndicator floating />
                <GlobalToast />
                <BadgeUnlockOverlay />

                {showOpeningVideo && (
                  <Animated.View
                    pointerEvents={isOpeningClosing ? 'none' : 'auto'}
                    style={[styles.openingOverlay, { opacity: openingOpacity }]}
                  >
                    <VideoView
                      style={styles.openingVideo}
                      player={openingPlayer}
                      nativeControls={false}
                      contentFit="cover"
                    />
                    <Pressable
                      style={styles.skipButton}
                      onPress={() => closeOpeningVideo()}
                    >
                      <Text style={styles.skipButtonText}>Passer</Text>
                    </Pressable>
                  </Animated.View>
                )}
              </View>
            </RealtimeProvider>
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  openingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 999,
  },
  openingVideo: {
    flex: 1,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    backgroundColor: '#00000066',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

// Sentry.wrap ajoute le suivi des erreurs au niveau racine (no-op sans DSN)
export default sentryEnabled ? Sentry.wrap(RootLayout) : RootLayout;
