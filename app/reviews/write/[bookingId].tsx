/**
 * Write Review Screen
 * Dark Mode Support
 */

import { ReviewForm } from '@/components/reviews';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useColors } from '@/hooks/useColors';
import { useBookingForReview, useCreateReview } from '@/hooks/useReviews';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WriteReviewScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const { data: booking, isLoading } = useBookingForReview(bookingId ?? '');
  const { mutate: createReview, isPending } = useCreateReview();

  const handleSubmit = (data: { rating: number; comment?: string }) => {
    if (!booking) return;

    createReview(
      {
        booking_id: booking.id,
        provider_id: booking.provider_id,
        rating: data.rating,
        comment: data.comment,
      },
      {
        onSuccess: () => {
          Alert.alert('Merci !', 'Votre avis a été publié.', [
            {
              text: 'OK',
              onPress: () =>
                router.replace(`/reviews/provider/${booking.provider_id}`),
            },
          ]);
        },
        onError: (error) => {
          Alert.alert(
            'Erreur',
            error.message || 'Une erreur est survenue lors de la publication.'
          );
        },
      }
    );
  };

  if (isLoading || !booking) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Laisser un avis',
            headerBackTitle: 'Retour',
          }}
        />
        <LoadingSpinner fullScreen message="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Laisser un avis',
          headerBackTitle: 'Retour',
        }}
      />
      <ReviewForm
        booking={booking}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
