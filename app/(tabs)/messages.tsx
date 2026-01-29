import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useConversations } from '@/hooks/useConversations';
import { useRealtimeConversations } from '@/hooks/useRealtimeMessages';
import { ConversationCard } from '@/components/chat/ConversationCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConversationWithDetails } from '@/types';

export default function MessagesScreen() {
  const router = useRouter();
  const { data: conversations, isLoading, refetch, isRefetching } =
    useConversations();

  // Real-time subscription for new messages across all conversations
  useRealtimeConversations();

  const renderItem = useCallback(
    ({ item }: { item: ConversationWithDetails }) => (
      <ConversationCard conversation={item} />
    ),
    []
  );

  const keyExtractor = useCallback(
    (item: ConversationWithDetails) => item.id,
    []
  );

  const ItemSeparator = useCallback(
    () => <View style={styles.separator} />,
    []
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
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
    backgroundColor: Colors.background.primary,
  },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  },
  list: {
    paddingVertical: Layout.spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.gray[100],
    marginLeft: Layout.spacing.lg + 56 + Layout.spacing.md,
  },
});
