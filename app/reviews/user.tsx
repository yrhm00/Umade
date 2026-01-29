import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Star } from 'lucide-react-native';
import { ReviewCard } from '@/components/reviews';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useUserReviews, useReviewableBookings } from '@/hooks/useReviews';
import { ReviewWithDetails, ReviewableBooking } from '@/types';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { formatDate } from '@/lib/utils';

export default function UserReviewsScreen() {
  const router = useRouter();

  const {
    data: reviews,
    isLoading: isLoadingReviews,
    refetch: refetchReviews,
    isRefetching: isRefetchingReviews,
  } = useUserReviews();

  const {
    data: reviewableBookings,
    isLoading: isLoadingBookings,
    refetch: refetchBookings,
    isRefetching: isRefetchingBookings,
  } = useReviewableBookings();

  const isLoading = isLoadingReviews || isLoadingBookings;
  const isRefetching = isRefetchingReviews || isRefetchingBookings;

  const handleRefresh = () => {
    refetchReviews();
    refetchBookings();
  };

  const renderReviewableBooking = useCallback(
    (booking: ReviewableBooking) => (
      <Card key={booking.id} variant="outlined" style={styles.bookingCard}>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingProvider}>
            {booking.provider?.business_name}
          </Text>
          <Text style={styles.bookingService}>{booking.service?.name}</Text>
          <Text style={styles.bookingDate}>
            {formatDate(booking.booking_date)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.writeReviewButton}
          onPress={() => router.push(`/reviews/write/${booking.id}`)}
        >
          <Plus size={16} color={Colors.white} />
          <Text style={styles.writeReviewText}>Laisser un avis</Text>
        </TouchableOpacity>
      </Card>
    ),
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: ReviewWithDetails }) => <ReviewCard review={item} />,
    []
  );

  const keyExtractor = useCallback(
    (item: ReviewWithDetails) => item.id,
    []
  );

  const ListHeader = useMemo(() => {
    if (!reviewableBookings?.length) return null;

    return (
      <View style={styles.pendingSection}>
        <View style={styles.sectionHeader}>
          <Star size={20} color={Colors.warning.DEFAULT} />
          <Text style={styles.sectionTitle}>
            Avis en attente ({reviewableBookings.length})
          </Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Ces réservations attendent votre avis
        </Text>
        {reviewableBookings.map(renderReviewableBooking)}
      </View>
    );
  }, [reviewableBookings, renderReviewableBooking]);

  const ListEmpty = useMemo(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Star size={48} color={Colors.gray[300]} />
        <Text style={styles.emptyTitle}>Aucun avis</Text>
        <Text style={styles.emptySubtitle}>
          Vos avis apparaîtront ici après avoir noté vos prestataires.
        </Text>
      </View>
    );
  }, [isLoading]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Mes avis',
            headerBackTitle: 'Profil',
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
          title: 'Mes avis',
          headerBackTitle: 'Profil',
        }}
      />
      <FlatList
        data={reviews || []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !reviewableBookings?.length ? ListEmpty : undefined
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={Colors.primary.DEFAULT}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.tertiary,
  },
  listContent: {
    padding: Layout.spacing.md,
    flexGrow: 1,
  },
  pendingSection: {
    marginBottom: Layout.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.xs,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Layout.spacing.md,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingProvider: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  bookingService: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  bookingDate: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    backgroundColor: Colors.primary.DEFAULT,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.md,
  },
  writeReviewText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.xxl,
  },
  emptyTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  emptySubtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
