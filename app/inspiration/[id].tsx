/**
 * Ecran de detail d'une inspiration
 * Dark Mode Support
 */

import { EmptyState } from '@/components/common/EmptyState';
import { InspirationDetail } from '@/components/inspirations';
import { useColors } from '@/hooks/useColors';
import { useInspiration } from '@/hooks/useInspirations';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function InspirationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();

  const { data: inspiration, isLoading, error } = useInspiration(id);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !inspiration) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="😕"
          title="Inspiration introuvable"
          description="Cette inspiration n'existe pas ou a ete supprimee."
        />
      </View>
    );
  }

  return <InspirationDetail inspiration={inspiration} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
