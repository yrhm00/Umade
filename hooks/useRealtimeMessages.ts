/**
 * Hooks pour les subscriptions Supabase Realtime sur les messages
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Config } from '@/constants/Config';
import { MessageWithSender } from '@/types';

type RealtimeStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR';

function subscribeWithRetry(
  channel: ReturnType<typeof supabase.channel>,
  channelName: string,
  retryCount = 0,
  maxRetries = 3
) {
  const retryDelay = Math.min(2000 * Math.pow(2, retryCount), 16000);

  channel.subscribe((status: RealtimeStatus, err?: Error) => {
    if (status === 'SUBSCRIBED') {
      if (__DEV__) console.log(`[Realtime] ${channelName} subscribed`);
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      if (__DEV__) console.warn(`[Realtime] ${channelName} error (${status}):`, err?.message);

      if (retryCount < maxRetries) {
        setTimeout(() => {
          if (__DEV__) console.log(`[Realtime] Retrying ${channelName} (attempt ${retryCount + 1}/${maxRetries})...`);
          supabase.removeChannel(channel);
        }, retryDelay);
      }
    }
  });
}

/**
 * Subscribe to new messages in a specific conversation.
 * Adds incoming messages to the React Query cache in real time.
 */
export function useRealtimeMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (!conversationId || !userId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;

          // Skip our own messages (already added via optimistic update)
          if (newMsg.sender_id === userId) return;

          // Resolve sender from cache first, fetch only on miss
          const cachedProfile = queryClient.getQueryData<{ id: string; full_name: string | null; avatar_url: string | null }>(
            ['profiles', newMsg.sender_id]
          );
          let sender = cachedProfile ?? null;
          if (!sender) {
            const { data } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', newMsg.sender_id)
              .single();
            sender = data;
            if (data) {
              queryClient.setQueryData(['profiles', newMsg.sender_id], data);
            }
          }

          const messageWithSender: MessageWithSender = {
            id: newMsg.id,
            conversation_id: newMsg.conversation_id,
            sender_id: newMsg.sender_id,
            content: newMsg.content,
            read_at: newMsg.read_at,
            created_at: newMsg.created_at,
            deleted_for_all: newMsg.deleted_for_all ?? false,
            deleted_for_all_at: newMsg.deleted_for_all_at ?? null,
            deleted_for_all_by: newMsg.deleted_for_all_by ?? null,
            sender: sender || undefined,
          };

          // Add to the beginning of the first page (newest messages)
          queryClient.setQueryData(
            ['messages', conversationId],
            (oldData: any) => {
              if (!oldData) {
                return {
                  pages: [[messageWithSender]],
                  pageParams: [undefined],
                };
              }

              // Deduplicate
              const allIds = new Set(
                oldData.pages.flat().map((m: MessageWithSender) => m.id)
              );
              if (allIds.has(newMsg.id)) return oldData;

              const newPages = [...oldData.pages];
              newPages[0] = [messageWithSender, ...newPages[0]];
              return { ...oldData, pages: newPages };
            }
          );

          // Mark as read immediately since user is viewing the conversation
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', newMsg.id);
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
        (payload) => {
          const updated = payload.new as any;

          // Update message in cache (read receipts + soft deletion for everyone)
          queryClient.setQueryData(
            ['messages', conversationId],
            (oldData: any) => {
              if (!oldData) return oldData;

              const newPages = oldData.pages.map((page: MessageWithSender[]) =>
                page.map((msg) =>
                  msg.id === updated.id
                    ? {
                        ...msg,
                        content: updated.content,
                        read_at: updated.read_at,
                        deleted_for_all: updated.deleted_for_all ?? false,
                        deleted_for_all_at: updated.deleted_for_all_at ?? null,
                        deleted_for_all_by: updated.deleted_for_all_by ?? null,
                      }
                    : msg
                )
              );
              return { ...oldData, pages: newPages };
            }
          );
        }
      );

    subscribeWithRetry(channel, `messages:${conversationId}`);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, queryClient]);
}

/**
 * Subscribe to all new messages for the current user (for tab badge updates).
 * This runs on the messages tab to keep the unread count updated.
 */
export function useRealtimeConversations() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('user-conversations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const next = payload.new as any;
          const prev = payload.old as any;

          if (next.deleted_for_all !== prev.deleted_for_all || next.content !== prev.content) {
            queryClient.invalidateQueries({
              queryKey: [Config.cacheKeys.conversations],
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as any;

          // Skip our own messages
          if (newMsg.sender_id === userId) return;

          // Refresh conversations list to update last_message and unread_count
          queryClient.invalidateQueries({
            queryKey: [Config.cacheKeys.conversations],
          });
        }
      );

    subscribeWithRetry(channel, 'user-conversations');

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
