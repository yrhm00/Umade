import { BadgeIcon } from '@/components/badges/BadgeIcon';
import { ClientHeader } from '@/components/client/ClientHeader';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { useAuth } from '@/hooks/useAuth';
import { useUserBadges, useUnseenBadgeCount } from '@/hooks/useBadges';
import { useClientStats } from '@/hooks/useClientStats';
import { useCredits } from '@/hooks/useReferral';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { ThemeMode, useThemeStore } from '@/stores/themeStore';
import { useRouter } from 'expo-router';
import {
  Bell,
  Bookmark,
  ChevronRight,
  FileText,
  Gift,
  Heart,
  HelpCircle,
  LogOut,
  Moon,
  Settings,
  Star,
  User,
} from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const THEME_LABELS: Record<ThemeMode, string> = {
  light: 'Clair',
  dark: 'Sombre',
  oled: 'OLED',
  system: 'Système',
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  badge?: string;
  destructive?: boolean;
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
}

function MenuItem({ icon, label, onPress, badge, destructive, colors, isDark }: MenuItemProps) {
  return (
    <PressableScale
      scale={0.98}
      haptic="selection"
      onPress={onPress}
      style={styles.menuItem}
    >
      <View style={[
        styles.menuIcon,
        { backgroundColor: destructive ? 'rgba(239, 68, 68, 0.1)' : isDark ? `${colors.primary}30` : `${colors.primary}12` }
      ]}>
        {icon}
      </View>
      <Text style={[
        styles.menuLabel,
        { color: destructive ? colors.error : colors.text }
      ]}>
        {label}
      </Text>
      {badge && (
        <Badge label={badge} variant="info" size="sm" />
      )}
      <ChevronRight
        size={20}
        color={destructive ? colors.error : colors.textTertiary}
      />
    </PressableScale>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const { profile, signOut, isLoading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useClientStats();
  const { data: credits } = useCredits();
  const { data: userBadges = [] } = useUserBadges();
  const { data: unseenBadgeCount = 0 } = useUnseenBadgeCount();
  const themeMode = useThemeStore((state) => state.mode);

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={statsLoading}
            onRefresh={refetchStats}
            tintColor={colors.primary}
          />
        }
      >
        <ClientHeader
          eyebrow="Compte"
          title="Profil"
          subtitle="Tes favoris, avis, préférences et réglages."
          colors={colors}
          isDark={isDark}
          actionIcon={Settings}
          actionLabel="Paramètres d’apparence"
          onAction={() => router.push('/settings/appearance' as any)}
        />

        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(0).duration(260)}>
          <Card variant="elevated" style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Avatar
                source={profile?.avatar_url}
                name={profile?.full_name || '?'}
                size="xl"
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {profile?.full_name || 'Utilisateur'}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                  {profile?.email}
                </Text>
                <Badge
                  label={profile?.role === 'provider' ? 'Prestataire' : 'Client'}
                  variant="info"
                  size="sm"
                />
              </View>
            </View>
            <PressableScale
              scale={0.97}
              haptic="light"
              onPress={() => router.push('/profile/edit')}
              style={[styles.editButton, { backgroundColor: `${colors.primary}15` }]}
            >
              <Text style={[styles.editButtonText, { color: colors.primary }]}>Modifier le profil</Text>
            </PressableScale>
          </Card>
        </Animated.View>

        {/* Stats (for clients) */}
        {profile?.role === 'client' && (
          <Animated.View entering={FadeInDown.delay(100).duration(260)}>
            <View
              style={[
                styles.statsContainer,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats?.bookingsCount || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Réservations
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats?.favoritesCount || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Favoris
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats?.reviewsCount || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Avis
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Badges section */}
        {userBadges.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).duration(260)} style={styles.badgesSection}>
            <View style={styles.badgesSectionHeader}>
              <SectionHeader
                title="Mes badges"
                actionLabel="Voir tous"
                onAction={() => router.push('/badges' as any)}
              />
              {unseenBadgeCount > 0 && (
                <View style={[styles.unseenDot, { backgroundColor: colors.error }]}>
                  <Text style={styles.unseenDotText}>{unseenBadgeCount}</Text>
                </View>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesList}
            >
              {userBadges.slice(0, 5).map((ub) => (
                <PressableScale
                  key={ub.id}
                  scale={0.95}
                  haptic="selection"
                  onPress={() => router.push('/badges' as any)}
                >
                  <BadgeIcon
                    icon={ub.badges.icon}
                    name={ub.badges.name}
                    earned
                    size="sm"
                  />
                </PressableScale>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Menu Sections */}
        <Animated.View entering={FadeInDown.delay(200).duration(260)} style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>Mon compte</Text>
          <Card variant="outlined" padding="none">
            <MenuItem
              icon={<User size={20} color={colors.primary} />}
              label="Informations personnelles"
              onPress={() => router.push('/profile/edit')}
              colors={colors}
              isDark={isDark}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon={<Heart size={20} color={colors.primary} />}
              label="Mes favoris"
              onPress={() => router.push('/favorites')}
              colors={colors}
              isDark={isDark}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon={<Star size={20} color={colors.primary} />}
              label="Mes avis"
              onPress={() => router.push('/reviews/user' as any)}
              colors={colors}
              isDark={isDark}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon={<Bookmark size={20} color={colors.primary} />}
              label="Articles sauvegardés"
              onPress={() => router.push('/editorial/saved' as any)}
              colors={colors}
              isDark={isDark}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon={<Gift size={20} color={colors.primary} />}
              label="Parrainage"
              badge={credits?.balance ? `${credits.balance} crédits` : undefined}
              onPress={() => router.push('/referral' as any)}
              colors={colors}
              isDark={isDark}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(260)} style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>Paramètres</Text>
          <Card variant="outlined" padding="none">
            <MenuItem
              icon={<Bell size={20} color={colors.primary} />}
              label="Notifications"
              onPress={() => router.push('/notifications')}
              colors={colors}
              isDark={isDark}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon={<Moon size={20} color={colors.primary} />}
              label="Apparence"
              badge={THEME_LABELS[themeMode]}
              onPress={() => router.push('/settings/appearance' as any)}
              colors={colors}
              isDark={isDark}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon={<Settings size={20} color={colors.primary} />}
              label="Préférences notifications"
              onPress={() => router.push('/settings/notifications' as any)}
              colors={colors}
              isDark={isDark}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon={<HelpCircle size={20} color={colors.primary} />}
              label="Aide & Support"
              onPress={() => router.push('/help')}
              colors={colors}
              isDark={isDark}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon={<FileText size={20} color={colors.primary} />}
              label="Conditions d'utilisation"
              onPress={() => router.push('/legal/terms')}
              colors={colors}
              isDark={isDark}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(260)} style={styles.menuSection}>
          <Card variant="outlined" padding="none">
            <MenuItem
              icon={<LogOut size={20} color={colors.error} />}
              label="Déconnexion"
              onPress={handleSignOut}
              destructive
              colors={colors}
              isDark={isDark}
            />
          </Card>
        </Animated.View>

        {/* Version */}
        <Text style={[styles.version, { color: colors.textTertiary }]}>Version 1.0.0</Text>
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
  profileCard: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    borderRadius: Layout.radius.sm,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: Layout.fontSize.xl,
    fontFamily: fontFamily.bold,
  },
  profileEmail: {
    fontSize: Layout.fontSize.sm,
  },
  editButton: {
    marginTop: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    alignItems: 'center',
    borderRadius: Layout.radius.sm,
  },
  editButtonText: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.semiBold,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.radius.sm,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Layout.fontSize['2xl'],
    fontFamily: fontFamily.bold,
  },
  statLabel: {
    fontSize: Layout.fontSize.xs,
    marginTop: 2,
    fontFamily: fontFamily.medium,
  },
  statDivider: {
    width: 1,
  },
  menuSection: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  menuSectionTitle: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.semiBold,
    marginBottom: Layout.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    gap: Layout.spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: Layout.fontSize.md,
  },
  menuDivider: {
    height: 1,
    marginLeft: Layout.spacing.md + 36 + Layout.spacing.md,
  },
  version: {
    textAlign: 'center',
    fontSize: Layout.fontSize.xs,
    marginTop: Layout.spacing.md,
  },
  badgesSection: {
    marginBottom: Layout.spacing.md,
  },
  badgesSectionHeader: {
    position: 'relative',
  },
  unseenDot: {
    position: 'absolute',
    top: 2,
    left: Layout.spacing.lg + 95,
    minWidth: 20,
    height: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unseenDotText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fontFamily.bold,
  },
  badgesList: {
    paddingLeft: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
});
