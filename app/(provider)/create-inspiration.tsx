/**
 * Ecran de creation d'une inspiration (Phase 9)
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { PressableScale } from '@/components/ui/PressableScale';
import { CreateInspirationForm } from '@/components/inspirations';
import { useCreateInspiration } from '@/hooks/useCreateInspiration';
import { CreateInspirationInput, InspirationImageInput } from '@/types/inspiration';

export default function CreateInspirationScreen() {
  const { mutateAsync: createInspiration, isPending } = useCreateInspiration();

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleSubmit = useCallback(
    async (inspiration: CreateInspirationInput, images: InspirationImageInput[]) => {
      try {
        await createInspiration({ inspiration, images });
        Alert.alert(
          'Inspiration publiee !',
          'Votre inspiration est maintenant visible par tous les utilisateurs.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } catch (error) {
        console.error('Error creating inspiration:', error);
        Alert.alert(
          'Erreur',
          "Impossible de publier l'inspiration. Veuillez reessayer."
        );
      }
    },
    [createInspiration]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <PressableScale onPress={handleBack} haptic="light">
          <View style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.text.primary} />
          </View>
        </PressableScale>
        <Text style={styles.headerTitle}>Nouvelle inspiration</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Form */}
      <CreateInspirationForm onSubmit={handleSubmit} isLoading={isPending} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  placeholder: {
    width: 44,
  },
});
