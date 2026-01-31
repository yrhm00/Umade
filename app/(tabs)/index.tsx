import { CategoryPill } from '@/components/common/CategoryPill';
import { ProviderCard } from '@/components/providers/ProviderCard';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useTopProviders } from '@/hooks/useProviders';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategories();

  const {
    data: topProviders,
    isLoading: providersLoading,
    refetch: refetchProviders,
  } = useTopProviders(10);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchProviders()]);
    setRefreshing(false);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'vous';

  const handleCategoryPress = (categorySlug: string) => {
    router.push({
      pathname: '/(tabs)/search',
      params: { category: categorySlug },
    });
  };

  const handleSearchPress = () => {
    router.push('/(tabs)/search');
  };

  const handleSeeAllProviders = () => {
    router.push('/(tabs)/search');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.DEFAULT}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/notifications/index')}
            >
              <Bell size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <Avatar
                source={profile?.avatar_url}
                name={profile?.full_name || '?'}
                size="md"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={handleSearchPress}
          activeOpacity={0.7}
        >
          <Search size={20} color={Colors.gray[400]} />
          <Text style={styles.searchPlaceholder}>
            Rechercher un prestataire...
          </Text>
        </TouchableOpacity>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégories</Text>

          {categoriesLoading ? (
            <LoadingSpinner size="small" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {categories?.map((category) => (
                <CategoryPill
                  key={category.id}
                  label={category.name}
                  icon={category.icon || undefined}
                  onPress={() => handleCategoryPress(category.slug)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Top Providers Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleNoMargin}>Top prestataires</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={handleSeeAllProviders}
            >
              <Text style={styles.seeAllText}>Voir tout</Text>
              <ChevronRight size={16} color={Colors.primary.DEFAULT} />
            </TouchableOpacity>
          </View>

          {providersLoading ? (
            <LoadingSpinner size="small" />
          ) : topProviders && topProviders.length > 0 ? (
            <FlatList
              data={topProviders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ProviderCard provider={item} variant="grid" />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.providersContainer}
              ItemSeparatorComponent={() => (
                <View style={styles.providerSeparator} />
              )}
            />
          ) : (
            <View style={styles.emptyProviders}>
              <Text style={styles.emptyText}>
                Aucun prestataire disponible pour le moment
              </Text>
            </View>
          )}
        </View>

        {/* Categories Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explorer par catégorie</Text>

          <View style={styles.categoryGrid}>
            {categories?.slice(0, 6).map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryGridItem}
                onPress={() => handleCategoryPress(category.slug)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryGridIcon}>
                  {category.icon || '📌'}
                </Text>
                <Text style={styles.categoryGridName} numberOfLines={2}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
  },
  userName: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Layout.spacing.lg,
    marginVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    gap: Layout.spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    color: Colors.gray[400],
  },

  // Sections
  section: {
    marginTop: Layout.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  sectionTitleNoMargin: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  seeAllText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary.DEFAULT,
    fontWeight: '500',
  },

  // Categories horizontal
  categoriesContainer: {
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },

  // Providers horizontal
  providersContainer: {
    paddingHorizontal: Layout.spacing.lg,
  },
  providerSeparator: {
    width: Layout.spacing.md,
  },
  emptyProviders: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
  },

  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  categoryGridItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryGridIcon: {
    fontSize: 32,
    marginBottom: Layout.spacing.sm,
  },
  categoryGridName: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '500',
    color: Colors.text.primary,
    textAlign: 'center',
  },
});
