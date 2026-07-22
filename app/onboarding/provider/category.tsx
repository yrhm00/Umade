/**
 * Étape 1 prestataire : quel métier ?
 */

import { OnboardingProgress } from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Layout } from '@/constants/Layout';
import { useCategories } from '@/hooks/useCategories';
import { useColors } from '@/hooks/useColors';
import { useProviderOnboardingStore } from '@/stores/providerOnboardingStore';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProviderCategoryScreen() {
  const colors = useColors();
  const { data: categories, isLoading } = useCategories();
  const { categoryId, setCategoryId, setCurrentStep, totalSteps } =
    useProviderOnboardingStore();

  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  const handleSelect = (id: string) => {
    Haptics.selectionAsync();
    setCategoryId(id);
  };

  const handleNext = () => {
    if (!categoryId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/provider/business' as any);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <OnboardingProgress currentStep={1} totalSteps={totalSteps} />

        <Animated.View entering={FadeInDown.delay(100).duration(260)} style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Quel est votre métier ?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Choisissez la catégorie qui décrit le mieux votre activité. Les clients vous
            trouveront grâce à elle.
          </Text>
        </Animated.View>

        {isLoading ? (
          <Text style={[styles.loading, { color: colors.textTertiary }]}>Chargement…</Text>
        ) : (
          <View style={styles.grid}>
            {categories?.map((cat: any, i: number) => {
              const selected = categoryId === cat.id;
              return (
                <Animated.View
                  key={cat.id}
                  entering={FadeInDown.delay(120 + i * 30).duration(240)}
                  style={styles.cell}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleSelect(cat.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={cat.name}
                    style={[
                      styles.card,
                      {
                        backgroundColor: selected ? `${colors.primary}14` : colors.card,
                        borderColor: selected ? colors.primary : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text style={styles.emoji}>{cat.icon || '✨'}</Text>
                    <Text
                      style={[
                        styles.cardLabel,
                        { color: selected ? colors.primary : colors.text },
                      ]}
                      numberOfLines={2}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottom,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Button title="Continuer" onPress={handleNext} disabled={!categoryId} size="lg" fullWidth />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 120 },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.lg,
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    marginBottom: Layout.spacing.sm,
  },
  subtitle: { fontSize: Layout.fontSize.md, lineHeight: 22 },
  loading: { textAlign: 'center', marginTop: Layout.spacing.xl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Layout.spacing.md,
  },
  cell: { width: '50%', padding: Layout.spacing.xs },
  card: {
    borderWidth: 1.5,
    borderRadius: Layout.radius.md,
    paddingVertical: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.md,
    alignItems: 'center',
    minHeight: 118,
    justifyContent: 'center',
  },
  emoji: { fontSize: 30, marginBottom: Layout.spacing.sm },
  cardLabel: { fontSize: Layout.fontSize.sm, fontWeight: '600', textAlign: 'center' },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
    borderTopWidth: 1,
  },
});
