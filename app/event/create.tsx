/**
 * Create Event Screen
 * Dark Mode Support
 */

import { WizardEventForm } from '@/components/events/WizardEventForm';
import { useColors } from '@/hooks/useColors';
import { useCreateEvent } from '@/hooks/useEvents';
import { CreateEventInput } from '@/types';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { toast } from '@/lib/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';

export default function CreateEventScreen() {
  const router = useRouter();
  const colors = useColors();
  const { mutate: createEvent, isPending } = useCreateEvent();

  const handleSubmit = (input: CreateEventInput) => {
    createEvent(input, {
      onSuccess: () => {
        goBackOrFallback(router);
      },
      onError: (error) => {
        toast.error(error.message || 'Impossible de créer l\'événement');
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Nouvel événement',
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.backgroundSecondary },
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
        <WizardEventForm onSubmit={handleSubmit} isLoading={isPending} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
