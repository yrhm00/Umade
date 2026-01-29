/**
 * Hook pour gérer les conversations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Config } from '@/constants/Config';
import { useAuth } from './useAuth';
import { ConversationWithDetails } from '@/types';

// === FETCH FUNCTIONS ===

async function fetchUserConversations(
  userId: string
): Promise<ConversationWithDetails[]> {
  // Fetch conversations with provider and client info
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      *,
      provider:providers!conversations_provider_id_fkey(id, user_id, business_name),
      client:profiles!conversations_client_id_fkey(id, full_name, avatar_url)
    `)
    .or(`client_id.eq.${userId},provider_id.in.(select id from providers where user_id = '${userId}')`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  if (!conversations || conversations.length === 0) return [];

  // Enrich each conversation with last message and unread count
  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      // Last message
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, sender_id, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Unread count (messages not from me that haven't been read)
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', userId)
        .is('read_at', null);

      return {
        ...conv,
        last_message: lastMsg || undefined,
        unread_count: count || 0,
      } as ConversationWithDetails;
    })
  );

  return enriched;
}

async function fetchConversationById(
  conversationId: string,
  userId: string
): Promise<ConversationWithDetails | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      provider:providers!conversations_provider_id_fkey(id, user_id, business_name),
      client:profiles!conversations_client_id_fkey(id, full_name, avatar_url)
    `)
    .eq('id', conversationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return { ...data, unread_count: 0 } as ConversationWithDetails;
}

async function findOrCreateConversation(
  clientId: string,
  providerId: string
): Promise<{ id: string }> {
  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('client_id', clientId)
    .eq('provider_id', providerId)
    .single();

  if (existing) return existing;

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({
      client_id: clientId,
      provider_id: providerId,
    })
    .select('id')
    .single();

  if (error) throw error;
  return newConv;
}

// === HOOKS ===

export function useConversations() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [Config.cacheKeys.conversations, userId],
    queryFn: () => fetchUserConversations(userId!),
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}

export function useConversation(conversationId: string | undefined) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [Config.cacheKeys.conversations, 'detail', conversationId],
    queryFn: () => fetchConversationById(conversationId!, userId!),
    enabled: !!conversationId && !!userId,
  });
}

export function useFindOrCreateConversation() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: (providerId: string) =>
      findOrCreateConversation(userId!, providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.conversations],
      });
    },
  });
}

/**
 * Total unread messages across all conversations (for tab badge).
 */
export function useTotalUnreadCount(): number {
  const { data: conversations } = useConversations();
  return conversations?.reduce((sum, c) => sum + c.unread_count, 0) || 0;
}
