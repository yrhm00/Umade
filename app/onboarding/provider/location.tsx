/**
 * Étape 3 prestataire : localisation et zone d'intervention
 */

import { OnboardingProgress } from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { useProviderOnboardingStore } from '@/stores/providerOnboardingStore';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Hash, MapPin } from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProviderLocationScreen() {
  const colors = useColors();
  const {
    city,
    setCity,
    postalCode,
    setPostalCode,
    travelsNationwide,
    setTravelsNationwide,
    setCurrentStep,
    totalSteps,
  } = useProviderOnboardingStore();

  useEffect(() => {
    setCurrentStep(3);
  }, [setCurrentStep]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/provider/description' as any);
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
          <OnboardingProgress currentStep={3} totalSteps={totalSteps} />

          <Animated.View entering={FadeInDown.delay(100).duration(260)} style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Où êtes-vous basé ?</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Les clients filtrent souvent par ville. Vous pourrez modifier cette information à
              tout moment.
            </Text>
          </Animated.View>

          <View style={styles.form}>
            <Input
              label="Ville"
              placeholder="Ex. Bruxelles"
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
              leftIcon={<MapPin size={20} color={colors.textTertiary} />}
            />

            <Input
              label="Code postal"
              placeholder="1000"
              value={postalCode}
              onChangeText={setPostalCode}
              keyboardType="number-pad"
              leftIcon={<Hash size={20} color={colors.textTertiary} />}
            />

            <View
              style={[
                styles.toggleRow,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.toggleCopy}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>
                  🚗 Je me déplace partout en Belgique
                </Text>
                <Text style={[styles.toggleHint, { color: colors.textSecondary }]}>
                  Affiche un badge sur votre profil et vous rend visible dans les recherches
                  au-delà de votre ville.
                </Text>
              </View>
              <Switch
                value={travelsNationwide}
                onValueChange={(v) => {
                  Haptics.selectionAsync();
                  setTravelsNationwide(v);
                }}
                trackColor={{ false: colors.border, true: colors.primaryLight ?? colors.primary }}
                thumbColor={travelsNationwide ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottom,
            { backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <Button title="Continuer" onPress={handleNext} size="lg" fullWidth />
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    marginTop: Layout.spacing.sm,
  },
  toggleCopy: { flex: 1 },
  toggleLabel: { fontSize: Layout.fontSize.md, fontWeight: '600', marginBottom: 3 },
  toggleHint: { fontSize: Layout.fontSize.xs, lineHeight: 17 },
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
