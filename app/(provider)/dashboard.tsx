import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { Calendar, MessageSquare, Settings, Star, TrendingUp } from 'lucide-react-native';
import {
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

  const stats: StatCard[] = [
    {
      title: 'Réservations',
      value: '12',
      icon: Calendar,
      color: Colors.primary.DEFAULT,
    },
    {
      title: 'Messages',
      value: '5',
      icon: MessageSquare,
      color: Colors.secondary.DEFAULT,
    },
    {
      title: 'Note moyenne',
      value: '4.8',
      icon: Star,
      color: Colors.warning.DEFAULT,
    },
    {
      title: 'Vues du profil',
      value: '234',
      icon: TrendingUp,
      color: Colors.success.DEFAULT,
    },
  ];

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.name}>{profile?.full_name || 'Prestataire'}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {}}
          >
            <Settings size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
                  <stat.icon size={24} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Prochaines réservations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prochaines réservations</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.emptyState}>
            <Calendar size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyStateText}>
              Aucune réservation à venir
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Vos prochaines réservations apparaîtront ici
            </Text>
          </View>
        </View>

        {/* Messages récents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Messages récents</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.emptyState}>
            <MessageSquare size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyStateText}>
              Aucun message récent
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Vos conversations apparaîtront ici
            </Text>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActions}>
            <Button
              title="Modifier mon profil"
              onPress={() => {}}
              variant="outline"
              size="md"
              fullWidth
            />
            <Button
              title="Gérer mes disponibilités"
              onPress={() => {}}
              variant="outline"
              size="md"
              fullWidth
            />
            <Button
              title="Voir mes statistiques"
              onPress={() => {}}
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
    paddingBottom: Layout.spacing.xl,
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
  quickActions: {
    gap: Layout.spacing.md,
  },
  logoutContainer: {
    marginTop: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.lg,
  },
});
