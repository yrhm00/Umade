/**
 * Étape 2 prestataire : identité de l'entreprise
 */

import { OnboardingProgress } from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { useProviderOnboardingStore } from '@/stores/providerOnboardingStore';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Briefcase, Phone } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProviderBusinessScreen() {
  const colors = useColors();
  const {
    businessName,
    setBusinessName,
    businessPhone,
    setBusinessPhone,
    setCurrentStep,
    totalSteps,
  } = useProviderOnboardingStore();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  const handleNext = () => {
    if (!businessName.trim()) {
      setError("Le nom de votre entreprise est requis");
      return;
    }
    setError(undefined);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/provider/location' as any);
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
          <OnboardingProgress currentStep={2} totalSteps={totalSteps} />

          <Animated.View entering={FadeInDown.delay(100).duration(260)} style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Votre entreprise</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              C'est le nom que les clients verront sur votre profil et dans les résultats de
              recherche.
            </Text>
          </Animated.View>

          <View style={styles.form}>
            <Input
              label="Nom de l'entreprise *"
              placeholder="Ex. Lens & Light Studio"
              value={businessName}
              onChangeText={(t) => {
                setBusinessName(t);
                if (error) setError(undefined);
              }}
              error={error}
              autoCapitalize="words"
              leftIcon={<Briefcase size={20} color={colors.textTertiary} />}
            />

            <Input
              label="Téléphone professionnel"
              placeholder="+32 470 00 00 00"
              value={businessPhone}
              onChangeText={setBusinessPhone}
              keyboardType="phone-pad"
              leftIcon={<Phone size={20} color={colors.textTertiary} />}
            />

            <Text style={[styles.hint, { color: colors.textTertiary }]}>
              Le téléphone est facultatif — les clients peuvent déjà vous contacter par
              messagerie dans l'app.
            </Text>
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottom,
            { backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <Button
            title="Continuer"
            onPress={handleNext}
            disabled={!businessName.trim()}
            size="lg"
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
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
  form: { paddingHorizontal: Layout.spacing.lg },
  hint: { fontSize: Layout.fontSize.xs, lineHeight: 18, marginTop: Layout.spacing.xs },
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
