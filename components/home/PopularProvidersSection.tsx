/**
 * Section prestataires populaires sur l'écran Home
 */

import { SectionHeader } from '@/components/common/SectionHeader';
import { Layout } from '@/constants/Layout';
import { useTopProviders } from '@/hooks/useProviders';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ProviderCardSmall } from './ProviderCardSmall';

export function PopularProvidersSection() {
  const router = useRouter();
  const { data: providers } = useTopProviders(6);

  // Ne rien afficher si pas de prestataires
  if (!providers || providers.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(260)} style={styles.container}>
      <SectionHeader
        title="Prestataires populaires"
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
    paddingHorizontal: Layout.spacing.lg,
  },
});
