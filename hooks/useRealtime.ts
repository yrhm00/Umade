/**
 * Hook centralisé pour les abonnements Realtime Supabase
 * Gère les mises à jour en temps réel pour messages, bookings, conversations
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/stores/notificationStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

/**
 * Hook pour récupérer le provider_id de l'utilisateur connecté (si provider)
 */
function useProviderId() {
    const { userId, isProvider } = useAuth();

    const { data: providerId } = useQuery({
        queryKey: ['provider-id', userId],
        queryFn: async () => {
            if (!userId) return null;
            const { data, error } = await supabase
                .from('providers')
                .select('id')
                .eq('user_id', userId)
                .single();
            if (error) return null;
            return data?.id as string | null;
        },
        enabled: !!userId && isProvider,
        staleTime: Infinity, // Ne change jamais
    });

    return providerId ?? null;
}

/**
 * Hook principal pour les abonnements Realtime
 * À utiliser dans le layout principal de l'app
 */
export function useRealtimeSubscriptions() {
    const { userId, isProvider } = useAuth();
    const providerId = useProviderId();
    const queryClient = useQueryClient();
    const { incrementUnread } = useNotificationStore();

    // Callback pour invalider les queries de conversations
    const invalidateConversations = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: [Config.cacheKeys.conversations],
        });
    }, [queryClient]);

    // Callback pour invalider les queries de bookings
    const invalidateBookings = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: [Config.cacheKeys.bookings],
        });
    }, [queryClient]);

    useEffect(() => {
        if (!userId) return;

        const channels: ReturnType<typeof supabase.channel>[] = [];

        // ==========================================
        // 1. Écouter les nouveaux messages
        // ==========================================
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

                    // Ne pas notifier si c'est notre propre message
                    if (newMessage.sender_id === userId) return;

                    console.log('[Realtime] New message received:', newMessage.id);

                    // Invalider la conversation concernée
                    queryClient.invalidateQueries({
                        queryKey: [Config.cacheKeys.messages, newMessage.conversation_id],
                    });

                    // Invalider la liste des conversations (pour mettre à jour le preview)
                    invalidateConversations();

                    // Incrémenter le compteur de non-lus
                    incrementUnread();
                }
            )
            .subscribe();

        channels.push(messagesChannel);

        // ==========================================
        // 2. Écouter les mises à jour de conversations
        // ==========================================
        const conversationsChannel = supabase
            .channel(`conversations:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'conversations',
                },
                (payload) => {
                    console.log('[Realtime] Conversation updated:', payload.eventType);
                    invalidateConversations();
                }
            )
            .subscribe();

        channels.push(conversationsChannel);

        // ==========================================
        // 3. Écouter les bookings (pour clients et providers)
        // ==========================================
        // Pour les clients - écouter les bookings où ils sont client
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
                (payload) => {
                    console.log('[Realtime] Client booking update:', payload.eventType);
                    invalidateBookings();
                }
            )
            .subscribe();

        channels.push(clientBookingsChannel);

        // Pour les providers - écouter les bookings où ils sont provider
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
                        console.log('[Realtime] Provider booking update:', payload.eventType);
                        invalidateBookings();

                        // Si c'est une nouvelle réservation, incrémenter le compteur
                        if (payload.eventType === 'INSERT') {
                            incrementUnread();
                        }
                    }
                )
                .subscribe();

            channels.push(providerBookingsChannel);
        }

        // Cleanup
        return () => {
            console.log('[Realtime] Cleaning up subscriptions...');
            channels.forEach((channel) => {
                supabase.removeChannel(channel);
            });
        };
    }, [userId, isProvider, providerId, queryClient, invalidateConversations, invalidateBookings, incrementUnread]);
}

/**
 * Hook pour écouter les messages d'une conversation spécifique
 * À utiliser dans l'écran de chat
 */
export function useRealtimeMessages(conversationId: string | undefined) {
    const { userId } = useAuth();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!conversationId || !userId) return;

        console.log('[Realtime] Subscribing to messages for conversation:', conversationId);

        const channel = supabase
            .channel(`chat:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    const newMessage = payload.new as Message;

                    console.log('[Realtime] New message in chat:', newMessage.id);

                    // Ajouter le message au cache directement pour une mise à jour instantanée
                    queryClient.setQueryData<Message[]>(
                        [Config.cacheKeys.messages, conversationId],
                        (oldData) => {
                            if (!oldData) return [newMessage];
                            // Éviter les doublons
                            if (oldData.some((m) => m.id === newMessage.id)) {
                                return oldData;
                            }
                            return [...oldData, newMessage];
                        }
                    );
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                () => {
                    // Rafraîchir pour les mises à jour (read_at, etc.)
                    queryClient.invalidateQueries({
                        queryKey: [Config.cacheKeys.messages, conversationId],
                    });
                }
            )
            .subscribe();

        return () => {
            console.log('[Realtime] Unsubscribing from messages for conversation:', conversationId);
            supabase.removeChannel(channel);
        };
    }, [conversationId, userId, queryClient]);
}
