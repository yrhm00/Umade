/**
 * Hook pour les statistiques du provider (dashboard)
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

interface ProviderStats {
    bookingsCount: number;
    unreadMessagesCount: number;
    averageRating: number | null;
    reviewCount: number;
    providerId: string | null;
}

async function fetchProviderStats(userId: string): Promise<ProviderStats> {
    // 1. Récupérer le provider associé à cet utilisateur
    const { data: provider, error: providerError } = await supabase
        .from('providers')
        .select('id, average_rating, review_count')
        .eq('user_id', userId)
        .single();

    if (providerError) {
        if (providerError.code === 'PGRST116') {
            // Pas de provider pour cet utilisateur
            return {
                bookingsCount: 0,
                unreadMessagesCount: 0,
                averageRating: null,
                reviewCount: 0,
                providerId: null,
            };
        }
        throw providerError;
    }

    const providerId = provider.id;

    // 2. Compter les réservations (toutes)
    const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', providerId);

    // 3. Récupérer les conversations du provider
    const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('provider_id', providerId);

    // 4. Compter les messages non lus dans ces conversations
    let unreadMessagesCount = 0;
    if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map((c) => c.id);
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', conversationIds)
            .neq('sender_id', userId)
            .is('read_at', null);
        unreadMessagesCount = count || 0;
    }

    return {
        bookingsCount: bookingsCount || 0,
        unreadMessagesCount,
        averageRating: provider.average_rating,
        reviewCount: provider.review_count || 0,
        providerId,
    };
}

export function useProviderStats() {
    const { userId, isProvider } = useAuth();

    return useQuery({
        queryKey: [Config.cacheKeys.providers, 'stats', userId],
        queryFn: () => fetchProviderStats(userId!),
        enabled: !!userId && isProvider,
        staleTime: 1000 * 60, // 1 minute
    });
}

/**
 * Hook pour récupérer les conversations d'un provider
 */
export function useProviderConversations() {
    const { userId } = useAuth();

    return useQuery({
        queryKey: [Config.cacheKeys.conversations, 'provider', userId],
        queryFn: async () => {
            // D'abord, récupérer le provider_id
            const { data: provider } = await supabase
                .from('providers')
                .select('id')
                .eq('user_id', userId!)
                .single();

            if (!provider) return [];

            // Ensuite, récupérer les conversations de ce provider (non cachées)
            const { data: conversations, error } = await supabase
                .from('conversations')
                .select(`
          *,
          client:profiles!conversations_client_id_fkey(id, full_name, avatar_url)
        `)
                .eq('provider_id', provider.id)
                .eq('provider_hidden', false)
                .order('provider_pinned', { ascending: false })
                .order('last_message_at', { ascending: false, nullsFirst: false });

            if (error) throw error;
            if (!conversations) return [];

            // Enrichir avec le dernier message et isPinned
            const enriched = await Promise.all(
                conversations.map(async (conv) => {
                    const { data: lastMsg } = await supabase
                        .from('messages')
                        .select('content, sender_id, created_at')
                        .eq('conversation_id', conv.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    const { count } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('conversation_id', conv.id)
                        .neq('sender_id', userId!)
                        .is('read_at', null);

                    return {
                        ...conv,
                        last_message: lastMsg || undefined,
                        unread_count: count || 0,
                        isPinned: (conv as any).provider_pinned || false,
                    };
                })
            );

            // Sort: pinned first, then by last message date
            enriched.sort((a, b) => {
                const aPinned = a.isPinned ? 1 : 0;
                const bPinned = b.isPinned ? 1 : 0;

                if (bPinned !== aPinned) {
                    return bPinned - aPinned;
                }

                const aDate = new Date(a.last_message_at || a.created_at || 0).getTime();
                const bDate = new Date(b.last_message_at || b.created_at || 0).getTime();
                return bDate - aDate;
            });

            return enriched;
        },
        enabled: !!userId,
        staleTime: 1000 * 30,
    });
}
