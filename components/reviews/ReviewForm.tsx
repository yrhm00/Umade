/**
 * Review Form Component
 * Dark Mode Support
 */

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { formatDate } from '@/lib/utils';
import { Calendar } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StarRatingInput } from './StarRatingInput';

interface BookingInfo {
  id: string;
  booking_date: string;
  provider_id: string;
  provider?: {
    id: string;
    business_name: string;
    user_id: string;
    profiles?: {
      avatar_url: string | null;
    };
  };
  service?: {
    name: string;
    price: number;
  };
}

interface ReviewFormProps {
  booking: BookingInfo;
  onSubmit: (data: { rating: number; comment?: string }) => void;
  isSubmitting?: boolean;
}

export function ReviewForm({
  booking,
  onSubmit,
  isSubmitting = false,
}: ReviewFormProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit({
      rating,
      comment: comment.trim() || undefined,
    });
  };

  const isValid = rating > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Booking Info */}
        <View
          style={[
            styles.bookingCard,
            {
              backgroundColor: colors.card,
              shadowColor: isDark ? colors.primary : '#000000',
              shadowOpacity: isDark ? 0.3 : 0.05,
            },
          ]}
        >
          <Avatar
            source={booking.provider?.profiles?.avatar_url ?? undefined}
            name={booking.provider?.business_name}
            size="lg"
          />
          <View style={styles.bookingInfo}>
            <Text style={[styles.providerName, { color: colors.text }]}>
              {booking.provider?.business_name}
            </Text>
            <Text style={[styles.serviceName, { color: colors.textSecondary }]}>
              {booking.service?.name}
            </Text>
            <View style={styles.dateRow}>
              <Calendar size={14} color={colors.textTertiary} />
              <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                {formatDate(booking.booking_date)}
              </Text>
            </View>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Votre note</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Touchez les étoiles pour noter
          </Text>
          <View style={styles.starsContainer}>
            <StarRatingInput
              value={rating}
              onChange={setRating}
              size={44}
              disabled={isSubmitting}
            />
          </View>
          {rating > 0 && (
            <Text style={[styles.ratingLabel, { color: colors.warning }]}>
              {rating === 1 && 'Très insatisfait'}
              {rating === 2 && 'Insatisfait'}
              {rating === 3 && 'Correct'}
              {rating === 4 && 'Satisfait'}
              {rating === 5 && 'Excellent !'}
            </Text>
          )}
        </View>

        {/* Comment Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Votre commentaire (optionnel)
          </Text>
          <TextInput
            style={[
              styles.commentInput,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={comment}
            onChangeText={setComment}
            placeholder="Partagez votre expérience avec ce prestataire..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={1000}
            editable={!isSubmitting}
          />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>
            {comment.length}/1000
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title="Publier mon avis"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!isValid || isSubmitting}
          fullWidth
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.lg,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  bookingInfo: {
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
  providerName: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
  },
  serviceName: {
    fontSize: Layout.fontSize.sm,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    marginTop: Layout.spacing.xs,
  },
  dateText: {
    fontSize: Layout.fontSize.xs,
  },
  section: {
    marginBottom: Layout.spacing.xl,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    marginBottom: Layout.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Layout.fontSize.sm,
    marginBottom: Layout.spacing.md,
  },
  starsContainer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
  },
  ratingLabel: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: Layout.spacing.sm,
  },
  commentInput: {
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
  },
  charCount: {
    fontSize: Layout.fontSize.xs,
    textAlign: 'right',
    marginTop: Layout.spacing.xs,
  },
  footer: {
    padding: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
  },
});
