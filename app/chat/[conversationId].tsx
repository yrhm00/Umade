import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatInput } from '@/components/chat/ChatInput';
import { DateSeparator } from '@/components/chat/DateSeparator';
import { EmptyChat } from '@/components/chat/EmptyChat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useMarkAsRead, useMessages, useSendMessage } from '@/hooks/useMessages';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { MessageWithSender } from '@/types';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
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

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{
    conversationId: string;
  }>();
  const { userId } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useMessages(conversationId);

  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: markAsRead } = useMarkAsRead();

  // Real-time subscription
  useRealtimeMessages(conversationId);

  // New hooks moved to top level
  const { data: conversation } = useConversation(conversationId);
  const isProvider = conversation?.provider_id === userId;
  const { booking, updateStatus, isUpdating } = useChatBooking(conversationId);

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

  const handleSend = useCallback(
    (content: string) => {
      if (!conversationId) return;
      sendMessage({
        conversation_id: conversationId,
        content,
      });
    },
    [conversationId, sendMessage]
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item, index }: { item: MessageWithSender; index: number }) => {
      const isOwn = item.sender_id === userId;

      // In an inverted list, index 0 is the newest message.
      // The "next" message chronologically (older) is at index + 1.
      const olderMessage = messages[index + 1];
      const showDateSeparator =
        !olderMessage ||
        !isSameDay(
          new Date(item.created_at ?? ''),
          new Date(olderMessage.created_at ?? '')
        );

      return (
        <>
          <MessageBubble message={item} isOwn={isOwn} />
          {showDateSeparator && item.created_at && (
            <DateSeparator date={item.created_at} />
          )}
        </>
      );
    },
    [userId, messages]
  );

  const keyExtractor = useCallback(
    (item: MessageWithSender) => item.id,
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ChatHeader conversationId={conversationId ?? ''} />
        <LoadingSpinner fullScreen message="Chargement..." />
      </SafeAreaView>
    );
  }

  // ... (existing helper functions)

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ChatHeader conversationId={conversationId ?? ''} />

      {/* Booking Action Card (Pending Request) */}
      {booking && (
        <View style={styles.actionCardContainer}>
          <BookingActionCard
            booking={booking}
            isProvider={isProvider}
            onUpdateStatus={async (bookingId, status) => { await updateStatus({ bookingId, status }); }}
            isUpdating={isUpdating}
          />
        </View>
      )}

      <KeyboardAvoidingView
        // ...
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          inverted
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={<EmptyChat />}
          contentContainerStyle={
            messages.length === 0 ? styles.emptyList : styles.listContent
          }
          showsVerticalScrollIndicator={false}
        />

        <ChatInput
          conversationId={conversationId ?? ''}
          onSend={handleSend}
          disabled={isSending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import { BookingActionCard } from '@/components/chat/BookingActionCard';
import { useChatBooking } from '@/hooks/useChatBooking';
import { useConversation } from '@/hooks/useConversations';

// ... existing code ...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  actionCardContainer: {
    zIndex: 10,
    backgroundColor: Colors.background.primary,
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
});
