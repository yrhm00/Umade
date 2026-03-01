/**
 * CommentSection - Section commentaires d'un post
 */

import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useColors } from '@/hooks/useColors';
import { useCreateComment, useSocialPostComments } from '@/hooks/useSocialFeed';
import { CommentWithUser } from '@/types/social';
import { Send } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const colors = useColors();
  const { userId, profile } = useAuth();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useSocialPostComments(postId);
  const comments = data?.pages.flat() ?? [];
  const { mutate: createComment, isPending } = useCreateComment();
  const [newComment, setNewComment] = useState('');

  const handleSubmit = useCallback(() => {
    if (!newComment.trim() || isPending) return;

    createComment(
      {
        post_id: postId,
        content: newComment.trim(),
      },
      {
        onSuccess: () => {
          setNewComment('');
        },
      }
    );
  }, [newComment, postId, createComment, isPending]);

  const renderComment = useCallback(
    ({ item }: { item: CommentWithUser }) => (
      <CommentItem comment={item} />
    ),
    []
  );

  const canSubmit = newComment.trim().length > 0 && !isPending;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Comments list */}
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Aucun commentaire. Soyez le premier !
            </Text>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Avatar
          source={profile?.avatar_url}
          name={profile?.full_name || 'Moi'}
          size="sm"
        />
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundTertiary }]}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Ajouter un commentaire..."
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={500}
        />
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[
            styles.sendButton,
            { backgroundColor: canSubmit ? colors.primary : colors.backgroundTertiary },
          ]}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Send size={18} color={canSubmit ? Colors.white : colors.textTertiary} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function CommentItem({ comment }: { comment: CommentWithUser }) {
  const colors = useColors();
  const timeAgo = getTimeAgo(comment.created_at);

  return (
    <View style={styles.commentContainer}>
      <Avatar
        source={comment.profiles?.avatar_url}
        name={comment.profiles?.full_name || 'Utilisateur'}
        size="sm"
      />
      <View style={styles.commentContent}>
        <View style={styles.commentBubble}>
          <Text style={[styles.commentUserName, { color: colors.text }]}>
            {comment.profiles?.full_name}
          </Text>
          <Text style={[styles.commentText, { color: colors.text }]}>
            {comment.content}
          </Text>
        </View>
        <Text style={[styles.commentTime, { color: colors.textTertiary }]}>
          {timeAgo}
        </Text>
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
    flex: 1,
  },
  list: {
    padding: Layout.spacing.md,
    flexGrow: 1,
  },
  loading: {
    padding: Layout.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    padding: Layout.spacing.xl,
    fontSize: 14,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    marginBottom: 4,
  },
  commentUserName: {
    fontWeight: '600',
    fontSize: 13,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 11,
  },
  inputContainer: {
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
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
