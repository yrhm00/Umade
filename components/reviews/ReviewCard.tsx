import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MessageSquare, Trash2 } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { RatingStars } from '@/components/common/RatingStars';
import { Button } from '@/components/ui/Button';
import { ReviewWithDetails } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useAddProviderResponse, useDeleteReview } from '@/hooks/useReviews';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { formatRelativeTime } from '@/lib/utils';

interface ReviewCardProps {
  review: ReviewWithDetails;
  showProviderActions?: boolean;
}

export const ReviewCard = React.memo(function ReviewCard({
  review,
  showProviderActions = false,
}: ReviewCardProps) {
  const user = useAuthStore((state) => state.user);
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar
          source={review.client?.avatar_url ?? undefined}
          name={review.client?.full_name ?? undefined}
          size="lg"
        />
        <View style={styles.headerInfo}>
          <Text style={styles.clientName}>
            {review.client?.full_name || 'Client anonyme'}
          </Text>
          <View style={styles.ratingRow}>
            <RatingStars rating={review.rating} size={14} showValue={false} />
            <Text style={styles.date}>
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
            <Trash2 size={18} color={Colors.error.DEFAULT} />
          </TouchableOpacity>
        )}
      </View>

      {/* Comment */}
      {review.comment && <Text style={styles.comment}>{review.comment}</Text>}

      {/* Service info */}
      {review.booking?.service && (
        <Text style={styles.serviceInfo}>
          Service : {review.booking.service.name}
        </Text>
      )}

      {/* Provider Response */}
      {review.provider_response && (
        <View style={styles.responseContainer}>
          <View style={styles.responseHeader}>
            <MessageSquare size={14} color={Colors.primary.DEFAULT} />
            <Text style={styles.responseLabel}>Réponse du prestataire</Text>
          </View>
          <Text style={styles.responseText}>{review.provider_response}</Text>
        </View>
      )}

      {/* Reply Form (for provider) */}
      {showProviderActions && !review.provider_response && (
        <>
          {showReplyForm ? (
            <View style={styles.replyForm}>
              <TextInput
                style={styles.replyInput}
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Votre réponse..."
                placeholderTextColor={Colors.text.tertiary}
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
              <MessageSquare size={16} color={Colors.primary.DEFAULT} />
              <Text style={styles.replyButtonText}>Répondre</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
    color: Colors.text.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginTop: 2,
  },
  date: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.tertiary,
  },
  menuButton: {
    padding: Layout.spacing.xs,
  },
  comment: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Layout.spacing.sm,
  },
  serviceInfo: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  responseContainer: {
    marginTop: Layout.spacing.md,
    padding: Layout.spacing.md,
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.DEFAULT,
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
    color: Colors.primary.DEFAULT,
  },
  responseText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
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
    color: Colors.primary.DEFAULT,
    fontWeight: '500',
  },
  replyForm: {
    marginTop: Layout.spacing.md,
    padding: Layout.spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: Layout.radius.md,
  },
  replyInput: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.primary,
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
