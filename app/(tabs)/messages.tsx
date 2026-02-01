import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { useConversations, useHideConversation, usePinConversation } from '@/hooks/useConversations';
import { useRealtimeConversations } from '@/hooks/useRealtimeMessages';
import { ConversationWithDetails } from '@/types';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SwipeableConversationItem } from '@/components/chat/SwipeableConversationItem';

export default function MessagesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data: conversations, isLoading, refetch, isRefetching } =
    useConversations();

  const { mutate: pinConversation } = usePinConversation();
  const { mutate: hideConversation } = useHideConversation();

  // Real-time subscription for new messages across all conversations
  useRealtimeConversations();

  const handlePin = useCallback((id: string, currentPinnedState: boolean) => {
    pinConversation({ conversationId: id, isPinned: !currentPinnedState });
  }, [pinConversation]);

  const handleHide = useCallback((id: string) => {
    hideConversation(id);
  }, [hideConversation]);

  const renderItem = useCallback(
    ({ item }: { item: ConversationWithDetails }) => (
      <SwipeableConversationItem
        conversation={item}
        isPinned={(item as any).isPinned}
        onPin={handlePin}
        onHide={handleHide}
      />
    ),
    [handlePin, handleHide]
  );

  const keyExtractor = useCallback(
    (item: ConversationWithDetails) => item.id,
    []
  );

  const ItemSeparator = useCallback(
    () => <View style={[styles.separator, { backgroundColor: colors.border }]} />,
    [colors.border]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen message="Chargement..." />
      ) : conversations && conversations.length > 0 ? (
        <FlatList
          data={conversations}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={ItemSeparator}
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      ) : (
        <EmptyState
          icon="💬"
          title="Aucune conversation"
          description="Vos conversations avec les prestataires apparaîtront ici."
          actionLabel="Trouver un prestataire"
          onAction={() => router.push('/(tabs)/search')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
  },
  list: {
    paddingTop: Layout.spacing.sm,
    paddingBottom: 120,
  },
  separator: {
    height: 1,
    marginLeft: Layout.spacing.lg + 56 + Layout.spacing.md,
  },
});
