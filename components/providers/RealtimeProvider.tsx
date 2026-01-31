/**
 * Composant qui initialise les subscriptions Realtime
 * À inclure dans le layout principal
 */

import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useRealtimeSubscriptions } from '@/hooks/useRealtime';
import React from 'react';

interface RealtimeProviderProps {
    children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
    // Initialiser les subscriptions Realtime
    useRealtimeSubscriptions();

    // Initialiser les push notifications
    usePushNotifications();

    // Charger le compteur de notifications non lues
    useUnreadNotificationsCount();

    return <>{children}</>;
}
