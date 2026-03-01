/**
 * Onboarding Step 3: Styles préférés (Phase 10)
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft } from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/components/ui/Button';
import { OnboardingProgress, StylePicker, OnboardingAnimation } from '@/components/onboarding';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { goBackOrFallback } from '@/lib/navigation';

export default function StyleScreen() {
  const colors = useColors();
  const {
    preferredStyles,
    toggleStyle,
    totalSteps,
  } = useOnboardingStore();

  useEffect(() => {
    useOnboardingStore.setState({ currentStep: 3 });
  }, []);

  const handleNext = () => {
    if (preferredStyles.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/onboarding/details' as any);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goBackOrFallback(router);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <OnboardingProgress currentStep={3} totalSteps={totalSteps} />

        {/* Back Button */}
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Retour</Text>
        </Pressable>

        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(260)}
          style={styles.header}
        >
          <OnboardingAnimation type="style" size={140} />
          <Text style={[styles.title, { color: colors.text }]}>Quel est ton style ?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sélectionne les ambiances qui te font rêver
          </Text>
        </Animated.View>

        {/* Style Picker */}
        <StylePicker
          selectedStyles={preferredStyles}
          onToggle={toggleStyle}
          maxSelection={3}
        />
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title="Continuer"
          onPress={handleNext}
          disabled={preferredStyles.length === 0}
          size="lg"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
    gap: 4,
  },
  backText: {
    fontSize: Layout.fontSize.md,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.lg,
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    textAlign: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
    borderTopWidth: 1,
  },
});
