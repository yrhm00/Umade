import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReviewForm } from '@/components/reviews';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useBookingForReview, useCreateReview } from '@/hooks/useReviews';
import { Colors } from '@/constants/Colors';

export default function WriteReviewScreen() {
  const router = useRouter();
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
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
    backgroundColor: Colors.background.primary,
  },
});
