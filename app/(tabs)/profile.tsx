import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useClientStats } from '@/hooks/useClientStats';
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  FileText,
  Heart,
  HelpCircle,
  LogOut,
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

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  badge?: string;
  destructive?: boolean;
}

function MenuItem({ icon, label, onPress, badge, destructive }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.menuIcon,
        destructive && styles.menuIconDestructive
      ]}>
        {icon}
      </View>
      <Text style={[
        styles.menuLabel,
        destructive && styles.menuLabelDestructive
      ]}>
        {label}
      </Text>
      {badge && (
        <Badge label={badge} variant="info" size="sm" />
      )}
      <ChevronRight
        size={20}
        color={destructive ? Colors.error.DEFAULT : Colors.gray[400]}
      />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut, isLoading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useClientStats();

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={statsLoading}
            onRefresh={refetchStats}
            tintColor={Colors.primary.DEFAULT}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
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
              <Text style={styles.profileName}>
                {profile?.full_name || 'Utilisateur'}
              </Text>
              <Text style={styles.profileEmail}>
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
            style={styles.editButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.editButtonText}>Modifier le profil</Text>
          </TouchableOpacity>
        </Card>

        {/* Stats (for clients) */}
        {profile?.role === 'client' && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.bookingsCount || 0}</Text>
              <Text style={styles.statLabel}>Réservations</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.favoritesCount || 0}</Text>
              <Text style={styles.statLabel}>Favoris</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.reviewsCount || 0}</Text>
              <Text style={styles.statLabel}>Avis</Text>
            </View>
          </View>
        )}

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Mon compte</Text>
          <Card variant="outlined" padding="none">
            <MenuItem
              icon={<User size={20} color={Colors.primary.DEFAULT} />}
              label="Informations personnelles"
              onPress={() => router.push('/profile/edit')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon={<Heart size={20} color={Colors.primary.DEFAULT} />}
              label="Mes favoris"
              onPress={() => router.push('/favorites')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon={<Star size={20} color={Colors.primary.DEFAULT} />}
              label="Mes avis"
              onPress={() => router.push('/reviews/user' as any)}
            />
          </Card>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Paramètres</Text>
          <Card variant="outlined" padding="none">
            <MenuItem
              icon={<Bell size={20} color={Colors.primary.DEFAULT} />}
              label="Notifications"
              onPress={() => router.push('/notifications')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon={<Settings size={20} color={Colors.primary.DEFAULT} />}
              label="Préférences notifications"
              onPress={() => router.push('/settings/notifications' as any)}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon={<HelpCircle size={20} color={Colors.primary.DEFAULT} />}
              label="Aide & Support"
              onPress={() => router.push('/help')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon={<FileText size={20} color={Colors.primary.DEFAULT} />}
              label="Conditions d'utilisation"
              onPress={() => router.push('/legal/terms')}
            />
          </Card>
        </View>

        <View style={styles.menuSection}>
          <Card variant="outlined" padding="none">
            <MenuItem
              icon={<LogOut size={20} color={Colors.error.DEFAULT} />}
              label="Déconnexion"
              onPress={handleSignOut}
              destructive
            />
          </Card>
        </View>

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollContent: {
    paddingBottom: 120, // Increased to account for Floating Tab Bar
  },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
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
    color: Colors.text.primary,
  },
  profileEmail: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
  },
  editButton: {
    marginTop: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.radius.md,
  },
  editButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
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
    color: Colors.primary.DEFAULT,
  },
  statLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray[200],
  },
  menuSection: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  menuSectionTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
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
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconDestructive: {
    backgroundColor: Colors.error.light,
  },
  menuLabel: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    color: Colors.text.primary,
  },
  menuLabelDestructive: {
    color: Colors.error.DEFAULT,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.gray[100],
    marginLeft: Layout.spacing.md + 36 + Layout.spacing.md,
  },
  version: {
    textAlign: 'center',
    fontSize: Layout.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: Layout.spacing.md,
  },
});
