/**
 * AnswerCard - Carte d'une réponse
 */

import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useColors } from '@/hooks/useColors';
import { ForumAnswerWithUser, VoteType } from '@/types/forum';
import { Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface AnswerCardProps {
  answer: ForumAnswerWithUser;
  isQuestionAuthor: boolean;
  onVote: (voteType: VoteType) => void;
  onAccept: () => void;
}

export function AnswerCard({
  answer,
  isQuestionAuthor,
  onVote,
  onAccept,
}: AnswerCardProps) {
  const colors = useColors();
  const { userId } = useAuth();

  const isOwnAnswer = answer.user_id === userId;
  const timeAgo = getTimeAgo(answer.created_at);

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.card },
      answer.is_accepted && styles.acceptedContainer,
    ]}>
      {/* Accepted badge */}
      {answer.is_accepted && (
        <View style={styles.acceptedBadge}>
          <Check size={14} color={Colors.white} />
          <Text style={styles.acceptedText}>Meilleure réponse</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Vote column */}
        <View style={styles.voteColumn}>
          <Pressable
            onPress={() => onVote('up')}
            style={[
              styles.voteButton,
              answer.user_vote === 'up' && { backgroundColor: Colors.success.light },
            ]}
          >
            <ChevronUp
              size={20}
              color={answer.user_vote === 'up' ? Colors.success.DEFAULT : colors.textSecondary}
            />
          </Pressable>

          <Text style={[
            styles.voteCount,
            { color: answer.upvote_count > 0 ? Colors.success.DEFAULT : colors.textSecondary }
          ]}>
            {answer.upvote_count}
          </Text>

          <Pressable
            onPress={() => onVote('down')}
            style={[
              styles.voteButton,
              answer.user_vote === 'down' && { backgroundColor: Colors.error.light },
            ]}
          >
            <ChevronDown
              size={20}
              color={answer.user_vote === 'down' ? Colors.error.DEFAULT : colors.textSecondary}
            />
          </Pressable>

          {/* Accept button for question author */}
          {isQuestionAuthor && !answer.is_accepted && !isOwnAnswer && (
            <Pressable
              onPress={onAccept}
              style={[styles.acceptButton, { borderColor: Colors.success.DEFAULT }]}
            >
              <Check size={18} color={Colors.success.DEFAULT} />
            </Pressable>
          )}
        </View>

        {/* Answer content */}
        <View style={styles.answerContent}>
          <Text style={[styles.answerText, { color: colors.text }]}>
            {answer.content}
          </Text>

          {/* Author info */}
          <View style={styles.authorRow}>
            <Avatar
              source={answer.profiles?.avatar_url}
              name={answer.profiles?.full_name || 'Anonyme'}
              size="xs"
            />
            <Text style={[styles.authorName, { color: colors.textSecondary }]}>
              {answer.profiles?.full_name}
            </Text>
            <Text style={[styles.timeText, { color: colors.textTertiary }]}>
              · {timeAgo}
            </Text>
            {answer.is_edited && (
              <Text style={[styles.editedText, { color: colors.textTertiary }]}>
                (modifié)
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
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
    marginHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
  },
  acceptedContainer: {
    borderWidth: 2,
    borderColor: Colors.success.DEFAULT,
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    backgroundColor: Colors.success.DEFAULT,
    paddingVertical: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.md,
  },
  acceptedText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flexDirection: 'row',
    padding: Layout.spacing.md,
  },
  voteColumn: {
    alignItems: 'center',
    marginRight: Layout.spacing.md,
    gap: 4,
  },
  voteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    marginTop: Layout.spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerContent: {
    flex: 1,
  },
  answerText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: Layout.spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
  },
  editedText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});
