import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { useUpcomingProviderBookings } from '@/hooks/useBookings';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import {
  useProviderConnectOnboarding,
  useProviderRequestPayout,
  useProviderStripeConnectStatus,
  useProviderWalletSummary,
} from '@/hooks/useProviderPayout';
import { useProviderConversations, useProviderStats } from '@/hooks/useProviderStats';
import { useProviderRevenue, useRevenuePeriod } from '@/hooks/useRevenue';
import { getChatMessagePreview } from '@/lib/chatMessagePreview';
import { formatPrice } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import * as ExpoLinking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Calendar, DollarSign, MessageSquare, Settings, Star, Wallet } from 'lucide-react-native';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { toast } from '@/lib/toast';
import { SafeAreaView } from 'react-native-safe-area-context';

interface StatCard {
  title: string;
  value: string;
  icon: any;
  color: string;
}

const PROVIDER_FEE_RATE = 0.025;

function toGrossAmount(netAmount: number): number {
  const safeNet = Math.max(netAmount || 0, 0);
  return Math.round((safeNet / (1 - PROVIDER_FEE_RATE) + Number.EPSILON) * 100) / 100;
}

function formatStripeRequirement(requirement: string): string {
  return requirement
    .replace(/\./g, ' > ')
    .replace(/\[(.*?)\]/g, ' $1 ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function ProviderDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
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
  const {
    data: walletSummary,
    isLoading: walletLoading,
    refetch: refetchWalletSummary,
  } = useProviderWalletSummary();
  const { data: stripeConnectStatus, refetch: refetchStripeConnectStatus } = useProviderStripeConnectStatus();
  const {
    mutateAsync: startConnectOnboardingAsync,
    isPending: isStartingConnectOnboarding,
  } = useProviderConnectOnboarding();
  const {
    mutateAsync: requestPayoutAsync,
    isPending: isRequestingPayout,
  } = useProviderRequestPayout();

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
      refetchUpcoming(),
      refetchWalletSummary(),
      refetchStripeConnectStatus(),
    ]);
  };

  const walletGross = {
    held: toGrossAmount(walletSummary?.held_amount || 0),
    available: toGrossAmount(walletSummary?.available_amount || 0),
  };

  const isStripePayoutReady =
    stripeConnectStatus?.details_submitted === true &&
    stripeConnectStatus?.charges_enabled === true &&
    stripeConnectStatus?.payouts_enabled === true;
  const pendingRequirements = stripeConnectStatus?.requirements_currently_due || [];
  const canRequestPayout = isStripePayoutReady && (walletSummary?.available_amount || 0) > 0;
  const shouldLaunchConnectOnboarding = !isStripePayoutReady;

  const walletActionTitle = canRequestPayout
    ? `Recevoir ${formatPrice(walletGross.available)}`
    : shouldLaunchConnectOnboarding
      ? 'Activer les retraits Stripe'
      : 'Recevoir mon argent';

  const payoutHint = shouldLaunchConnectOnboarding
    ? pendingRequirements.length > 0
      ? `${pendingRequirements.length} information(s) Stripe à compléter`
      : 'Validation Stripe requise'
    : walletGross.available <= 0
      ? 'Aucun montant disponible'
      : `En attente : ${formatPrice(walletGross.held)}`;

  const handleRequestPayout = async () => {
    if (!canRequestPayout || isRequestingPayout) return;
    try {
      const result = await requestPayoutAsync({});
      toast.success(`Virement en cours (${formatPrice(result.amount)}). Le statut sera mis à jour automatiquement.`);
      await refetchWalletSummary();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Impossible de lancer le retrait pour le moment.';
      toast.error(message);
    }
  };

  const handleStartConnectOnboarding = async () => {
    if (isStartingConnectOnboarding) return;
    try {
      const appReturnUrl = ExpoLinking.createURL('/dashboard', {
        queryParams: { connect: 'return' },
      });
      const appRefreshUrl = ExpoLinking.createURL('/dashboard', {
        queryParams: { connect: 'refresh' },
      });

      const onboarding = await startConnectOnboardingAsync({
        returnUrl: appReturnUrl,
        refreshUrl: appRefreshUrl,
      });

      const connectUrl = onboarding.onboardingUrl || onboarding.dashboardLoginUrl;
      if (!connectUrl) {
        throw new Error('Lien de configuration Stripe indisponible.');
      }

      await WebBrowser.openAuthSessionAsync(connectUrl, appReturnUrl);
      await Promise.all([refetchStripeConnectStatus(), refetchWalletSummary()]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossible de lancer la configuration Stripe pour le moment.';
      toast.error(message);
    }
  };

  const handleWalletPrimaryAction = async () => {
    if (canRequestPayout) {
      await handleRequestPayout();
      return;
    }
    if (shouldLaunchConnectOnboarding) {
      await handleStartConnectOnboarding();
    }
  };

  const statCards: StatCard[] = [
    {
      title: 'Réservations',
      value: stats?.bookingsCount?.toString() || '0',
      icon: Calendar,
      color: colors.primary,
    },
    {
      title: 'Non lus',
      value: stats?.unreadMessagesCount?.toString() || '0',
      icon: MessageSquare,
      color: colors.primaryLight,
    },
    {
      title: 'Note moyenne',
      value: stats?.averageRating?.toFixed(1) || '-',
      icon: Star,
      color: colors.warning,
    },
    {
      title: 'Revenus',
      value: revenueData ? formatPrice(revenueData.total) : '-',
      icon: DollarSign,
      color: colors.success,
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={statsLoading || conversationsLoading || upcomingLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Bonjour,</Text>
            <Text style={[styles.name, { color: colors.text }]}>{profile?.full_name || 'Prestataire'}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.settingsButton,
              { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary },
            ]}
            onPress={() => router.push('/(provider)/settings')}
          >
            <Settings size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Vue d'ensemble</Text>
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
                    style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                    onPress={handlePress}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
                      <stat.icon size={24} color={stat.color} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                    <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{stat.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={[styles.walletPanel, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.walletPanelHeader}>
              <View
                style={[
                  styles.walletPanelIconWrap,
                  { backgroundColor: isDark ? `${colors.primary}24` : `${colors.primary}14` },
                ]}
              >
                <Wallet size={18} color={colors.primary} />
              </View>
              <View style={styles.walletPanelTitleWrap}>
                <Text style={[styles.walletPanelTitle, { color: colors.text }]}>Mon porte-monnaie</Text>
              </View>
            </View>

            {walletLoading ? (
              <LoadingSpinner size="small" />
            ) : (
              <View style={styles.walletPanelBody}>
                <Text style={[styles.walletMainAmount, { color: colors.text }]}>
                  {formatPrice(walletGross.available)}
                </Text>
                <Text style={[styles.walletMainLabel, { color: colors.textSecondary }]}>
                  Disponible maintenant (brut)
                </Text>
                <Text style={[styles.walletSecondaryLabel, { color: colors.textSecondary }]}>
                  Bloqué: {formatPrice(walletGross.held)}
                </Text>
                {shouldLaunchConnectOnboarding && pendingRequirements.length > 0 && (
                  <View style={styles.walletRequirementsList}>
                    {pendingRequirements.slice(0, 3).map((requirement) => (
                      <Text
                        key={requirement}
                        style={[styles.walletRequirementItem, { color: colors.textSecondary }]}
                      >
                        • {formatStripeRequirement(requirement)}
                      </Text>
                    ))}
                  </View>
                )}
                <Button
                  title={walletActionTitle}
                  onPress={handleWalletPrimaryAction}
                  loading={isRequestingPayout || isStartingConnectOnboarding}
                  disabled={
                    isRequestingPayout ||
                    isStartingConnectOnboarding ||
                    (!canRequestPayout && !shouldLaunchConnectOnboarding)
                  }
                  fullWidth
                />
                <Text style={[styles.walletHintText, { color: colors.textTertiary }]}>
                  {payoutHint}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Prochaines réservations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Prochaines réservations</Text>
            <TouchableOpacity onPress={() => router.push('/(provider)/bookings')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {upcomingLoading ? (
            <LoadingSpinner size="small" />
          ) : upcomingBookings && upcomingBookings.length > 0 ? (
            <View style={styles.bookingsList}>
              {upcomingBookings.map((booking) => (
                <TouchableOpacity
                  key={booking.id}
                  style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  onPress={() => router.push(`/(provider)/bookings`)}
                >
                  <View style={styles.bookingRow}>
                    <View
                      style={[
                        styles.dateBadge,
                        {
                          backgroundColor: isDark
                            ? colors.backgroundTertiary
                            : Colors.secondary.dark,
                        },
                      ]}
                    >
                      <Text style={styles.dateDay}>
                        {new Date(booking.booking_date).getDate()}
                      </Text>
                      <Text style={styles.dateMonth}>
                        {new Date(booking.booking_date).toLocaleDateString('fr-FR', { month: 'short' })}
                      </Text>
                    </View>

                    <View style={styles.bookingInfo}>
                      <Text style={[styles.bookingService, { color: colors.text }]} numberOfLines={1}>
                        {booking.services?.name || 'Service inconnu'}
                      </Text>
                      <Text style={[styles.bookingClient, { color: colors.textSecondary }]}>
                        {booking.profiles?.full_name || 'Client inconnu'}
                      </Text>
                    </View>

                    <View style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          booking.status === 'confirmed'
                            ? `${colors.success}22`
                            : `${colors.warning}22`,
                      },
                    ]}>
                      <Text style={[
                        styles.statusText,
                        {
                          color:
                            booking.status === 'confirmed'
                              ? colors.success
                              : colors.warning,
                        },
                      ]}>
                        {booking.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Calendar size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>
                Aucune réservation à venir
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                Vos prochaines réservations apparaîtront ici
              </Text>
            </View>
          )}
        </View>

        {/* Messages récents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Messages récents</Text>
            <TouchableOpacity onPress={() => router.push('/(provider)/messages')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {conversationsLoading ? (
            <LoadingSpinner size="small" />
          ) : recentConversations && recentConversations.length > 0 ? (
            <View style={[styles.conversationsList, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {recentConversations.map((conv) => (
                <TouchableOpacity
                  key={conv.id}
                  style={[styles.conversationItem, { borderBottomColor: colors.border }]}
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
                      <Text style={[styles.conversationName, { color: colors.text }]} numberOfLines={1}>
                        {conv.client?.full_name || 'Client'}
                      </Text>
                      <Text style={[styles.conversationTime, { color: colors.textTertiary }]}>
                        {formatTime(conv.last_message?.created_at)}
                      </Text>
                    </View>
                    <Text style={[styles.conversationMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                      {getChatMessagePreview(conv.last_message?.content, {
                        deletedForAll: conv.last_message?.deleted_for_all,
                      })}
                    </Text>
                  </View>
                  {conv.unread_count > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.unreadBadgeText}>
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <MessageSquare size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>
                Aucun message récent
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                Vos conversations apparaîtront ici
              </Text>
            </View>
          )}
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions rapides</Text>
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
  },
  name: {
    fontSize: Layout.fontSize['2xl'],
    fontFamily: fontFamily.bold,
    marginTop: Layout.spacing.xs,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    paddingHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontFamily: fontFamily.semiBold,
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
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
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
    fontFamily: fontFamily.bold,
    marginBottom: Layout.spacing.xs,
  },
  statTitle: {
    fontSize: Layout.fontSize.sm,
  },
  walletPanel: {
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
    padding: Layout.spacing.md,
    gap: Layout.spacing.md,
  },
  walletPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  walletPanelIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletPanelTitleWrap: {
    flex: 1,
  },
  walletPanelTitle: {
    fontSize: Layout.fontSize.lg,
    fontFamily: fontFamily.bold,
  },
  walletPanelBody: {
    gap: Layout.spacing.xs,
  },
  walletMainAmount: {
    fontSize: Layout.fontSize['3xl'],
    fontFamily: fontFamily.bold,
  },
  walletMainLabel: {
    fontSize: Layout.fontSize.sm,
  },
  walletSecondaryLabel: {
    fontSize: Layout.fontSize.sm,
    marginBottom: Layout.spacing.sm,
  },
  walletRequirementsList: {
    gap: 2,
    marginBottom: Layout.spacing.sm,
  },
  walletRequirementItem: {
    fontSize: Layout.fontSize.xs,
    lineHeight: 16,
  },
  walletHintText: {
    fontSize: Layout.fontSize.xs,
    textAlign: 'center',
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
    fontFamily: fontFamily.medium,
  },
  emptyState: {
    padding: Layout.spacing.xl,
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.semiBold,
    marginTop: Layout.spacing.md,
  },
  emptyStateSubtext: {
    fontSize: Layout.fontSize.sm,
    marginTop: Layout.spacing.xs,
    textAlign: 'center',
  },
  conversationsList: {
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
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
    fontFamily: fontFamily.semiBold,
    flex: 1,
  },
  conversationTime: {
    fontSize: Layout.fontSize.xs,
  },
  conversationMessage: {
    fontSize: Layout.fontSize.sm,
  },
  unreadBadge: {
    borderRadius: 18,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.semiBold,
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
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
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
    fontFamily: fontFamily.bold,
    color: Colors.primary.DEFAULT,
  },
  dateMonth: {
    fontSize: Layout.fontSize.xs,
    textTransform: 'uppercase',
    fontFamily: fontFamily.semiBold,
    color: Colors.primary.DEFAULT,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingService: {
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.semiBold,
  },
  bookingClient: {
    fontSize: Layout.fontSize.sm,
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
    fontFamily: fontFamily.medium,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    textTransform: 'uppercase',
  },
});
