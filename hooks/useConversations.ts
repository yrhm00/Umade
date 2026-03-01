/**
 * Hook pour gérer les conversations
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import { ConversationWithDetails } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

// === FETCH FUNCTIONS ===

async function fetchUserConversations(
  userId: string
): Promise<ConversationWithDetails[]> {
  // D'abord, vérifier si l'utilisateur est un provider
  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('user_id', userId)
    .single();

  let query = supabase
    .from('conversations')
    .select(`
      *,
      provider:providers!conversations_provider_id_fkey(id, user_id, business_name),
      client:profiles!conversations_client_id_fkey(id, full_name, avatar_url)
    `);

  // Filtrer selon le rôle et gérer le tri/filtrage
  if (provider) {
    query = query
      .eq('provider_id', provider.id)
      .eq('provider_hidden', false)
      .order('provider_pinned', { ascending: false });
  } else {
    query = query
      .eq('client_id', userId)
      .eq('client_hidden', false)
      .order('client_pinned', { ascending: false });
  }

  query = query.order('last_message_at', { ascending: false, nullsFirst: false });

  const { data: conversations, error } = await query;

  if (error) throw error;
  if (!conversations || conversations.length === 0) return [];

  const conversationIds = conversations.map((c) => c.id);

  // Batch fetch: last messages for all conversations (1 query instead of N)
  const { data: allMessages } = await supabase
    .from('messages')
    .select('id, conversation_id, content, sender_id, created_at, deleted_for_all')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: false });

  let hiddenMessageSet = new Set<string>();
  if (allMessages && allMessages.length > 0) {
    const allMessageIds = allMessages.map((msg) => msg.id);
    const { data: hiddenMessages } = await supabase
      .from('message_deletions')
      .select('message_id')
      .eq('user_id', userId)
      .in('message_id', allMessageIds);

    hiddenMessageSet = new Set((hiddenMessages || []).map((row) => row.message_id));
  }

  const lastMessageMap = new Map<
    string,
    { content: string | null; sender_id: string; created_at: string | null; deleted_for_all: boolean | null }
  >();
  if (allMessages) {
    for (const msg of allMessages) {
      if (hiddenMessageSet.has(msg.id)) continue;
      // Keep only the first (most recent) message per conversation
      if (!lastMessageMap.has(msg.conversation_id)) {
        lastMessageMap.set(msg.conversation_id, {
          content: msg.content,
          sender_id: msg.sender_id,
          created_at: msg.created_at,
          deleted_for_all: (msg as any).deleted_for_all ?? false,
        });
      }
    }
  }

  // Batch fetch: unread messages for all conversations (1 query instead of N)
  const { data: unreadMessages } = await supabase
    .from('messages')
    .select('id, conversation_id')
    .in('conversation_id', conversationIds)
    .neq('sender_id', userId)
    .eq('deleted_for_all', false)
    .is('read_at', null);

  const unreadCountMap = new Map<string, number>();
  if (unreadMessages) {
    let hiddenUnreadSet = new Set<string>();
    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map((row) => row.id);
      const { data: hiddenUnread } = await supabase
        .from('message_deletions')
        .select('message_id')
        .eq('user_id', userId)
        .in('message_id', unreadIds);
      hiddenUnreadSet = new Set((hiddenUnread || []).map((row) => row.message_id));
    }

    for (const msg of unreadMessages) {
      if (hiddenUnreadSet.has((msg as any).id)) continue;
      unreadCountMap.set(msg.conversation_id, (unreadCountMap.get(msg.conversation_id) || 0) + 1);
    }
  }

  // Enrich conversations with batch-fetched data
  const enriched = conversations.map((conv) => {
    const isPinned = provider
      ? (conv as any).provider_pinned
      : (conv as any).client_pinned;

    return {
      ...conv,
      last_message: lastMessageMap.get(conv.id) || undefined,
      unread_count: unreadCountMap.get(conv.id) || 0,
      isPinned,
    } as ConversationWithDetails & { isPinned: boolean };
  });

  // Sort: pinned first, then by last message date
  enriched.sort((a, b) => {
    const aPinned = (a as any).isPinned ? 1 : 0;
    const bPinned = (b as any).isPinned ? 1 : 0;

    if (bPinned !== aPinned) {
      return bPinned - aPinned;
    }

    const aDate = new Date(a.last_message_at || a.created_at || 0).getTime();
    const bDate = new Date(b.last_message_at || b.created_at || 0).getTime();
    return bDate - aDate;
  });

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

export function usePinConversation() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const queryKey = [Config.cacheKeys.conversations, userId];

  return useMutation({
    mutationFn: async ({ conversationId, isPinned }: { conversationId: string; isPinned: boolean }) => {
      // Determine role for THIS conversation
      const { data: conv, error: fetchError } = await supabase
        .from('conversations')
        .select('client_id, provider_id')
        .eq('id', conversationId)
        .single();

      if (fetchError || !conv) throw fetchError || new Error('Conversation not found');

      // Check if I am the client
      if (conv.client_id === userId) {
        const { error } = await supabase
          .from('conversations')
          .update({ client_pinned: isPinned } as any)
          .eq('id', conversationId);
        if (error) throw error;
        return;
      }

      // Check if I am the provider (via provider table)
      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', userId!)
        .single();

      if (provider && conv.provider_id === provider.id) {
        const { error } = await supabase
          .from('conversations')
          .update({ provider_pinned: isPinned } as any)
          .eq('id', conversationId);
        if (error) throw error;
        return;
      }

      throw new Error('User is not a participant in this conversation');
    },
    onMutate: async ({ conversationId, isPinned }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousConversations = queryClient.getQueryData<ConversationWithDetails[]>(queryKey);

      if (previousConversations) {
        const updated = previousConversations.map(conv => {
          if (conv.id === conversationId) {
            return { ...conv, isPinned };
          }
          return conv;
        });

        updated.sort((a, b) => {
          const aPinned = (a as any).isPinned;
          const bPinned = (b as any).isPinned;
          if (aPinned === bPinned) {
            return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime();
          }
          return aPinned ? -1 : 1;
        });

        queryClient.setQueryData(queryKey, updated);
      }

      return { previousConversations };
    },
    onError: (err, newTodo, context) => {
      console.error('Error pinning conversation:', err);
      if (context?.previousConversations) {
        queryClient.setQueryData(queryKey, context.previousConversations);
      }
    },
    onSettled: () => {
      // Invalidate both client and provider conversation caches
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.conversations] });
    },
  });
}

export function useHideConversation() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const queryKey = [Config.cacheKeys.conversations, userId];

  return useMutation({
    mutationFn: async (conversationId: string) => {
      // Determine role for THIS conversation
      const { data: conv, error: fetchError } = await supabase
        .from('conversations')
        .select('client_id, provider_id')
        .eq('id', conversationId)
        .single();

      if (fetchError || !conv) throw fetchError || new Error('Conversation not found');

      // Check if I am the client
      if (conv.client_id === userId) {
        const { error } = await supabase
          .from('conversations')
          .update({ client_hidden: true } as any)
          .eq('id', conversationId);
        if (error) throw error;
        return;
      }

      // Check if I am the provider
      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', userId!)
        .single();

      if (provider && conv.provider_id === provider.id) {
        const { error } = await supabase
          .from('conversations')
          .update({ provider_hidden: true } as any)
          .eq('id', conversationId);
        if (error) throw error;
        return;
      }

      throw new Error('User is not a participant in this conversation');
    },
    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousConversations = queryClient.getQueryData<ConversationWithDetails[]>(queryKey);

      if (previousConversations) {
        queryClient.setQueryData(queryKey, previousConversations.filter(c => c.id !== conversationId));
      }

      return { previousConversations };
    },
    onError: (err, newTodo, context) => {
      console.error('Error hiding conversation:', err);
      if (context?.previousConversations) {
        queryClient.setQueryData(queryKey, context.previousConversations);
      }
    },
    onSettled: () => {
      // Invalidate both client and provider conversation caches
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.conversations] });
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
