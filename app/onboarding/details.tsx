/**
 * Onboarding Step 4: Détails optionnels (Phase 10)
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronLeft } from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/components/ui/Button';
import { OnboardingProgress, BudgetSlider, OnboardingAnimation } from '@/components/onboarding';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useCompleteOnboarding } from '@/hooks/useUserPreferences';
import { useAuthStore } from '@/stores/authStore';
import { goBackOrFallback } from '@/lib/navigation';

export default function DetailsScreen() {
  const colors = useColors();
  const {
    eventType,
    eventName,
    eventTimeline,
    eventDate,
    preferredStyles,
    budgetRange,
    setBudgetRange,
    guestCount,
    setGuestCount,
    location,
    setLocation,
    totalSteps,
    reset,
  } = useOnboardingStore();

  const { mutateAsync: completeOnboarding, isPending } = useCompleteOnboarding();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    useOnboardingStore.setState({ currentStep: 4 });
  }, []);

  const handleFinish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await completeOnboarding({
        event_type: eventType,
        event_name: eventName || null,
        event_timeline: eventTimeline,
        event_date: eventDate?.toISOString().split('T')[0] || null,
        preferred_styles: preferredStyles,
        budget_range: budgetRange,
        guest_count: guestCount,
        location: location || null,
      });

      // Refresh profile to update onboarding status
      await refreshProfile();

      // Reset onboarding store
      reset();

      // Navigate to home
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    // Skip but still save basic info
    await handleFinish();
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
        <OnboardingProgress currentStep={4} totalSteps={totalSteps} />

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
          <OnboardingAnimation type="details" size={140} />
          <Text style={[styles.title, { color: colors.text }]}>Dernières infos</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Ces détails nous aideront à personnaliser tes recommandations
          </Text>
        </Animated.View>

        {/* Budget Slider & Details */}
        <BudgetSlider
          budgetRange={budgetRange}
          onBudgetChange={setBudgetRange}
          guestCount={guestCount}
          onGuestCountChange={setGuestCount}
          location={location}
          onLocationChange={setLocation}
        />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Passer cette étape</Text>
        </Pressable>
        <Button
          title="C'est parti ! 🚀"
          onPress={handleFinish}
          loading={isSubmitting || isPending}
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
    paddingBottom: 140,
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
    gap: Layout.spacing.sm,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
  },
  skipText: {
    fontSize: Layout.fontSize.md,
  },
});
