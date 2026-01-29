import React from 'react';
import { StyleSheet, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useCreateEvent } from '@/hooks/useEvents';
import { EventForm } from '@/components/events/EventForm';
import { CreateEventInput } from '@/types';

export default function CreateEventScreen() {
  const router = useRouter();
  const { mutate: createEvent, isPending } = useCreateEvent();

  const handleSubmit = (input: CreateEventInput) => {
    createEvent(input, {
      onSuccess: () => {
        router.back();
      },
      onError: (error) => {
        Alert.alert(
          'Erreur',
          error.message || 'Impossible de créer l\'événement'
        );
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Nouvel événement',
          headerTintColor: Colors.text.primary,
          headerStyle: { backgroundColor: Colors.background.secondary },
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <EventForm onSubmit={handleSubmit} isLoading={isPending} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
});
