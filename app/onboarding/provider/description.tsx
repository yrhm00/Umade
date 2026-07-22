/**
 * Étape 4 prestataire : présentation + création effective de la fiche
 */

import { OnboardingProgress } from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { useCompleteProviderOnboarding } from '@/hooks/useProviderOnboarding';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/authStore';
import { useProviderOnboardingStore } from '@/stores/providerOnboardingStore';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const MAX = 600;

export default function ProviderDescriptionScreen() {
  const colors = useColors();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const store = useProviderOnboardingStore();
  const { description, setDescription, setCurrentStep, totalSteps, reset } = store;
  const { mutateAsync: completeSetup, isPending } = useCompleteProviderOnboarding();

  useEffect(() => {
    setCurrentStep(4);
  }, [setCurrentStep]);

  const handleFinish = async () => {
    if (isPending) return;
    try {
      await completeSetup({
        categoryId: store.categoryId!,
        businessName: store.businessName,
        businessPhone: store.businessPhone,
        city: store.city,
        postalCode: store.postalCode,
        travelsNationwide: store.travelsNationwide,
        description: store.description,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshProfile();
      reset();
      router.replace('/(provider)/dashboard');
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(
        e instanceof Error ? e.message : "Impossible de créer votre fiche. Réessayez."
      );
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <OnboardingProgress currentStep={4} totalSteps={totalSteps} />

          <Animated.View entering={FadeInDown.delay(100).duration(260)} style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Présentez-vous</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Quelques lignes sur votre style, votre expérience et ce qui vous distingue. C'est
              souvent ce que les clients lisent en premier.
            </Text>
          </Animated.View>

          <View style={styles.form}>
            <TextInput
              style={[
                styles.textarea,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Ex. Photographe de mariage depuis 8 ans, j'aime capturer les émotions sur le vif, dans un style naturel et lumineux…"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={(t) => t.length <= MAX && setDescription(t)}
              multiline
              textAlignVertical="top"
            />
            <Text style={[styles.counter, { color: colors.textTertiary }]}>
              {description.length}/{MAX}
            </Text>

            <View
              style={[
                styles.note,
                { backgroundColor: `${colors.primary}0F`, borderColor: `${colors.primary}26` },
              ]}
            >
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Votre profil sera visible immédiatement. Vous pourrez ensuite ajouter vos
                services, vos photos et vos disponibilités depuis votre tableau de bord.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottom,
            { backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <Button
            title="Créer mon profil prestataire"
            onPress={handleFinish}
            loading={isPending}
            size="lg"
            fullWidth
          />
          <TouchableOpacity
            onPress={handleFinish}
            disabled={isPending}
            style={styles.skip}
            accessibilityRole="button"
          >
            <Text style={[styles.skipText, { color: colors.textTertiary }]}>
              Passer et compléter plus tard
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 170 },
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
  form: { paddingHorizontal: Layout.spacing.lg },
  textarea: {
    minHeight: 170,
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    lineHeight: 22,
  },
  counter: { fontSize: Layout.fontSize.xs, textAlign: 'right', marginTop: 6 },
  note: {
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    marginTop: Layout.spacing.md,
  },
  noteText: { fontSize: Layout.fontSize.sm, lineHeight: 20 },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.lg,
    borderTopWidth: 1,
  },
  skip: { alignItems: 'center', paddingVertical: Layout.spacing.md },
  skipText: { fontSize: Layout.fontSize.sm, fontWeight: '500' },
});
