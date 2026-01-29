/**
 * Hook pour gérer les notifications
 * Avec pagination infinie et realtime
 */

import { useEffect } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Config } from '@/constants/Config';
import { useAuth } from './useAuth';
import { useNotificationStore } from '@/stores/notificationStore';
import { AppNotification } from '@/types';

const NOTIFICATIONS_PER_PAGE = Config.notificationsPageSize;

// === FETCH FUNCTIONS ===

async function fetchUserNotifications(
  userId: string,
  cursor?: string
): Promise<AppNotification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(NOTIFICATIONS_PER_PAGE);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as AppNotification[]) || [];
}

async function fetchUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
}

// === HOOKS ===

export function useNotifications() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { incrementUnread, setLastNotification } = useNotificationStore();

  // Écouter les nouvelles notifications en temps réel
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as AppNotification;

          // Update cache
          queryClient.setQueryData<{
            pages: AppNotification[][];
            pageParams: (string | undefined)[];
          }>([Config.cacheKeys.notifications, userId], (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: [[newNotification, ...old.pages[0]], ...old.pages.slice(1)],
            };
          });

          // Update unread count
          incrementUnread();

          // Set last notification for toast display
          setLastNotification(newNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, incrementUnread, setLastNotification]);

  return useInfiniteQuery({
    queryKey: [Config.cacheKeys.notifications, userId],
    queryFn: ({ pageParam }) => fetchUserNotifications(userId!, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.length < NOTIFICATIONS_PER_PAGE) return undefined;
      return lastPage[lastPage.length - 1]?.created_at;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!userId,
  });
}

export function useUnreadNotificationsCount() {
  const { userId } = useAuth();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  return useQuery({
    queryKey: [Config.cacheKeys.notifications, userId, 'unread-count'],
    queryFn: async () => {
      const count = await fetchUnreadCount(userId!);
      setUnreadCount(count);
      return count;
    },
    enabled: !!userId,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const decrementUnread = useNotificationStore((state) => state.decrementUnread);

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      decrementUnread();
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.notifications, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.notifications, userId, 'unread-count'],
      });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  return useMutation({
    mutationFn: () => markAllAsRead(userId!),
    onSuccess: () => {
      setUnreadCount(0);
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.notifications, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.notifications, userId, 'unread-count'],
      });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.notifications, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.notifications, userId, 'unread-count'],
      });
    },
  });
}
