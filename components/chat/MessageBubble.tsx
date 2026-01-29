import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, CheckCheck } from 'lucide-react-native';
import { MessageWithSender } from '@/types';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
}

export const MessageBubble = React.memo(function MessageBubble({
  message,
  isOwn,
}: MessageBubbleProps) {
  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString('fr-BE', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <View style={[styles.container, isOwn && styles.containerOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.content, isOwn && styles.contentOwn]}>
          {message.content}
        </Text>

        <View style={styles.meta}>
          <Text style={[styles.time, isOwn && styles.timeOwn]}>{time}</Text>
          {isOwn &&
            (message.read_at ? (
              <CheckCheck size={14} color={Colors.primary[200]} />
            ) : (
              <Check size={14} color={Colors.primary[200]} />
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
    backgroundColor: Colors.primary.DEFAULT,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.gray[100],
    borderBottomLeftRadius: 4,
  },
  content: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  contentOwn: {
    color: Colors.white,
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
    color: Colors.text.tertiary,
  },
  timeOwn: {
    color: Colors.primary[200],
  },
});
