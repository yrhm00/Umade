/**
 * Notifications Screen
 * Dark Mode Support
 */

import {
  EmptyNotifications,
  NotificationCard,
} from '@/components/notifications';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import {
  useMarkAllNotificationsAsRead,
  useNotifications,
} from '@/hooks/useNotifications';
import { useNotificationStore } from '@/stores/notificationStore';
import { AppNotification } from '@/types';
import { Stack } from 'expo-router';
import { CheckCheck } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const colors = useColors();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useNotifications();

  const { mutate: markAllAsRead, isPending: isMarkingAll } =
    useMarkAllNotificationsAsRead();
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  const notifications = useMemo(() => {
    return data?.pages.flat() ?? [];
  }, [data]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => (
      <NotificationCard notification={item} />
    ),
    []
  );

  const keyExtractor = useCallback(
    (item: AppNotification) => item.id,
    []
  );

  const ListFooter = useMemo(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [isFetchingNextPage, colors.primary]);

  const HeaderRight = useCallback(() => {
    if (unreadCount === 0) return null;
    return (
      <TouchableOpacity
        onPress={handleMarkAllAsRead}
        disabled={isMarkingAll}
        style={styles.markAllButton}
      >
        <CheckCheck size={20} color={colors.primary} />
      </TouchableOpacity>
    );
  }, [unreadCount, isMarkingAll, colors.primary]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Notifications',
            headerBackTitle: 'Retour',
          }}
        />
        <LoadingSpinner fullScreen message="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerBackTitle: 'Retour',
          headerRight: HeaderRight,
        }}
      />
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={<EmptyNotifications />}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyList : undefined
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyList: {
    flexGrow: 1,
  },
  loadingMore: {
    paddingVertical: Layout.spacing.lg,
    alignItems: 'center',
  },
  markAllButton: {
    padding: Layout.spacing.sm,
  },
});
