/**
 * Layout du tunnel d'inscription prestataire
 */

import { useColors } from '@/hooks/useColors';
import { Stack } from 'expo-router';

export default function ProviderOnboardingLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="category" />
      <Stack.Screen name="business" />
      <Stack.Screen name="location" />
      <Stack.Screen name="description" />
    </Stack>
  );
}
