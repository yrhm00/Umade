/**
 * Chat Screen
 * Dark Mode Support
 */

import { BookingActionCarousel } from '@/components/chat/BookingActionCarousel';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatInput } from '@/components/chat/ChatInput';
import { DateSeparator } from '@/components/chat/DateSeparator';
import { EmptyChat } from '@/components/chat/EmptyChat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import type { ReactionGroup } from '@/components/chat/MessageReactions';
import { ReactionPicker } from '@/components/chat/ReactionPicker';
import {
  ElegantCelebrationOverlay,
  type ElegantCelebrationOverlayRef,
} from '@/components/celebrations';
import { Skeleton } from '@/components/ui/Skeleton';
import { LongPressMenu, type LongPressMenuItem, useLongPressMenu } from '@/components/ui/LongPressMenu';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useChatBooking } from '@/hooks/useChatBooking';
import { useColors } from '@/hooks/useColors';
import { useConversation } from '@/hooks/useConversations';
import {
  useDeleteMessageForEveryone,
  useDeleteMessageForMe,
  useMarkAsRead,
  useMessages,
  useSendMessage,
} from '@/hooks/useMessages';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { MessageWithSender } from '@/types';
import { InspirationContextData } from '@/components/chat/InspirationContextCard';
import { toast } from '@/lib/toast';
import { useLocalSearchParams } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

interface ReactionPayload {
  type: 'message_reaction';
  target_message_id: string;
  emoji: string;
  action?: 'add' | 'remove';
}

function parseReactionPayload(content: string): ReactionPayload | null {
  try {
    const parsed = JSON.parse(content);
    if (
      parsed?.type === 'message_reaction' &&
      typeof parsed?.target_message_id === 'string' &&
      parsed.target_message_id.length > 0 &&
      typeof parsed?.emoji === 'string' &&
      parsed.emoji.length > 0
    ) {
      return {
        type: 'message_reaction',
        target_message_id: parsed.target_message_id,
        emoji: parsed.emoji,
        action: parsed.action === 'remove' ? 'remove' : 'add',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function ChatScreen() {
  const { conversationId, pendingInspiration: pendingInspirationParam } = useLocalSearchParams<{
    conversationId: string;
    pendingInspiration?: string;
  }>();
  const { userId } = useAuth();
  const colors = useColors();
  const flatListRef = useRef<FlatList>(null);
  const celebrationRef = useRef<ElegantCelebrationOverlayRef>(null);
  const {
    visible: isMessageActionsMenuVisible,
    open: openMessageActionsMenu,
    close: hideMessageActionsMenu,
  } = useLongPressMenu();

  // Parse pending inspiration from navigation params
  const [pendingInspiration, setPendingInspiration] = useState<InspirationContextData | null>(() => {
    if (pendingInspirationParam) {
      try {
        return JSON.parse(pendingInspirationParam) as InspirationContextData;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [selectedMessage, setSelectedMessage] = useState<MessageWithSender | null>(null);
  const [reactionTargetMessage, setReactionTargetMessage] = useState<MessageWithSender | null>(null);
  const [isReactionPickerVisible, setIsReactionPickerVisible] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useMessages(conversationId);

  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: deleteMessageForEveryone, isPending: isDeletingForEveryone } = useDeleteMessageForEveryone();
  const { mutate: deleteMessageForMe, isPending: isDeletingForMe } = useDeleteMessageForMe();
  const { mutate: markAsRead } = useMarkAsRead();

  // Real-time subscription
  useRealtimeMessages(conversationId);

  // Conversation and booking data
  const { data: conversation } = useConversation(conversationId);
  const isProvider = useMemo(() => {
    if (!conversation || !userId) {
      return false;
    }

    // provider_id dans conversations = providers.id (pas profiles.id)
    if (conversation.provider?.user_id) {
      return conversation.provider.user_id === userId;
    }

    // Fallback: si je ne suis pas le client, je suis côté prestataire.
    return conversation.client_id !== userId;
  }, [conversation, userId]);
  const { bookings, updateStatus, isUpdating } = useChatBooking(conversationId);
  const actionableBookings = useMemo(
    () =>
      bookings.filter(
        (b) => b.status === 'pending' || b.status === 'confirmed'
      ),
    [bookings]
  );
  const shouldShowPinnedBookingCard = actionableBookings.length > 0;
  const handleUpdateBookingStatus = useCallback(
    async (bookingId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
      await updateStatus({ bookingId, status });

      if (status === 'confirmed') {
        celebrationRef.current?.fire();
      }
    },
    [updateStatus]
  );

  // Mark messages as read on mount and when conversationId changes
  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [conversationId, markAsRead]);

  // Flatten infinite query pages
  const messages = useMemo(() => {
    return data?.pages.flat() ?? [];
  }, [data]);

  const { displayMessages, reactionsByMessageId } = useMemo(() => {
    const grouped = new Map<string, ReactionGroup[]>();
    const visible = messages.filter((message) => !parseReactionPayload(message.content));

    const reactionEvents = messages
      .map((message) => ({
        message,
        payload: !message.deleted_for_all ? parseReactionPayload(message.content) : null,
      }))
      .filter((item): item is { message: MessageWithSender; payload: ReactionPayload } => !!item.payload)
      .sort((a, b) => {
        const left = a.message.created_at ? new Date(a.message.created_at).getTime() : 0;
        const right = b.message.created_at ? new Date(b.message.created_at).getTime() : 0;
        return left - right;
      });

    const state = new Map<string, Map<string, Map<string, string>>>();

    for (const event of reactionEvents) {
      const payload = event.payload;

      if (!state.has(payload.target_message_id)) {
        state.set(payload.target_message_id, new Map());
      }
      const byTarget = state.get(payload.target_message_id)!;

      if (!byTarget.has(payload.emoji)) {
        byTarget.set(payload.emoji, new Map());
      }
      const byEmoji = byTarget.get(payload.emoji)!;

      if (payload.action === 'remove') {
        byEmoji.delete(event.message.sender_id);
      } else {
        byEmoji.set(event.message.sender_id, event.message.id);
      }
    }

    state.forEach((emojiMap, targetId) => {
      const groups: ReactionGroup[] = [];

      emojiMap.forEach((userMap, emoji) => {
        if (userMap.size === 0) return;
        groups.push({
          emoji,
          count: userMap.size,
          userIds: Array.from(userMap.keys()),
          messageIds: Array.from(userMap.values()),
        });
      });

      groups.sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
      if (groups.length > 0) {
        grouped.set(targetId, groups);
      }
    });

    return {
      displayMessages: visible,
      reactionsByMessageId: grouped,
    };
  }, [messages]);

  const handleSend = useCallback(
    (content: string) => {
      if (!conversationId) return;
      sendMessage(
        { conversation_id: conversationId, content },
        { onError: (err) => toast.error(err.message || 'Message non envoyé') }
      );
    },
    [conversationId, sendMessage]
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleMessageLongPress = useCallback(
    (message: MessageWithSender) => {
      if (!conversationId || !userId) return;
      if (message.id.startsWith('temp-')) return;
      if (isDeletingForEveryone || isDeletingForMe) return;

      const parsedReaction = parseReactionPayload(message.content);
      if (parsedReaction) return;

      setSelectedMessage(message);
      setReactionTargetMessage(message);
      setIsReactionPickerVisible(true);
    },
    [
      conversationId,
      isDeletingForEveryone,
      isDeletingForMe,
      userId,
    ]
  );

  const closeMessageActionsMenu = useCallback(() => {
    hideMessageActionsMenu();
    setSelectedMessage(null);
  }, [hideMessageActionsMenu]);

  const closeReactionPicker = useCallback(() => {
    setIsReactionPickerVisible(false);
    setReactionTargetMessage(null);
    setSelectedMessage(null);
  }, []);

  const messageActionItems = useMemo<LongPressMenuItem[]>(() => {
    if (!selectedMessage || !conversationId || !userId) {
      return [];
    }

    const isOwnMessage = selectedMessage.sender_id === userId;
    const isDeletedForAll = !!selectedMessage.deleted_for_all;
    const disabled = isDeletingForEveryone || isDeletingForMe;

    const deleteForMeAction: LongPressMenuItem = {
      id: 'delete-for-me',
      label: 'Supprimer pour moi',
      icon: Trash2,
      destructive: true,
      disabled,
      onPress: () => {
        deleteMessageForMe({
          conversationId,
          messageId: selectedMessage.id,
        });
      },
    };

    if (!isOwnMessage || isDeletedForAll) {
      return [deleteForMeAction];
    }

    return [
      deleteForMeAction,
      {
        id: 'delete-for-everyone',
        label: 'Supprimer pour tout le monde',
        icon: Trash2,
        destructive: true,
        disabled,
        onPress: () => {
          deleteMessageForEveryone({
            conversationId,
            messageId: selectedMessage.id,
          });
        },
      },
    ];
  }, [
    conversationId,
    deleteMessageForEveryone,
    deleteMessageForMe,
    isDeletingForEveryone,
    isDeletingForMe,
    selectedMessage,
    userId,
  ]);

  const handleReaction = useCallback(
    (emoji: string, targetMessageId: string) => {
      if (!conversationId || !userId) return;

      const existingGroup = reactionsByMessageId.get(targetMessageId)?.find(
        (reaction) => reaction.emoji === emoji
      );
      const hasReacted = !!existingGroup && existingGroup.userIds.includes(userId);

      const reactionMessage = JSON.stringify({
        type: 'message_reaction',
        target_message_id: targetMessageId,
        emoji,
        action: hasReacted ? 'remove' : 'add',
      });

      sendMessage({
        conversation_id: conversationId,
        content: reactionMessage,
      });
    },
    [conversationId, reactionsByMessageId, sendMessage, userId]
  );

  const handleReactionSelect = useCallback(
    (emoji: string) => {
      if (!reactionTargetMessage) return;
      handleReaction(emoji, reactionTargetMessage.id);
    },
    [handleReaction, reactionTargetMessage]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: MessageWithSender; index: number }) => {
      const isOwn = item.sender_id === userId;

      // In an inverted list, index 0 is the newest message.
      // The "next" message chronologically (older) is at index + 1.
      const olderMessage = displayMessages[index + 1];
      const showDateSeparator =
        !olderMessage ||
        !isSameDay(
          new Date(item.created_at ?? ''),
          new Date(olderMessage.created_at ?? '')
        );

      return (
        <>
          <MessageBubble
            message={item}
            isOwn={isOwn}
            onLongPress={handleMessageLongPress}
            reactions={reactionsByMessageId.get(item.id)}
            onReactionPress={(emoji) => handleReaction(emoji, item.id)}
            currentUserId={userId ?? undefined}
          />
          {showDateSeparator && item.created_at && (
            <DateSeparator date={item.created_at} />
          )}
        </>
      );
    },
    [displayMessages, handleMessageLongPress, handleReaction, reactionsByMessageId, userId]
  );

  const keyExtractor = useCallback(
    (item: MessageWithSender) => item.id,
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
        <ChatHeader conversationId={conversationId ?? ''} />
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={[styles.skeletonBubble, i % 3 === 0 ? styles.skeletonRight : styles.skeletonLeft]}>
              <Skeleton width={i % 2 === 0 ? '70%' : '50%'} height={44} borderRadius={Layout.radius.lg} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ChatHeader conversationId={conversationId ?? ''} />

      {/* Booking Action Card (Pending Request) — swipeable when multiple */}
      {shouldShowPinnedBookingCard && (
        <View style={[styles.actionCardContainer, { backgroundColor: colors.background }]}>
          <BookingActionCarousel
            bookings={actionableBookings}
            isProvider={isProvider}
            onUpdateStatus={handleUpdateBookingStatus}
            isUpdating={isUpdating}
          />
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={displayMessages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          inverted
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          removeClippedSubviews={Platform.OS === 'android'}
          windowSize={11}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={<EmptyChat />}
          contentContainerStyle={
            displayMessages.length === 0 ? styles.emptyList : styles.listContent
          }
          showsVerticalScrollIndicator={false}
        />

        <ChatInput
          conversationId={conversationId ?? ''}
          onSend={handleSend}
          disabled={isSending}
          pendingInspiration={pendingInspiration}
          onClearInspiration={() => setPendingInspiration(null)}
          isProvider={isProvider}
        />
      </KeyboardAvoidingView>

      <ReactionPicker
        visible={isReactionPickerVisible}
        onClose={closeReactionPicker}
        onSelect={handleReactionSelect}
        onOpenMore={() => {
          setIsReactionPickerVisible(false);
          setReactionTargetMessage(null);
          if (selectedMessage) {
            openMessageActionsMenu();
          }
        }}
      />

      <LongPressMenu
        visible={isMessageActionsMenuVisible}
        onClose={closeMessageActionsMenu}
        items={messageActionItems}
        title="Actions du message"
      />

      <ElegantCelebrationOverlay ref={celebrationRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionCardContainer: {
    zIndex: 10,
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    paddingVertical: Layout.spacing.sm,
  },
  emptyList: {
    flexGrow: 1,
  },
  loadingMore: {
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    gap: Layout.spacing.md,
    justifyContent: 'flex-end',
  },
  skeletonBubble: {
    width: '100%',
  },
  skeletonLeft: {
    alignItems: 'flex-start',
  },
  skeletonRight: {
    alignItems: 'flex-end',
  },
});
