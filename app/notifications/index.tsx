import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCheck } from 'lucide-react-native';
import {
  NotificationCard,
  EmptyNotifications,
} from '@/components/notifications';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
} from '@/hooks/useNotifications';
import { useNotificationStore } from '@/stores/notificationStore';
import { AppNotification } from '@/types';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

export default function NotificationsScreen() {
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

  // Flatten infinite query pages
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
        <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
      </View>
    );
  }, [isFetchingNextPage]);

  const HeaderRight = useCallback(() => {
    if (unreadCount === 0) return null;
    return (
      <TouchableOpacity
        onPress={handleMarkAllAsRead}
        disabled={isMarkingAll}
        style={styles.markAllButton}
      >
        <CheckCheck size={20} color={Colors.primary.DEFAULT} />
      </TouchableOpacity>
    );
  }, [unreadCount, isMarkingAll]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
            tintColor={Colors.primary.DEFAULT}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
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
