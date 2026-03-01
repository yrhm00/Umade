/**
 * Layout pour l'onboarding (Phase 10)
 */

import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.background.primary,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="event-type" />
      <Stack.Screen name="timeline" />
      <Stack.Screen name="style" />
      <Stack.Screen name="details" />
    </Stack>
  );
}
