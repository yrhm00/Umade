/**
 * Pills de réactions groupées sous un message
 */

import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface ReactionGroup {
  emoji: string;
  count: number;
  userIds: string[];
  messageIds: string[];
}

interface MessageReactionsProps {
  reactions: ReactionGroup[];
  currentUserId?: string;
  onReactionPress?: (emoji: string) => void;
}

export function MessageReactions({
  reactions,
  currentUserId,
  onReactionPress,
}: MessageReactionsProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();

  if (!reactions || reactions.length === 0) return null;

  return (
    <View style={styles.container}>
      {reactions.map((reaction) => {
        const isActive = !!currentUserId && reaction.userIds.includes(currentUserId);

        return (
          <Pressable
            key={reaction.emoji}
            onPress={() => onReactionPress?.(reaction.emoji)}
            style={({ pressed }) => [
              styles.pill,
              {
                borderColor: isActive ? colors.primary : colors.border,
                backgroundColor: isActive
                  ? isDark
                    ? `${colors.primary}2A`
                    : `${colors.primary}14`
                  : isDark
                  ? colors.backgroundSecondary
                  : colors.backgroundSecondary,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Text style={styles.emoji}>{reaction.emoji}</Text>
            <Text
              style={[
                styles.count,
                { color: isActive ? colors.primary : colors.textSecondary },
              ]}
            >
              {reaction.count}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.xs,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Layout.radius.full,
    borderWidth: 1,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
  },
  emoji: {
    fontSize: 13,
    lineHeight: 15,
  },
  count: {
    fontSize: 12,
    fontWeight: '700',
  },
});
