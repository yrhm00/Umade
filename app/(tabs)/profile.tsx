import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useClientStats } from '@/hooks/useClientStats';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { ThemeMode, useThemeStore } from '@/stores/themeStore';
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  FileText,
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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const THEME_LABELS: Record<ThemeMode, string> = {
  light: 'Clair',
  dark: 'Sombre',
  system: 'Système',
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  badge?: string;
  destructive?: boolean;
  colors: ReturnType<typeof useColors>;
}

function MenuItem({ icon, label, onPress, badge, destructive, colors }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.menuIcon,
        { backgroundColor: destructive ? 'rgba(239, 68, 68, 0.1)' : `${colors.primary}15` }
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
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const { profile, signOut, isLoading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useClientStats();
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profil</Text>
        </View>

        {/* Profile Card */}
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
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: `${colors.primary}15` }]}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={[styles.editButtonText, { color: colors.primary }]}>Modifier le profil</Text>
          </TouchableOpacity>
        </Card>

        {/* Stats (for clients) */}
        {profile?.role === 'client' && (
          <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats?.bookingsCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Réservations</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats?.favoritesCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Favoris</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats?.reviewsCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avis</Text>
            </View>
          </View>
        )}

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>Mon compte</Text>
          <Card variant="outlined" padding="none">
            <MenuItem
              icon={<User size={20} color={colors.primary} />}
              label="Informations personnelles"
              onPress={() => router.push('/profile/edit')}
              colors={colors}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon={<Heart size={20} color={colors.primary} />}
              label="Mes favoris"
              onPress={() => router.push('/favorites')}
              colors={colors}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon={<Star size={20} color={colors.primary} />}
              label="Mes avis"
              onPress={() => router.push('/reviews/user' as any)}
              colors={colors}
            />
          </Card>
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>Paramètres</Text>
          <Card variant="outlined" padding="none">
            <MenuItem
              icon={<Bell size={20} color={colors.primary} />}
              label="Notifications"
              onPress={() => router.push('/notifications')}
              colors={colors}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon={<Moon size={20} color={colors.primary} />}
              label="Apparence"
              badge={THEME_LABELS[themeMode]}
              onPress={() => router.push('/settings/appearance' as any)}
              colors={colors}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon={<Settings size={20} color={colors.primary} />}
              label="Préférences notifications"
              onPress={() => router.push('/settings/notifications' as any)}
              colors={colors}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon={<HelpCircle size={20} color={colors.primary} />}
              label="Aide & Support"
              onPress={() => router.push('/help')}
              colors={colors}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon={<FileText size={20} color={colors.primary} />}
              label="Conditions d'utilisation"
              onPress={() => router.push('/legal/terms')}
              colors={colors}
            />
          </Card>
        </View>

        <View style={styles.menuSection}>
          <Card variant="outlined" padding="none">
            <MenuItem
              icon={<LogOut size={20} color={colors.error} />}
              label="Déconnexion"
              onPress={handleSignOut}
              destructive
              colors={colors}
            />
          </Card>
        </View>

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
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
  },
  profileCard: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
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
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: Layout.fontSize.sm,
  },
  editButton: {
    marginTop: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    alignItems: 'center',
    borderRadius: Layout.radius.md,
  },
  editButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
  },
  statLabel: {
    fontSize: Layout.fontSize.xs,
    marginTop: 2,
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
    fontWeight: '600',
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
});
