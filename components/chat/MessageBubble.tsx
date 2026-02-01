/**
 * Message Bubble Component
 * Dark Mode Support
 */

import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { MessageWithSender } from '@/types';
import { Check, CheckCheck } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InspirationContextCard, parseInspirationContext } from './InspirationContextCard';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
}

export const MessageBubble = React.memo(function MessageBubble({
  message,
  isOwn,
}: MessageBubbleProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();

  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString('fr-BE', {
      hour: '2-digit',
      minute: '2-digit',
    })
    : '';

  // Check if this is an inspiration context message
  const inspirationContext = parseInspirationContext(message.content);

  // Dynamic bubble styles
  const bubbleOtherBg = isDark ? colors.card : '#F3F4F6';

  if (inspirationContext) {
    return (
      <View style={[styles.container, isOwn && styles.containerOwn]}>
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
      </View>
    );
  }

  return (
    <View style={[styles.container, isOwn && styles.containerOwn]}>
      <View
        style={[
          styles.bubble,
          isOwn
            ? [styles.bubbleOwn, { backgroundColor: colors.primary }]
            : [styles.bubbleOther, { backgroundColor: bubbleOtherBg }],
        ]}
      >
        <Text
          style={[
            styles.content,
            { color: isOwn ? Colors.white : colors.text },
          ]}
        >
          {message.content}
        </Text>

        <View style={styles.meta}>
          <Text
            style={[
              styles.time,
              { color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textTertiary },
            ]}
          >
            {time}
          </Text>
          {isOwn &&
            (message.read_at ? (
              <CheckCheck size={14} color="rgba(255,255,255,0.7)" />
            ) : (
              <Check size={14} color="rgba(255,255,255,0.7)" />
            ))}
        </View>
      </View>
    </View>
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
    marginTop: 4,
    paddingHorizontal: Layout.spacing.md,
  },
  metaFloatingOwn: {
    justifyContent: 'flex-end',
  },
  timeFloating: {
    fontSize: 11,
  },
});
