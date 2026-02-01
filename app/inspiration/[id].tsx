/**
 * Ecran de detail d'une inspiration (Phase 9)
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { InspirationDetail } from '@/components/inspirations';
import { useInspiration } from '@/hooks/useInspirations';
import { EmptyState } from '@/components/common/EmptyState';

export default function InspirationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: inspiration, isLoading, error } = useInspiration(id);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
      </View>
    );
  }

  if (error || !inspiration) {
    return (
      <View style={styles.container}>
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
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
});
