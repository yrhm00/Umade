/**
 * Message Bubble Component
 * Dark Mode Support
 * Supports: text, inspiration, booking status, images, reactions, payment notifications
 */

import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { MessageWithSender } from '@/types';
import { Check, CheckCheck } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BookingStatusUpdateMessageCard,
  parseBookingStatusUpdateMessage,
} from './BookingStatusUpdateMessageCard';
import { ChatImageMessage, parseChatImage } from './ChatImageMessage';
import { InspirationContextCard, parseInspirationContext } from './InspirationContextCard';
import { MessageReactions, type ReactionGroup } from './MessageReactions';
import {
  PaymentNotificationCard,
  parsePaymentNotification,
} from './PaymentNotificationCard';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  onLongPress?: (message: MessageWithSender) => void;
  reactions?: ReactionGroup[];
  onReactionPress?: (emoji: string, targetMessageId: string) => void;
  currentUserId?: string;
}

function isReactionMessage(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return parsed?.type === 'message_reaction';
  } catch {
    return false;
  }
}

export const MessageBubble = React.memo(function MessageBubble({
  message,
  isOwn,
  onLongPress,
  reactions,
  onReactionPress,
  currentUserId,
}: MessageBubbleProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();

  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString('fr-BE', {
      hour: '2-digit',
      minute: '2-digit',
    })
    : '';

  // Check structured message types (order matters)
  const chatImage = !message.deleted_for_all
    ? parseChatImage(message.content)
    : null;
  const inspirationContext = !message.deleted_for_all
    ? parseInspirationContext(message.content)
    : null;
  const bookingStatusUpdate = !message.deleted_for_all
    ? parseBookingStatusUpdateMessage(message.content)
    : null;
  const paymentNotification = !message.deleted_for_all
    ? parsePaymentNotification(message.content)
    : null;

  if (!message.deleted_for_all && isReactionMessage(message.content)) {
    return null;
  }

  // Dynamic bubble styles
  const bubbleOtherBg = isDark ? colors.card : '#F3F4F6';
  const bubbleDeletedBg = isDark ? colors.card : '#F3F4F6';
  const metaColor = message.deleted_for_all
    ? colors.textTertiary
    : isOwn
    ? 'rgba(255,255,255,0.7)'
    : colors.textTertiary;

  // Reactions component (shared across all message types)
  const reactionsView = reactions && reactions.length > 0 ? (
    <MessageReactions
      reactions={reactions}
      onReactionPress={onReactionPress ? (emoji) => onReactionPress(emoji, message.id) : undefined}
      currentUserId={currentUserId}
    />
  ) : null;

  // Chat image message
  if (chatImage) {
    return (
      <Pressable
        onLongPress={onLongPress ? () => onLongPress(message) : undefined}
        delayLongPress={280}
      >
        <ChatImageMessage data={chatImage} message={message} isOwn={isOwn} />
        {reactionsView}
      </Pressable>
    );
  }

  if (bookingStatusUpdate) {
    return (
      <Pressable
        style={[styles.container, isOwn && styles.containerOwn]}
        onLongPress={onLongPress ? () => onLongPress(message) : undefined}
        delayLongPress={280}
      >
        <View style={[styles.richContent, isOwn && styles.richContentOwn]}>
          <BookingStatusUpdateMessageCard data={bookingStatusUpdate} isOwn={isOwn} />
          <View style={[styles.metaFloating, isOwn && styles.metaFloatingOwn]}>
            <Text style={[styles.timeFloating, { color: colors.textTertiary }]}>{time}</Text>
            {isOwn &&
              (message.read_at ? (
                <CheckCheck size={12} color={colors.textTertiary} />
              ) : (
                <Check size={12} color={colors.textTertiary} />
              ))}
          </View>
          {reactionsView}
        </View>
      </Pressable>
    );
  }

  if (paymentNotification) {
    return (
      <Pressable
        style={[styles.container, isOwn && styles.containerOwn]}
        onLongPress={onLongPress ? () => onLongPress(message) : undefined}
        delayLongPress={280}
      >
        <View style={[styles.richContent, isOwn && styles.richContentOwn]}>
          <PaymentNotificationCard data={paymentNotification} isOwn={isOwn} />
          <View style={[styles.metaFloating, isOwn && styles.metaFloatingOwn]}>
            <Text style={[styles.timeFloating, { color: colors.textTertiary }]}>{time}</Text>
            {isOwn &&
              (message.read_at ? (
                <CheckCheck size={12} color={colors.textTertiary} />
              ) : (
                <Check size={12} color={colors.textTertiary} />
              ))}
          </View>
          {reactionsView}
        </View>
      </Pressable>
    );
  }

  if (inspirationContext) {
    return (
      <Pressable
        style={[styles.container, isOwn && styles.containerOwn]}
        onLongPress={onLongPress ? () => onLongPress(message) : undefined}
        delayLongPress={280}
      >
        <View style={[styles.richContent, isOwn && styles.richContentOwn]}>
          <InspirationContextCard data={inspirationContext} isOwn={isOwn} />
          <View style={[styles.metaFloating, isOwn && styles.metaFloatingOwn]}>
            <Text style={[styles.timeFloating, { color: colors.textTertiary }]}>{time}</Text>
            {isOwn &&
              (message.read_at ? (
                <CheckCheck size={12} color={colors.textTertiary} />
              ) : (
                <Check size={12} color={colors.textTertiary} />
              ))}
          </View>
          {reactionsView}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.container, isOwn && styles.containerOwn]}
      onLongPress={onLongPress ? () => onLongPress(message) : undefined}
      delayLongPress={280}
    >
      <View>
        <View
          style={[
            styles.bubble,
            message.deleted_for_all
              ? [styles.bubbleOther, { backgroundColor: bubbleDeletedBg }]
              : undefined,
            isOwn
              ? [styles.bubbleOwn, { backgroundColor: colors.primary }]
              : [styles.bubbleOther, { backgroundColor: bubbleOtherBg }],
            message.deleted_for_all && [styles.bubbleOther, { backgroundColor: bubbleDeletedBg }],
          ]}
        >
          <Text
            style={[
              styles.content,
              {
                color: message.deleted_for_all
                  ? colors.textTertiary
                  : isOwn
                  ? Colors.white
                  : colors.text,
              },
              message.deleted_for_all && styles.deletedText,
            ]}
          >
            {message.deleted_for_all ? 'Message supprime' : message.content}
          </Text>

          <View style={styles.meta}>
            <Text
              style={[
                styles.time,
                { color: metaColor },
              ]}
            >
              {time}
            </Text>
            {isOwn &&
              (message.read_at ? (
                <CheckCheck size={14} color={metaColor} />
              ) : (
                <Check size={14} color={metaColor} />
              ))}
          </View>
        </View>
        {reactionsView}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.md,
  },
  containerOwn: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
  },
  bubbleOwn: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
  },
  content: {
    fontSize: Layout.fontSize.md,
    lineHeight: 22,
  },
  deletedText: {
    fontStyle: 'italic',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Layout.spacing.xs,
    gap: Layout.spacing.xs,
  },
  time: {
    fontSize: 11,
  },
  metaFloating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaFloatingOwn: {
    justifyContent: 'flex-end',
  },
  timeFloating: {
    fontSize: 11,
  },
  richContent: {
    width: Math.min(Layout.window.width * 0.72, 300),
  },
  richContentOwn: {
    alignItems: 'flex-end',
  },
});
