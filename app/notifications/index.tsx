/**
 * Notifications Screen
 * Dark Mode Support
 */

import {
  EmptyNotifications,
  NotificationCard,
} from '@/components/notifications';
import { ClientHeader } from '@/components/client/ClientHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import {
  useMarkAllNotificationsAsRead,
  useNotifications,
} from '@/hooks/useNotifications';
import { useNotificationStore } from '@/stores/notificationStore';
import { AppNotification } from '@/types';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, CheckCheck } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';

export default function NotificationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
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

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <ClientHeader
          eyebrow="Notifications"
          title="Activité récente"
          subtitle="Tes messages, réservations et confirmations arrivent ici."
          colors={colors}
          isDark={isDark}
          leadingIcon={ArrowLeft}
          leadingLabel="Retour"
          onLeading={() => goBackOrFallback(router)}
        />
        <LoadingSpinner fullScreen message="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ClientHeader
        eyebrow="Notifications"
        title="Activité récente"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} à lire.`
            : 'Tout est à jour pour le moment.'
        }
        colors={colors}
        isDark={isDark}
        leadingIcon={ArrowLeft}
        leadingLabel="Retour"
        onLeading={() => goBackOrFallback(router)}
        actionIcon={unreadCount > 0 ? CheckCheck : undefined}
        actionLabel="Tout marquer comme lu"
        actionDisabled={isMarkingAll}
        onAction={unreadCount > 0 ? handleMarkAllAsRead : undefined}
      />
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={<EmptyNotifications />}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyList,
        ]}
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
  listContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
    gap: Layout.spacing.sm,
  },
  loadingMore: {
    paddingVertical: Layout.spacing.lg,
    alignItems: 'center',
  },
});
