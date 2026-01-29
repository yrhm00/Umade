import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { ConversationWithDetails } from '@/types';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { formatRelativeTime } from '@/lib/utils';

interface ConversationCardProps {
  conversation: ConversationWithDetails;
}

export const ConversationCard = React.memo(function ConversationCard({
  conversation,
}: ConversationCardProps) {
  const router = useRouter();
  const userId = useAuthStore((state) => state.user?.id);

  const isClient = conversation.client_id === userId;
  const displayName = isClient
    ? conversation.provider?.business_name || 'Prestataire'
    : conversation.client?.full_name || 'Client';
  const avatarUrl = isClient
    ? undefined
    : conversation.client?.avatar_url ?? undefined;

  const lastMessage = conversation.last_message;
  const hasUnread = conversation.unread_count > 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/chat/${conversation.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Avatar source={avatarUrl} name={displayName} size="lg" />
        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {conversation.unread_count > 9
                ? '9+'
                : conversation.unread_count}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[styles.name, hasUnread && styles.nameBold]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          {lastMessage?.created_at && (
            <Text style={styles.time}>
              {formatRelativeTime(lastMessage.created_at)}
            </Text>
          )}
        </View>

        <View style={styles.messageRow}>
          {lastMessage ? (
            <Text
              style={[styles.lastMessage, hasUnread && styles.lastMessageBold]}
              numberOfLines={1}
            >
              {lastMessage.sender_id === userId && 'Vous: '}
              {lastMessage.content}
            </Text>
          ) : (
            <Text style={styles.noMessage}>Nouvelle conversation</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.white,
    gap: Layout.spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadCount: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  name: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    color: Colors.text.primary,
    marginRight: Layout.spacing.sm,
  },
  nameBold: {
    fontWeight: '600',
  },
  time: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.tertiary,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
  },
  lastMessageBold: {
    color: Colors.text.primary,
    fontWeight: '500',
  },
  noMessage: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
});
