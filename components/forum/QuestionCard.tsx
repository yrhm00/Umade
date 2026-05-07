/**
 * QuestionCard - Carte d'une question du forum
 */

import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { ForumQuestionWithDetails } from '@/types/forum';
import { router } from 'expo-router';
import {
  CheckCircle,
  ChevronUp,
  MessageSquare,
  Eye,
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface QuestionCardProps {
  question: ForumQuestionWithDetails;
  index?: number;
}

export function QuestionCard({ question, index = 0 }: QuestionCardProps) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    router.push(`/forum/question/${question.id}` as any);
  }, [question.id]);

  const timeAgo = getTimeAgo(question.created_at);
  const categoryColor = question.forum_categories?.color || colors.primary;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(260)}>
      <Pressable
        onPress={handlePress}
        style={[styles.container, { backgroundColor: colors.card }]}
      >
        {/* Vote column */}
        <View style={styles.voteColumn}>
          <View style={[
            styles.voteBox,
            { backgroundColor: question.upvote_count > 0 ? Colors.success.light : colors.backgroundTertiary }
          ]}>
            <ChevronUp
              size={16}
              color={question.upvote_count > 0 ? Colors.success.DEFAULT : colors.textSecondary}
            />
            <Text style={[
              styles.voteCount,
              { color: question.upvote_count > 0 ? Colors.success.DEFAULT : colors.textSecondary }
            ]}>
              {question.upvote_count}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Category badge */}
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {question.forum_categories?.name}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {question.title}
          </Text>

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <View style={styles.tags}>
              {question.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.backgroundTertiary }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Meta */}
          <View style={styles.meta}>
            <Avatar
              source={question.profiles?.avatar_url}
              name={question.profiles?.full_name || 'Anonyme'}
              size="xs"
            />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {question.profiles?.full_name} · {timeAgo}
            </Text>

            <View style={styles.metaRight}>
              {question.is_solved && (
                <View style={styles.solvedBadge}>
                  <CheckCircle size={14} color={Colors.success.DEFAULT} />
                </View>
              )}
              <View style={styles.stat}>
                <MessageSquare size={14} color={colors.textTertiary} />
                <Text style={[styles.statText, { color: colors.textTertiary }]}>
                  {question.answer_count}
                </Text>
              </View>
              <View style={styles.stat}>
                <Eye size={14} color={colors.textTertiary} />
                <Text style={[styles.statText, { color: colors.textTertiary }]}>
                  {question.view_count}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: Layout.spacing.md,
    marginHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
    borderRadius: Layout.radius.lg,
  },
  voteColumn: {
    marginRight: Layout.spacing.md,
  },
  voteBox: {
    alignItems: 'center',
    padding: Layout.spacing.xs,
    borderRadius: Layout.radius.md,
    minWidth: 40,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.radius.sm,
    marginBottom: Layout.spacing.xs,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: Layout.spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: Layout.spacing.sm,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  metaText: {
    fontSize: 12,
    flex: 1,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  solvedBadge: {
    marginRight: Layout.spacing.xs,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: 12,
  },
});
