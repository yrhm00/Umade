/**
 * Layout pour l'onboarding (Phase 10)
 */

import { Stack } from 'expo-router';
import { useColors } from '@/hooks/useColors';

export default function OnboardingLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
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
