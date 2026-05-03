import { EmptyState } from '@/components/common/EmptyState';
import { ClientHeader } from '@/components/client/ClientHeader';
import { ClientSearchField } from '@/components/client/ClientSearchField';
import { Skeleton } from '@/components/ui/Skeleton';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useConversations, useHideConversation, usePinConversation } from '@/hooks/useConversations';
import { getChatMessageSearchableText } from '@/lib/chatMessagePreview';
import { useRealtimeConversations } from '@/hooks/useRealtimeMessages';
import { ConversationWithDetails } from '@/types';
import { useRouter } from 'expo-router';
import { MessageCircle, Search } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SwipeableConversationItem } from '@/components/chat/SwipeableConversationItem';

export default function MessagesScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: conversations, isLoading, refetch, isRefetching } =
    useConversations();

  const { mutate: pinConversation } = usePinConversation();
  const { mutate: hideConversation } = useHideConversation();

  // Real-time subscription for new messages across all conversations
  useRealtimeConversations();

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase().trim();
    return conversations.filter((conv) => {
      const providerName = (conv.provider as any)?.business_name?.toLowerCase() || '';
      const clientName = (conv.client as any)?.full_name?.toLowerCase() || '';
      const lastMsg = getChatMessageSearchableText((conv.last_message as any)?.content).toLowerCase();
      return providerName.includes(query) || clientName.includes(query) || lastMsg.includes(query);
    });
  }, [conversations, searchQuery]);

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

  const conversationCount = conversations?.length ?? 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ClientHeader
        eyebrow="Inbox"
        title="Messages"
        subtitle={
          conversationCount > 0
            ? `${conversationCount} conversation${conversationCount > 1 ? 's' : ''} avec tes prestataires.`
            : 'Tes échanges avec les prestataires arriveront ici.'
        }
        colors={colors}
        isDark={isDark}
        actionIcon={Search}
        actionLabel="Trouver un prestataire"
        onAction={() => router.push('/(tabs)/search')}
      />

      {/* Search Bar */}
      {conversations && conversations.length > 0 && (
        <View style={styles.searchContainer}>
          <ClientSearchField
            colors={colors}
            isDark={isDark}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Rechercher une conversation"
          />
        </View>
      )}

      {isLoading ? (
        <View style={styles.skeletonList}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton.ConversationItem key={`skel-${i}`} />
          ))}
        </View>
      ) : filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={ItemSeparator}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      ) : searchQuery.trim() ? (
        <EmptyState
          icon={<Search size={32} color={colors.primary} />}
          title="Aucun résultat"
          description={`Aucune conversation ne correspond à "${searchQuery}".`}
          actionLabel="Effacer la recherche"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <EmptyState
          icon={<MessageCircle size={32} color={colors.primary} />}
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
  searchContainer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  list: {
    paddingTop: Layout.spacing.sm,
    paddingBottom: 120,
  },
  skeletonList: {
    paddingTop: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
  },
  separator: {
    height: 1,
    marginLeft: Layout.spacing.lg + 56 + Layout.spacing.md,
  },
});
