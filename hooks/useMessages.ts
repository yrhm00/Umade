/**
 * Hook pour gérer les messages d'une conversation
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Config } from '@/constants/Config';
import { useAuth } from './useAuth';
import { MessageWithSender, CreateMessageInput } from '@/types';

const MESSAGES_PER_PAGE = 30;

// === FETCH FUNCTIONS ===

async function fetchMessages(
  conversationId: string,
  cursor?: string
): Promise<MessageWithSender[]> {
  let query = supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(MESSAGES_PER_PAGE);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as MessageWithSender[]) || [];
}

async function sendMessage(
  userId: string,
  input: CreateMessageInput
): Promise<MessageWithSender> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: input.conversation_id,
      sender_id: userId,
      content: input.content,
    })
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return data as MessageWithSender;
}

async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .is('read_at', null);

  if (error) throw error;
}

// === HOOKS ===

export function useMessages(conversationId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) => fetchMessages(conversationId!, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.length < MESSAGES_PER_PAGE) return undefined;
      return lastPage[lastPage.length - 1]?.created_at ?? undefined;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!conversationId,
    staleTime: 1000 * 60,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { userId, profile } = useAuth();

  return useMutation({
    mutationFn: (input: CreateMessageInput) => sendMessage(userId!, input),

    // Optimistic update: add message immediately
    onMutate: async (input) => {
      await queryClient.cancelQueries({
        queryKey: ['messages', input.conversation_id],
      });

      const previousData = queryClient.getQueryData([
        'messages',
        input.conversation_id,
      ]);

      const optimisticMessage: MessageWithSender = {
        id: `temp-${Date.now()}`,
        conversation_id: input.conversation_id,
        sender_id: userId!,
        content: input.content,
        read_at: null,
        created_at: new Date().toISOString(),
        sender: {
          id: userId!,
          full_name: profile?.full_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
        },
      };

      queryClient.setQueryData(
        ['messages', input.conversation_id],
        (oldData: any) => {
          if (!oldData) {
            return {
              pages: [[optimisticMessage]],
              pageParams: [undefined],
            };
          }
          const newPages = [...oldData.pages];
          newPages[0] = [optimisticMessage, ...newPages[0]];
          return { ...oldData, pages: newPages };
        }
      );

      return { previousData };
    },

    // Rollback on error
    onError: (_err, input, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['messages', input.conversation_id],
          context.previousData
        );
      }
    },

    // Refresh conversations list to update last_message
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.conversations],
      });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: (conversationId: string) =>
      markMessagesAsRead(conversationId, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.conversations],
      });
    },
  });
}
