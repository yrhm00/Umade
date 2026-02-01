import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useUpcomingProviderBookings } from '@/hooks/useBookings';
import { useProviderConversations, useProviderStats } from '@/hooks/useProviderStats';
import { useProviderRevenue, useRevenuePeriod } from '@/hooks/useRevenue';
import { formatPrice } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { Calendar, DollarSign, MessageSquare, Settings, Star } from 'lucide-react-native';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface StatCard {
  title: string;
  value: string;
  icon: any;
  color: string;
}

export default function ProviderDashboardScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats
  } = useProviderStats();

  const {
    data: upcomingBookings,
    isLoading: upcomingLoading,
    refetch: refetchUpcoming
  } = useUpcomingProviderBookings(3);

  const {
    data: recentConversations,
    isLoading: conversationsLoading,
    refetch: refetchConversations
  } = useProviderConversations();

  const { period } = useRevenuePeriod();
  const {
    data: revenueData,
    isLoading: revenueLoading,
    refetch: refetchRevenue,
  } = useProviderRevenue(period);

  const onRefresh = async () => {
    await Promise.all([
      refetchStats(),
      refetchConversations(),
      refetchRevenue(),
      refetchUpcoming()
    ]);
  };

  const statCards: StatCard[] = [
    {
      title: 'Réservations',
      value: stats?.bookingsCount?.toString() || '0',
      icon: Calendar,
      color: Colors.primary.DEFAULT,
    },
    {
      title: 'Non lus',
      value: stats?.unreadMessagesCount?.toString() || '0',
      icon: MessageSquare,
      color: Colors.secondary.DEFAULT,
    },
    {
      title: 'Note moyenne',
      value: stats?.averageRating?.toFixed(1) || '-',
      icon: Star,
      color: Colors.warning.DEFAULT,
    },
    {
      title: 'Revenus',
      value: revenueData ? formatPrice(revenueData.total) : '-',
      icon: DollarSign,
      color: Colors.success.DEFAULT,
    },
  ];

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  const handleConversationPress = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={statsLoading || conversationsLoading || upcomingLoading}
            onRefresh={onRefresh}
            tintColor={Colors.primary.DEFAULT}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.name}>{profile?.full_name || 'Prestataire'}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/(provider)/settings')}
          >
            <Settings size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
          {statsLoading ? (
            <LoadingSpinner size="small" />
          ) : (
            <View style={styles.statsGrid}>
              {statCards.map((stat, index) => {
                const handlePress = () => {
                  if (stat.title === 'Réservations') {
                    router.push('/(provider)/bookings');
                  } else if (stat.title === 'Non lus') {
                    router.push('/(provider)/messages');
                  } else if (stat.title === 'Note moyenne') {
                    router.push('/(provider)/reviews');
                  } else if (stat.title === 'Revenus') {
                    router.push('/(provider)/revenue');
                  }
                };

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.statCard}
                    onPress={handlePress}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
                      <stat.icon size={24} color={stat.color} />
                    </View>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statTitle}>{stat.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Prochaines réservations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prochaines réservations</Text>
            <TouchableOpacity onPress={() => router.push('/(provider)/bookings')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {upcomingLoading ? (
            <LoadingSpinner size="small" />
          ) : upcomingBookings && upcomingBookings.length > 0 ? (
            <View style={styles.bookingsList}>
              {upcomingBookings.map((booking) => (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  onPress={() => router.push(`/(provider)/bookings`)}
                >
                  <View style={styles.bookingRow}>
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateDay}>
                        {new Date(booking.booking_date).getDate()}
                      </Text>
                      <Text style={styles.dateMonth}>
                        {new Date(booking.booking_date).toLocaleDateString('fr-FR', { month: 'short' })}
                      </Text>
                    </View>

                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingService} numberOfLines={1}>
                        {booking.services?.name || 'Service inconnu'}
                      </Text>
                      <Text style={styles.bookingClient}>
                        {booking.profiles?.full_name || 'Client inconnu'}
                      </Text>
                    </View>

                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: booking.status === 'confirmed' ? Colors.success.DEFAULT + '20' : Colors.warning.DEFAULT + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: booking.status === 'confirmed' ? Colors.success.DEFAULT : Colors.warning.DEFAULT }
                      ]}>
                        {booking.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Calendar size={48} color={Colors.gray[300]} />
              <Text style={styles.emptyStateText}>
                Aucune réservation à venir
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Vos prochaines réservations apparaîtront ici
              </Text>
            </View>
          )}
        </View>

        {/* Messages récents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Messages récents</Text>
            <TouchableOpacity onPress={() => router.push('/(provider)/messages')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {conversationsLoading ? (
            <LoadingSpinner size="small" />
          ) : recentConversations && recentConversations.length > 0 ? (
            <View style={styles.conversationsList}>
              {recentConversations.map((conv) => (
                <TouchableOpacity
                  key={conv.id}
                  style={styles.conversationItem}
                  onPress={() => handleConversationPress(conv.id)}
                  activeOpacity={0.7}
                >
                  <Avatar
                    source={conv.client?.avatar_url}
                    name={conv.client?.full_name || '?'}
                    size="md"
                  />
                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={styles.conversationName} numberOfLines={1}>
                        {conv.client?.full_name || 'Client'}
                      </Text>
                      <Text style={styles.conversationTime}>
                        {formatTime(conv.last_message?.created_at)}
                      </Text>
                    </View>
                    <Text style={styles.conversationMessage} numberOfLines={1}>
                      {conv.last_message?.content || 'Nouvelle conversation'}
                    </Text>
                  </View>
                  {conv.unread_count > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MessageSquare size={48} color={Colors.gray[300]} />
              <Text style={styles.emptyStateText}>
                Aucun message récent
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Vos conversations apparaîtront ici
              </Text>
            </View>
          )}
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActions}>
            <Button
              title="Modifier mon profil"
              onPress={() => router.push('/(provider)/profile-edit')}
              variant="outline"
              size="md"
              fullWidth
            />
            <Button
              title="Gérer mes disponibilités"
              onPress={() => router.push('/(provider)/availability')}
              variant="outline"
              size="md"
              fullWidth
            />
            <Button
              title="Gérer mes services"
              onPress={() => router.push('/(provider)/services')}
              variant="outline"
              size="md"
              fullWidth
            />
            <Button
              title="Voir mes statistiques"
              onPress={() => router.push('/(provider)/stats')}
              variant="outline"
              size="md"
              fullWidth
            />
            <Button
              title="Gérer mon portfolio"
              onPress={() => router.push('/(provider)/portfolio')}
              variant="outline"
              size="md"
              fullWidth
            />
            <Button
              title="Mes inspirations"
              onPress={() => router.push('/(provider)/inspirations' as any)}
              variant="outline"
              size="md"
              fullWidth
            />
          </View>
        </View>

        {/* Logout button */}
        <View style={styles.logoutContainer}>
          <Button
            title="Se déconnecter"
            onPress={handleLogout}
            variant="ghost"
            size="md"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  greeting: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.secondary,
  },
  name: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Layout.spacing.xs,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.radius.md,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    paddingHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Layout.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Layout.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  statValue: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Layout.spacing.xs,
  },
  statTitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
  },
  section: {
    marginTop: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  seeAll: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary.DEFAULT,
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: Colors.white,
    padding: Layout.spacing.xl,
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: Layout.spacing.md,
  },
  emptyStateSubtext: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Layout.spacing.xs,
    textAlign: 'center',
  },
  conversationsList: {
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    overflow: 'hidden',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
    gap: Layout.spacing.md,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  conversationName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  conversationTime: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.tertiary,
  },
  conversationMessage: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
  },
  unreadBadge: {
    backgroundColor: Colors.primary.DEFAULT,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    color: Colors.white,
  },
  quickActions: {
    gap: Layout.spacing.md,
  },
  logoutContainer: {
    marginTop: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.lg,
  },
  bookingsList: {
    gap: Layout.spacing.sm,
  },
  bookingCard: {
    backgroundColor: Colors.white,
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  dateBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary.dark,
    paddingVertical: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    minWidth: 50,
  },
  dateDay: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  dateMonth: {
    fontSize: Layout.fontSize.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingService: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  bookingClient: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
