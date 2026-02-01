/**
 * Review Card Component
 * Dark Mode Support
 */

import { RatingStars } from '@/components/common/RatingStars';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useAddProviderResponse, useDeleteReview } from '@/hooks/useReviews';
import { formatRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { ReviewWithDetails } from '@/types';
import { MessageSquare, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ReviewCardProps {
  review: ReviewWithDetails;
  showProviderActions?: boolean;
}

export const ReviewCard = React.memo(function ReviewCard({
  review,
  showProviderActions = false,
}: ReviewCardProps) {
  const user = useAuthStore((state) => state.user);
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const isOwn = review.client_id === user?.id;

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');

  const { mutate: addResponse, isPending: isReplying } =
    useAddProviderResponse();
  const { mutate: deleteReview, isPending: isDeleting } = useDeleteReview();

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;
    addResponse(
      { reviewId: review.id, response: replyText.trim() },
      {
        onSuccess: () => {
          setShowReplyForm(false);
          setReplyText('');
        },
      }
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer cet avis',
      'Êtes-vous sûr de vouloir supprimer cet avis ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteReview(review.id),
        },
      ]
    );
  };

  const responseBg = isDark ? colors.backgroundTertiary : `${colors.primary}10`;
  const replyFormBg = isDark ? colors.backgroundTertiary : '#F9FAFB';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          shadowColor: isDark ? colors.primary : '#000000',
          shadowOpacity: isDark ? 0.3 : 0.05,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Avatar
          source={review.client?.avatar_url ?? undefined}
          name={review.client?.full_name ?? undefined}
          size="lg"
        />
        <View style={styles.headerInfo}>
          <Text style={[styles.clientName, { color: colors.text }]}>
            {review.client?.full_name || 'Client anonyme'}
          </Text>
          <View style={styles.ratingRow}>
            <RatingStars rating={review.rating} size={14} showValue={false} />
            <Text style={[styles.date, { color: colors.textTertiary }]}>
              {review.created_at ? formatRelativeTime(review.created_at) : ''}
            </Text>
          </View>
        </View>

        {isOwn && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 size={18} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Comment */}
      {review.comment && (
        <Text style={[styles.comment, { color: colors.textSecondary }]}>{review.comment}</Text>
      )}

      {/* Service info */}
      {review.booking?.service && (
        <Text style={[styles.serviceInfo, { color: colors.textTertiary }]}>
          Service : {review.booking.service.name}
        </Text>
      )}

      {/* Provider Response */}
      {review.provider_response && (
        <View style={[styles.responseContainer, { backgroundColor: responseBg, borderLeftColor: colors.primary }]}>
          <View style={styles.responseHeader}>
            <MessageSquare size={14} color={colors.primary} />
            <Text style={[styles.responseLabel, { color: colors.primary }]}>Réponse du prestataire</Text>
          </View>
          <Text style={[styles.responseText, { color: colors.textSecondary }]}>{review.provider_response}</Text>
        </View>
      )}

      {/* Reply Form (for provider) */}
      {showProviderActions && !review.provider_response && (
        <>
          {showReplyForm ? (
            <View style={[styles.replyForm, { backgroundColor: replyFormBg }]}>
              <TextInput
                style={[styles.replyInput, { color: colors.text }]}
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Votre réponse..."
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={500}
              />
              <View style={styles.replyActions}>
                <Button
                  title="Annuler"
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowReplyForm(false)}
                />
                <Button
                  title="Répondre"
                  size="sm"
                  onPress={handleSubmitReply}
                  loading={isReplying}
                  disabled={!replyText.trim()}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.replyButton}
              onPress={() => setShowReplyForm(true)}
            >
              <MessageSquare size={16} color={colors.primary} />
              <Text style={[styles.replyButtonText, { color: colors.primary }]}>Répondre</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Layout.spacing.sm,
  },
  clientName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginTop: 2,
  },
  date: {
    fontSize: Layout.fontSize.xs,
  },
  menuButton: {
    padding: Layout.spacing.xs,
  },
  comment: {
    fontSize: Layout.fontSize.md,
    lineHeight: 22,
    marginBottom: Layout.spacing.sm,
  },
  serviceInfo: {
    fontSize: Layout.fontSize.xs,
    fontStyle: 'italic',
  },
  responseContainer: {
    marginTop: Layout.spacing.md,
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    borderLeftWidth: 3,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    marginBottom: Layout.spacing.xs,
  },
  responseLabel: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
  },
  responseText: {
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    marginTop: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
  },
  replyButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  replyForm: {
    marginTop: Layout.spacing.md,
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.md,
  },
  replyInput: {
    fontSize: Layout.fontSize.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.sm,
  },
});
