import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/stores/authStore';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const colors = useColors();
  const hasSession = useAuthStore((state) => !!state.session);
  const isOnboarded = useAuthStore((state) => Boolean(state.profile?.is_onboarded));

  if (hasSession) {
    return <Redirect href={isOnboarded ? '/(tabs)' : '/onboarding'} />;
  }

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
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
