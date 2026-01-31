/**
 * Hook pour gérer les push notifications avec Expo
 *
 * ATTENTION: Ce hook nécessite les dépendances suivantes:
 * npx expo install expo-notifications expo-device
 *
 * Sans ces dépendances, les fonctions sont des no-ops.
 */

import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/stores/notificationStore';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './useAuth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModule = any;

// Types pour les notifications
interface NotificationSubscription {
  remove: () => void;
}

// Essayer de charger les modules optionnels
let Notifications: AnyModule = null;
let Device: AnyModule = null;
let Constants: AnyModule = null;
let modulesLoaded = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Device = require('expo-device');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Constants = require('expo-constants').default;
  modulesLoaded = true;

  // Configuration du handler de notifications
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch {
  console.log(
    'expo-notifications non installé. Les push notifications sont désactivées.'
  );
}

export function usePushNotifications() {
  const router = useRouter();
  const { userId } = useAuth();
  const incrementUnread = useNotificationStore(
    (state) => state.incrementUnread
  );
  const [isAvailable] = useState(modulesLoaded);

  const notificationListener = useRef<NotificationSubscription | null>(null);
  const responseListener = useRef<NotificationSubscription | null>(null);

  // Enregistrer pour les push notifications
  const registerForPushNotifications =
    useCallback(async (): Promise<string | null> => {
      if (!modulesLoaded || !Notifications || !Device) {
        return null;
      }

      if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
      }

      // Vérifier/demander les permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission not granted for push notifications');
        return null;
      }

      // Obtenir le token
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId;

      // Si pas de projectId, on ne peut pas obtenir le token (Expo Go ou dev build sans EAS)
      if (!projectId) {
        console.log('Push notifications: No projectId configured. Skipping token registration.');
        return null;
      }

      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId,
        });

        // Configuration Android
        if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
          Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance?.MAX ?? 4,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#5E4074',
          });
        }

        return token.data;
      } catch (error) {
        console.log('Push notifications: Failed to get token:', error);
        return null;
      }
    }, []);

  // Sauvegarder le token en BDD (utilise profiles.push_token)
  const savePushToken = useCallback(
    async (token: string) => {
      if (!userId) return;

      const { error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);

      if (error) console.error('Error saving push token:', error);
    },
    [userId]
  );

  // Supprimer le token au logout
  const removePushToken = useCallback(async () => {
    if (!userId) return;

    const { error } = await supabase
      .from('profiles')
      .update({ push_token: null })
      .eq('id', userId);

    if (error) console.error('Error removing push token:', error);
  }, [userId]);

  // Navigation selon le type de notification
  const handleNotificationNavigation = useCallback(
    (data: Record<string, unknown>) => {
      if (data.conversationId) {
        router.push(`/chat/${data.conversationId}` as never);
      } else if (data.bookingId) {
        router.push(`/booking/${data.bookingId}/details` as never);
      } else if (data.eventId) {
        router.push(`/event/${data.eventId}` as never);
      } else if (data.providerId) {
        router.push(`/provider/${data.providerId}` as never);
      }
    },
    [router]
  );

  // Setup au mount
  useEffect(() => {
    if (!userId || !modulesLoaded || !Notifications) return;

    // Enregistrer et sauvegarder le token
    registerForPushNotifications().then((token) => {
      if (token) savePushToken(token);
    });

    // Listener pour notifications reçues en foreground
    if (Notifications.addNotificationReceivedListener) {
      notificationListener.current =
        Notifications.addNotificationReceivedListener(() => {
          incrementUnread();
        });
    }

    // Listener pour tap sur notification
    if (Notifications.addNotificationResponseReceivedListener) {
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener(
          (response: AnyModule) => {
            const data = response?.notification?.request?.content
              ?.data as Record<string, unknown>;
            if (data) {
              handleNotificationNavigation(data);
            }
          }
        );
    }

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [
    userId,
    registerForPushNotifications,
    savePushToken,
    incrementUnread,
    handleNotificationNavigation,
  ]);

  return {
    registerForPushNotifications,
    savePushToken,
    removePushToken,
    isAvailable,
  };
}

// Hook pour demander les permissions manuellement (après onboarding)
export function useRequestPushPermissions() {
  const { registerForPushNotifications, savePushToken } =
    usePushNotifications();

  const requestPermissions = useCallback(async () => {
    const token = await registerForPushNotifications();
    if (token) {
      await savePushToken(token);
      return true;
    }
    return false;
  }, [registerForPushNotifications, savePushToken]);

  return { requestPermissions };
}
