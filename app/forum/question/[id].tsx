/**
 * Détail d'une question du forum
 */

import { AnswerCard } from '@/components/forum';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useColors } from '@/hooks/useColors';
import {
  useAcceptAnswer,
  useCreateAnswer,
  useForumAnswers,
  useForumQuestion,
  useVoteAnswer,
  useVoteQuestion,
} from '@/hooks/useForum';
import { VoteType } from '@/types/forum';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Eye,
  MessageSquare,
  Send,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { userId } = useAuth();

  const { data: question, isLoading: questionLoading } = useForumQuestion(id);
  const { data: answers, isLoading: answersLoading } = useForumAnswers(id);
  const { mutate: voteQuestion } = useVoteQuestion();
  const { mutate: voteAnswer } = useVoteAnswer();
  const { mutate: acceptAnswer } = useAcceptAnswer();
  const { mutate: createAnswer, isPending: isCreating } = useCreateAnswer();

  const [newAnswer, setNewAnswer] = useState('');

  const isQuestionAuthor = question?.user_id === userId;

  const handleVoteQuestion = useCallback(
    (voteType: VoteType) => {
      if (!question) return;
      voteQuestion({
        questionId: question.id,
        voteType,
        currentVote: question.user_vote || null,
      });
    },
    [question, voteQuestion]
  );

  const handleVoteAnswer = useCallback(
    (answerId: string, voteType: VoteType, currentVote: VoteType | null) => {
      if (!id) return;
      voteAnswer({
        answerId,
        questionId: id,
        voteType,
        currentVote,
      });
    },
    [id, voteAnswer]
  );

  const handleAcceptAnswer = useCallback(
    (answerId: string) => {
      if (!id) return;
      acceptAnswer({ answerId, questionId: id });
    },
    [id, acceptAnswer]
  );

  const handleSubmitAnswer = useCallback(() => {
    if (!newAnswer.trim() || !id || isCreating) return;
    createAnswer(
      { question_id: id, content: newAnswer.trim() },
      { onSuccess: () => setNewAnswer('') }
    );
  }, [newAnswer, id, isCreating, createAnswer]);

  const canSubmit = newAnswer.trim().length > 0 && !isCreating;

  if (questionLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner fullScreen />
      </SafeAreaView>
    );
  }

  if (!question) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrFallback(router)} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Question</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
            Question introuvable
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = question.forum_categories?.color || colors.primary;
  const timeAgo = getTimeAgo(question.created_at);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => goBackOrFallback(router)} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Question</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Question */}
          <View style={[styles.questionCard, { backgroundColor: colors.card }]}>
            {/* Category & solved badge */}
            <View style={styles.badges}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                <Text style={[styles.categoryText, { color: categoryColor }]}>
                  {question.forum_categories?.name}
                </Text>
              </View>
              {question.is_solved && (
                <View style={styles.solvedBadge}>
                  <CheckCircle size={14} color={Colors.success.DEFAULT} />
                  <Text style={styles.solvedText}>Résolu</Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={[styles.questionTitle, { color: colors.text }]}>
              {question.title}
            </Text>

            {/* Content */}
            <Text style={[styles.questionContent, { color: colors.text }]}>
              {question.content}
            </Text>

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <View style={styles.tags}>
                {question.tags.map((tag) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: colors.backgroundTertiary }]}>
                    <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Author & meta */}
            <View style={[styles.questionMeta, { borderTopColor: colors.border }]}>
              <Avatar
                source={question.profiles?.avatar_url}
                name={question.profiles?.full_name || 'Anonyme'}
                size="sm"
              />
              <View style={styles.metaInfo}>
                <Text style={[styles.authorName, { color: colors.text }]}>
                  {question.profiles?.full_name}
                </Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {timeAgo}
                </Text>
              </View>

              <View style={styles.metaStats}>
                <View style={styles.stat}>
                  <Eye size={14} color={colors.textTertiary} />
                  <Text style={[styles.statText, { color: colors.textTertiary }]}>
                    {question.view_count}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <MessageSquare size={14} color={colors.textTertiary} />
                  <Text style={[styles.statText, { color: colors.textTertiary }]}>
                    {question.answer_count}
                  </Text>
                </View>
              </View>
            </View>

            {/* Vote buttons */}
            <View style={styles.voteRow}>
              <Pressable
                onPress={() => handleVoteQuestion('up')}
                style={[
                  styles.voteButton,
                  question.user_vote === 'up' && { backgroundColor: Colors.success.light },
                ]}
              >
                <ChevronUp
                  size={20}
                  color={question.user_vote === 'up' ? Colors.success.DEFAULT : colors.textSecondary}
                />
              </Pressable>
              <Text style={[styles.voteCount, { color: colors.text }]}>
                {question.upvote_count}
              </Text>
              <Pressable
                onPress={() => handleVoteQuestion('down')}
                style={[
                  styles.voteButton,
                  question.user_vote === 'down' && { backgroundColor: Colors.error.light },
                ]}
              >
                <ChevronDown
                  size={20}
                  color={question.user_vote === 'down' ? Colors.error.DEFAULT : colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          {/* Answers */}
          <Text style={[styles.answersTitle, { color: colors.text }]}>
            {answers?.length || 0} réponse{(answers?.length || 0) !== 1 ? 's' : ''}
          </Text>

          {answersLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            answers?.map((answer) => (
              <AnswerCard
                key={answer.id}
                answer={answer}
                isQuestionAuthor={isQuestionAuthor}
                onVote={(voteType) =>
                  handleVoteAnswer(answer.id, voteType, answer.user_vote || null)
                }
                onAccept={() => handleAcceptAnswer(answer.id)}
              />
            ))
          )}
        </ScrollView>

        {/* Answer input */}
        <View style={[styles.answerInput, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
            placeholder="Écrire une réponse..."
            placeholderTextColor={colors.textTertiary}
            value={newAnswer}
            onChangeText={setNewAnswer}
            multiline
            maxLength={5000}
          />
          <Pressable
            onPress={handleSubmitAnswer}
            disabled={!canSubmit}
            style={[
              styles.sendButton,
              { backgroundColor: canSubmit ? colors.primary : colors.backgroundTertiary },
            ]}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Send size={20} color={canSubmit ? Colors.white : colors.textTertiary} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Layout.spacing.md,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
  },
  questionCard: {
    marginHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.radius.sm,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  solvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success.light,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.radius.sm,
  },
  solvedText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success.DEFAULT,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: Layout.spacing.md,
  },
  questionContent: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: Layout.spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Layout.spacing.md,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    gap: Layout.spacing.sm,
  },
  metaInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
  },
  metaText: {
    fontSize: 12,
  },
  metaStats: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Layout.spacing.md,
    gap: Layout.spacing.md,
  },
  voteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteCount: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  answerInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Layout.spacing.md,
    borderTopWidth: 1,
    gap: Layout.spacing.sm,
  },
  input: {
    flex: 1,
    borderRadius: Layout.radius.lg,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    fontSize: 15,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
