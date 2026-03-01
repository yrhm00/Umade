/**
 * Onboarding Step 2: Timeline et nom de l'événement (Phase 10)
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
import { OnboardingProgress, TimelineSelector, OnboardingAnimation } from '@/components/onboarding';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { goBackOrFallback } from '@/lib/navigation';

export default function TimelineScreen() {
  const colors = useColors();
  const {
    eventName,
    setEventName,
    eventTimeline,
    setEventTimeline,
    eventDate,
    setEventDate,
    nextStep,
    prevStep,
    currentStep,
    totalSteps,
  } = useOnboardingStore();

  useEffect(() => {
    // Set current step when screen mounts
    useOnboardingStore.setState({ currentStep: 2 });
  }, []);

  const handleNext = () => {
    if (eventTimeline) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/onboarding/style' as any);
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress */}
        <OnboardingProgress currentStep={2} totalSteps={totalSteps} />

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
          <OnboardingAnimation type="timeline" size={140} />
          <Text style={[styles.title, { color: colors.text }]}>Quand est prévu ton événement ?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Ça nous aidera à te montrer les bonnes infos au bon moment
          </Text>
        </Animated.View>

        {/* Timeline Selector */}
        <TimelineSelector
          eventName={eventName}
          onEventNameChange={setEventName}
          selectedTimeline={eventTimeline}
          onTimelineSelect={setEventTimeline}
          eventDate={eventDate}
          onDateChange={setEventDate}
        />
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title="Continuer"
          onPress={handleNext}
          disabled={!eventTimeline}
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
