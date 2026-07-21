/**
 * Section "Recommandés pour toi" sur l'écran Home.
 * Matching scoré côté serveur (RPC get_recommended_providers) :
 * ville du profil + budget des préférences + prestataires vérifiés.
 * La section se masque silencieusement si la RPC n'est pas disponible.
 */

import { SectionHeader } from '@/components/common/SectionHeader';
import { Layout } from '@/constants/Layout';
import { useRecommendedProviders } from '@/hooks/useProviders';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuthStore } from '@/stores/authStore';
import type { BudgetRange } from '@/types/preferences';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ProviderCardSmall } from './ProviderCardSmall';

// Budget max indicatif par tranche d'onboarding
const BUDGET_TO_MAX: Record<string, number> = {
  small: 5000,
  medium: 15000,
  large: 30000,
};

function budgetRangeToMax(range: BudgetRange | null | undefined): number | null {
  if (!range) return null;
  return BUDGET_TO_MAX[range] ?? null;
}

export function RecommendedProvidersSection() {
  const router = useRouter();
  const profileCity = useAuthStore((state) => state.profile?.city ?? null);
  const { data: preferences } = useUserPreferences();

  const maxBudget = budgetRangeToMax(preferences?.budget_range);
  const { data: providers, isError } = useRecommendedProviders(profileCity, maxBudget, 8);

  // Pas de matching possible (RPC absente ou aucun résultat) → pas de section
  if (isError || !providers || providers.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(80).duration(260)} style={styles.container}>
      <SectionHeader
        title="Recommandés pour toi"
        actionLabel="Voir tous"
        onAction={() => router.push('/(tabs)/search' as any)}
      />
      <FlatList
        data={providers}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: Layout.spacing.md }} />}
        snapToInterval={150 + Layout.spacing.md}
        snapToAlignment="start"
        decelerationRate="fast"
        renderItem={({ item }) => <ProviderCardSmall provider={item} />}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.md,
  },
  listContent: {
    paddingLeft: Layout.spacing.md,
  },
});
