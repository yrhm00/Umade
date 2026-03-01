/**
 * Hook centralisé pour les abonnements Realtime Supabase
 * Gère les mises à jour en temps réel pour messages, bookings, conversations
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/stores/notificationStore';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useMyProviderId } from './useMyProviderId';

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

type RealtimeStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR';

/**
 * Subscribe with error handling and retry logic
 */
function subscribeWithRetry(
    channel: ReturnType<typeof supabase.channel>,
    channelName: string,
    retryCount = 0,
    maxRetries = 3
) {
    const retryDelay = Math.min(2000 * Math.pow(2, retryCount), 16000); // 2s, 4s, 8s, 16s max

    channel.subscribe((status: RealtimeStatus, err?: Error) => {
        if (status === 'SUBSCRIBED') {
            if (__DEV__) console.log(`[Realtime] ${channelName} subscribed`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            if (__DEV__) console.warn(`[Realtime] ${channelName} error (${status}):`, err?.message);

            if (retryCount < maxRetries) {
                setTimeout(() => {
                    if (__DEV__) console.log(`[Realtime] Retrying ${channelName} (attempt ${retryCount + 1}/${maxRetries})...`);
                    supabase.removeChannel(channel);
                    // The channel will be re-created by the parent effect on next render
                }, retryDelay);
            }
        } else if (status === 'CLOSED') {
            if (__DEV__) console.log(`[Realtime] ${channelName} closed`);
        }
    });
}

/**
 * Hook principal pour les abonnements Realtime
 * À utiliser dans le layout principal de l'app
 */
export function useRealtimeSubscriptions() {
    const { userId, isProvider } = useAuth();
    const providerId = useMyProviderId();
    const queryClient = useQueryClient();
    const { incrementUnread } = useNotificationStore();

    const invalidateConversations = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: [Config.cacheKeys.conversations],
        });
    }, [queryClient]);

    const invalidateBookings = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: [Config.cacheKeys.bookings],
        });
    }, [queryClient]);

    useEffect(() => {
        if (!userId) return;

        const channels: ReturnType<typeof supabase.channel>[] = [];

        // 1. Écouter les nouveaux messages
        const messagesChannel = supabase
            .channel(`messages:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    const newMessage = payload.new as Message;

                    if (newMessage.sender_id === userId) return;

                    // Invalider les conversations (preview + unread count)
                    // Les messages individuels sont geres par useRealtimeMessages par conversation
                    invalidateConversations();
                    incrementUnread();
                }
            );

        subscribeWithRetry(messagesChannel, 'messages');
        channels.push(messagesChannel);

        // 2. Écouter les mises à jour de conversations
        const conversationsChannel = supabase
            .channel(`conversations:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                },
                () => {
                    invalidateConversations();
                }
            );

        subscribeWithRetry(conversationsChannel, 'conversations');
        channels.push(conversationsChannel);

        // 3. Écouter les bookings (clients)
        const clientBookingsChannel = supabase
            .channel(`bookings:client:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `client_id=eq.${userId}`,
                },
                () => {
                    invalidateBookings();
                }
            );

        subscribeWithRetry(clientBookingsChannel, 'client-bookings');
        channels.push(clientBookingsChannel);

        // 4. Écouter les bookings (providers)
        if (isProvider && providerId) {
            const providerBookingsChannel = supabase
                .channel(`bookings:provider:${providerId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'bookings',
                        filter: `provider_id=eq.${providerId}`,
                    },
                    (payload) => {
                        invalidateBookings();

                        if (payload.eventType === 'INSERT') {
                            incrementUnread();
                        }
                    }
                );

            subscribeWithRetry(providerBookingsChannel, 'provider-bookings');
            channels.push(providerBookingsChannel);
        }

        return () => {
            if (__DEV__) console.log('[Realtime] Cleaning up subscriptions...');
            channels.forEach((channel) => {
                supabase.removeChannel(channel);
            });
        };
    }, [userId, isProvider, providerId, queryClient, invalidateConversations, invalidateBookings, incrementUnread]);
}

