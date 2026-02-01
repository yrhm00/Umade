import { Avatar } from '@/components/ui/Avatar';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { formatRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { ConversationWithDetails } from '@/types';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ConversationCardProps {
  conversation: ConversationWithDetails;
}

export const ConversationCard = React.memo(function ConversationCard({
  conversation,
}: ConversationCardProps) {
  const router = useRouter();
  const userId = useAuthStore((state) => state.user?.id);
  const colors = useColors();

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
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/chat/${conversation.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Avatar source={avatarUrl} name={displayName} size="lg" />
        {hasUnread && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
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
            style={[styles.name, { color: colors.text }, hasUnread && styles.nameBold]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          {lastMessage?.created_at && (
            <Text style={[styles.time, { color: colors.textTertiary }]}>
              {formatRelativeTime(lastMessage.created_at)}
            </Text>
          )}
        </View>

        <View style={styles.messageRow}>
          {lastMessage ? (
            <Text
              style={[
                styles.lastMessage,
                { color: colors.textSecondary },
                hasUnread && { color: colors.text, fontWeight: '500' }
              ]}
              numberOfLines={1}
            >
              {lastMessage.sender_id === userId && 'Vous: '}
              {lastMessage.content}
            </Text>
          ) : (
            <Text style={[styles.noMessage, { color: colors.textTertiary }]}>Nouvelle conversation</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
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
    marginRight: Layout.spacing.sm,
  },
  nameBold: {
    fontWeight: '600',
  },
  time: {
    fontSize: Layout.fontSize.xs,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: Layout.fontSize.sm,
  },
  noMessage: {
    fontSize: Layout.fontSize.sm,
    fontStyle: 'italic',
  },
});
