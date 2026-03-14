/**
 * Event Detail Screen
 * Dark Mode Support
 */

import { BookingCard } from '@/components/booking/BookingCard';
import { EventStatusBadge } from '@/components/events/EventStatusBadge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useDeleteEvent, useEventDetail } from '@/hooks/useEvents';
import { formatDate, formatPrice } from '@/lib/utils';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Calendar,
  CheckSquare,
  ChevronRight,
  Clock,
  FileText,
  Grid3X3,
  MapPin,
  PartyPopper,
  Plus,
  Trash2,
  Users,
  UserPlus,
  Wallet,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { PressableScale } from '@/components/ui/PressableScale';
import React, { useEffect, useMemo } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { toast } from '@/lib/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';

export default function EventDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading, refetch } = useEventDetail(id);
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();

  const handleDelete = () => {
    Alert.alert(
      'Supprimer l\'événement',
      'Êtes-vous sûr de vouloir supprimer cet événement ? Les réservations liées ne seront pas supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteEvent(id!, {
              onSuccess: () => goBackOrFallback(router),
              onError: (error) => {
                toast.error(error.message);
              },
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement..." />;
  }

  if (!event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Événement non trouvé</Text>
          <Button title="Retour" onPress={() => goBackOrFallback(router)} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const bookings = event.bookings || [];
  const isPast = new Date(event.event_date) < new Date();

  // Jour J — calculs
  const jourJInfo = useMemo(() => {
    if (!event?.event_date) return { show: false, isToday: false, daysUntil: 0 };
    const eventDate = new Date(event.event_date);
    const today = new Date();
    eventDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return {
      show: diff >= 0 && diff <= 7,
      isToday: diff === 0,
      daysUntil: diff,
    };
  }, [event?.event_date]);

  // LIVE pulse animation
  const livePulse = useSharedValue(1);
  useEffect(() => {
    if (jourJInfo.isToday) {
      livePulse.value = withRepeat(
        withTiming(0.4, { duration: 1000 }),
        -1,
        true
      );
    }
  }, [jourJInfo.isToday]);
  const livePulseStyle = useAnimatedStyle(() => ({
    opacity: livePulse.value,
  }));

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.backgroundSecondary },
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete} disabled={isDeleting}>
              <Trash2 size={22} color={colors.error} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
          />
        }
      >
        {/* Title & Badge */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>
          <EventStatusBadge eventType={event.event_type} />
        </View>

        {/* Details */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
          <View style={styles.detailRow}>
            <Calendar size={18} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.text }]}>{formatDate(event.event_date)}</Text>
          </View>

          {event.location && (
            <View style={styles.detailRow}>
              <MapPin size={18} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>{event.location}</Text>
            </View>
          )}

          {event.guest_count != null && (
            <View style={styles.detailRow}>
              <Users size={18} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {event.guest_count} invité{event.guest_count > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {(event.budget_min != null || event.budget_max != null) && (
            <View style={styles.detailRow}>
              <Wallet size={18} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {event.budget_min != null && formatPrice(event.budget_min)}
                {event.budget_min != null && event.budget_max != null && ' — '}
                {event.budget_max != null && formatPrice(event.budget_max)}
              </Text>
            </View>
          )}

          {event.notes && (
            <View style={styles.detailRow}>
              <FileText size={18} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>{event.notes}</Text>
            </View>
          )}
        </View>

        {/* Jour J Banner */}
        {jourJInfo.show && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <PressableScale
              scale={0.98}
              haptic="light"
              onPress={() => router.push(`/event/${id}/jour-j` as any)}
              style={[styles.jourJBanner, {
                backgroundColor: jourJInfo.isToday ? colors.primary : isDark ? colors.card : '#FEF3C7',
              }]}
            >
              <View style={styles.jourJLeft}>
                <PartyPopper size={28} color={jourJInfo.isToday ? '#FFFFFF' : '#F59E0B'} />
              </View>
              <View style={styles.jourJCenter}>
                <View style={styles.jourJTitleRow}>
                  <Text style={[styles.jourJTitle, {
                    color: jourJInfo.isToday ? '#FFFFFF' : colors.text,
                  }]}>
                    {jourJInfo.isToday ? 'Jour J — C\'est aujourd\'hui !' : `Jour J dans ${jourJInfo.daysUntil} jour${jourJInfo.daysUntil > 1 ? 's' : ''}`}
                  </Text>
                  {jourJInfo.isToday && (
                    <Animated.View style={[styles.liveBadge, livePulseStyle]}>
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </Animated.View>
                  )}
                </View>
                <Text style={[styles.jourJSubtitle, {
                  color: jourJInfo.isToday ? 'rgba(255,255,255,0.85)' : colors.textSecondary,
                }]}>
                  {jourJInfo.isToday ? 'Accéder au tableau de bord live' : 'Voir le programme de votre événement'}
                </Text>
              </View>
              <ChevronRight size={20} color={jourJInfo.isToday ? '#FFFFFF' : colors.textTertiary} />
            </PressableScale>
          </Animated.View>
        )}

        {/* Planning Tools Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Layout.spacing.md }]}>
            Outils de planification
          </Text>
          <View style={styles.toolsGrid}>
            {[
              { icon: Wallet, label: 'Budget', color: '#10B981', route: `/event/${id}/budget` },
              { icon: Users, label: 'Invités', color: '#3B82F6', route: `/event/${id}/guests` },
              { icon: Grid3X3, label: 'Plan de table', color: '#8B5CF6', route: `/event/${id}/seating` },
              { icon: Clock, label: 'Timeline', color: '#F59E0B', route: `/event/${id}/timeline` },
              { icon: CheckSquare, label: 'Checklist', color: '#EC4899', route: `/event/${id}/checklist` },
              { icon: UserPlus, label: 'Partager', color: '#14B8A6', route: `/event/${id}/collaborators` },
            ].map((tool, index) => (
              <Animated.View key={tool.label} entering={FadeInRight.delay(index * 50)}>
                <PressableScale
                  onPress={() => router.push(tool.route as any)}
                  haptic="light"
                  style={[styles.toolCard, { backgroundColor: colors.card }]}
                >
                  <View style={[styles.toolIconCircle, { backgroundColor: `${tool.color}20` }]}>
                    <tool.icon size={22} color={tool.color} />
                  </View>
                  <Text style={[styles.toolLabel, { color: colors.text }]}>{tool.label}</Text>
                  <ChevronRight size={18} color={colors.textTertiary} />
                </PressableScale>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Bookings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Réservations ({bookings.length})
            </Text>
            {!isPast && (
              <TouchableOpacity
                style={styles.addBookingButton}
                onPress={() => router.push('/(tabs)/search')}
              >
                <Plus size={18} color={colors.primary} />
                <Text style={[styles.addBookingText, { color: colors.primary }]}>Ajouter</Text>
              </TouchableOpacity>
            )}
          </View>

          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <View style={[styles.emptyBookings, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucune réservation pour cet événement
              </Text>
              {!isPast && (
                <Button
                  title="Trouver un prestataire"
                  onPress={() => router.push('/(tabs)/search')}
                  variant="outline"
                  size="sm"
                  style={styles.findButton}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
    gap: Layout.spacing.lg,
  },
  errorText: {
    fontSize: Layout.fontSize.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  title: {
    flex: 1,
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
  },
  detailsCard: {
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.spacing.md,
  },
  detailText: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    lineHeight: 22,
  },
  section: {
    marginBottom: Layout.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
  },
  addBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  addBookingText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  emptyBookings: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
  },
  emptyText: {
    fontSize: Layout.fontSize.md,
    marginBottom: Layout.spacing.md,
  },
  findButton: {
    minWidth: 180,
  },
  toolsGrid: {
    gap: Layout.spacing.sm,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    gap: Layout.spacing.md,
  },
  toolIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  jourJBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.xl,
    gap: Layout.spacing.md,
  },
  jourJLeft: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jourJCenter: {
    flex: 1,
  },
  jourJTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  jourJTitle: {
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.bold,
  },
  jourJSubtitle: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.regular,
    marginTop: 2,
  },
  liveBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Layout.radius.full,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fontFamily.bold,
    letterSpacing: 1,
  },
});
