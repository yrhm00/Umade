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
    const today = new Date().toISOString().split('T')[0];

    // 2. Compter les réservations ET récupérer les conversations en parallèle
    const [bookingsResult, conversationsResult] = await Promise.all([
        supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', providerId)
            // Le compteur "Réservations" du dashboard ne prend en compte
            // que les réservations à venir en attente ou confirmées.
            .gte('booking_date', today)
            .in('status', ['pending', 'confirmed']),
        supabase
            .from('conversations')
            .select('id')
            .eq('provider_id', providerId),
    ]);

    const bookingsCount = bookingsResult.count;
    const conversations = conversationsResult.data;

    // 3. Compter les messages non lus dans ces conversations
    let unreadMessagesCount = 0;
    if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map((c) => c.id);
        const { data: unreadMessages } = await supabase
            .from('messages')
            .select('id')
            .in('conversation_id', conversationIds)
            .neq('sender_id', userId)
            .eq('deleted_for_all', false)
            .is('read_at', null);

        if (unreadMessages && unreadMessages.length > 0) {
            const unreadIds = unreadMessages.map((m) => m.id);
            const { data: hiddenUnread } = await supabase
                .from('message_deletions')
                .select('message_id')
                .eq('user_id', userId)
                .in('message_id', unreadIds);

            const hiddenSet = new Set((hiddenUnread || []).map((row) => row.message_id));
            unreadMessagesCount = unreadMessages.filter((m) => !hiddenSet.has(m.id)).length;
        }
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
            if (!conversations || conversations.length === 0) return [];

            const conversationIds = conversations.map((c) => c.id);

            // Batch fetch : tous les messages récents + tous les unread (2 requêtes au lieu de 4*N)
            const [allMessagesResult, allUnreadResult] = await Promise.all([
                supabase
                    .from('messages')
                    .select('id, conversation_id, content, sender_id, created_at, deleted_for_all')
                    .in('conversation_id', conversationIds)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('messages')
                    .select('id, conversation_id')
                    .in('conversation_id', conversationIds)
                    .neq('sender_id', userId!)
                    .eq('deleted_for_all', false)
                    .is('read_at', null),
            ]);

            const allMessages = allMessagesResult.data || [];
            const allUnread = allUnreadResult.data || [];

            // Batch fetch hidden messages (1 requête)
            const allMessageIds = allMessages.map((m) => m.id);
            const allUnreadIds = allUnread.map((m) => m.id);
            const allIdsToCheck = [...new Set([...allMessageIds, ...allUnreadIds])];

            let hiddenSet = new Set<string>();
            if (allIdsToCheck.length > 0) {
                const { data: hiddenMessages } = await supabase
                    .from('message_deletions')
                    .select('message_id')
                    .eq('user_id', userId!)
                    .in('message_id', allIdsToCheck);
                hiddenSet = new Set((hiddenMessages || []).map((row) => row.message_id));
            }

            // Construire le Map du dernier message par conversation
            const lastMessageMap = new Map<string, any>();
            for (const msg of allMessages) {
                if (hiddenSet.has(msg.id)) continue;
                if (!lastMessageMap.has(msg.conversation_id)) {
                    lastMessageMap.set(msg.conversation_id, {
                        content: msg.content,
                        sender_id: msg.sender_id,
                        created_at: msg.created_at,
                        deleted_for_all: (msg as any).deleted_for_all ?? false,
                    });
                }
            }

            // Construire le Map des unread counts par conversation
            const unreadCountMap = new Map<string, number>();
            for (const msg of allUnread) {
                if (hiddenSet.has(msg.id)) continue;
                unreadCountMap.set(msg.conversation_id, (unreadCountMap.get(msg.conversation_id) || 0) + 1);
            }

            // Enrichir les conversations
            const enriched = conversations.map((conv) => ({
                ...conv,
                last_message: lastMessageMap.get(conv.id) || undefined,
                unread_count: unreadCountMap.get(conv.id) || 0,
                isPinned: (conv as any).provider_pinned || false,
            }));

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
