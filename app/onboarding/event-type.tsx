/**
 * Onboarding Step 1: Type d'événement (Phase 10)
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/components/ui/Button';
import { OnboardingProgress, EventTypeSelector, OnboardingAnimation } from '@/components/onboarding';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function EventTypeScreen() {
  const colors = useColors();
  const { eventType, setEventType, currentStep, totalSteps } = useOnboardingStore();

  const handleNext = () => {
    if (eventType) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/onboarding/timeline' as any);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress */}
        <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />

        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(260)}
          style={styles.header}
        >
          <OnboardingAnimation type="event" size={160} />
          <Text style={[styles.title, { color: colors.text }]}>Tu prépares quel type d'événement ?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            On va t'aider à organiser ça aux petits oignons !
          </Text>
        </Animated.View>

        {/* Event Type Selector */}
        <View style={styles.selectorContainer}>
          <EventTypeSelector
            selectedType={eventType}
            onSelect={setEventType}
          />
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title="Continuer"
          onPress={handleNext}
          disabled={!eventType}
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
  header: {
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
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
  selectorContainer: {
    flex: 1,
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
