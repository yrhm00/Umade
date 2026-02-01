/**
 * User Reviews Screen
 * Dark Mode Support
 */

import { ReviewCard } from '@/components/reviews';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useReviewableBookings, useUserReviews } from '@/hooks/useReviews';
import { formatDate } from '@/lib/utils';
import { ReviewWithDetails, ReviewableBooking } from '@/types';
import { Stack, useRouter } from 'expo-router';
import { Plus, Star } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UserReviewsScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();

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
          <Text style={[styles.bookingProvider, { color: colors.text }]}>
            {booking.provider?.business_name}
          </Text>
          <Text style={[styles.bookingService, { color: colors.textSecondary }]}>{booking.service?.name}</Text>
          <Text style={[styles.bookingDate, { color: colors.textTertiary }]}>
            {formatDate(booking.booking_date)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.writeReviewButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/reviews/write/${booking.id}`)}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.writeReviewText}>Laisser un avis</Text>
        </TouchableOpacity>
      </Card>
    ),
    [router, colors]
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
          <Star size={20} color="#F59E0B" />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Avis en attente ({reviewableBookings.length})
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Ces réservations attendent votre avis
        </Text>
        {reviewableBookings.map(renderReviewableBooking)}
      </View>
    );
  }, [reviewableBookings, renderReviewableBooking, colors]);

  const ListEmpty = useMemo(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Star size={48} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun avis</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Vos avis apparaîtront ici après avoir noté vos prestataires.
        </Text>
      </View>
    );
  }, [isLoading, colors]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top', 'bottom']}>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
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
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  sectionSubtitle: {
    fontSize: Layout.fontSize.sm,
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
  },
  bookingService: {
    fontSize: Layout.fontSize.sm,
    marginTop: 2,
  },
  bookingDate: {
    fontSize: Layout.fontSize.xs,
    marginTop: 2,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.md,
  },
  writeReviewText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: '#FFFFFF',
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
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  emptySubtitle: {
    fontSize: Layout.fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});
