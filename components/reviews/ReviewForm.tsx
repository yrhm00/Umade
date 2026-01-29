import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Calendar, Clock } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { StarRatingInput } from './StarRatingInput';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { formatDate } from '@/lib/utils';

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
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Booking Info */}
        <View style={styles.bookingCard}>
          <Avatar
            source={booking.provider?.profiles?.avatar_url ?? undefined}
            name={booking.provider?.business_name}
            size="lg"
          />
          <View style={styles.bookingInfo}>
            <Text style={styles.providerName}>
              {booking.provider?.business_name}
            </Text>
            <Text style={styles.serviceName}>{booking.service?.name}</Text>
            <View style={styles.dateRow}>
              <Calendar size={14} color={Colors.text.tertiary} />
              <Text style={styles.dateText}>
                {formatDate(booking.booking_date)}
              </Text>
            </View>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Votre note</Text>
          <Text style={styles.sectionSubtitle}>
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
            <Text style={styles.ratingLabel}>
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
          <Text style={styles.sectionTitle}>Votre commentaire (optionnel)</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Partagez votre expérience avec ce prestataire..."
            placeholderTextColor={Colors.text.tertiary}
            multiline
            maxLength={1000}
            editable={!isSubmitting}
          />
          <Text style={styles.charCount}>{comment.length}/1000</Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
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
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    padding: Layout.spacing.lg,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
    color: Colors.text.primary,
  },
  serviceName: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
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
    color: Colors.text.tertiary,
  },
  section: {
    marginBottom: Layout.spacing.xl,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Layout.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Layout.spacing.md,
  },
  starsContainer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
  },
  ratingLabel: {
    fontSize: Layout.fontSize.md,
    color: Colors.warning.DEFAULT,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: Layout.spacing.sm,
  },
  commentInput: {
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    color: Colors.text.primary,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  charCount: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'right',
    marginTop: Layout.spacing.xs,
  },
  footer: {
    padding: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    backgroundColor: Colors.background.primary,
  },
});
