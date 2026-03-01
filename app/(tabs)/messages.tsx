import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useConversations, useHideConversation, usePinConversation } from '@/hooks/useConversations';
import { getChatMessageSearchableText } from '@/lib/chatMessagePreview';
import { useRealtimeConversations } from '@/hooks/useRealtimeMessages';
import { ConversationWithDetails } from '@/types';
import { useRouter } from 'expo-router';
import { MessageCircle, Search, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, {
        shadowColor: isDark ? '#000' : '#5F4A8B',
        shadowOpacity: isDark ? 0.3 : 0.08,
      }]}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
      </View>

      {/* Search Bar */}
      {conversations && conversations.length > 0 && (
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchInputWrapper,
              {
                backgroundColor: colors.backgroundTertiary,
              },
            ]}
          >
            <Search size={18} color={colors.textTertiary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Rechercher une conversation..."
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
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
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Layout.radius.lg,
    minHeight: 48,
    paddingHorizontal: Layout.spacing.md,
    gap: Layout.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
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
