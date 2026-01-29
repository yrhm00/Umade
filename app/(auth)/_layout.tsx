import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { Redirect, Stack } from 'expo-router';

const screenOptions = {
  headerShown: false,
  contentStyle: {
    backgroundColor: Colors.background.secondary,
  },
  animation: 'slide_from_right',
} as const;

export default function AuthLayout() {
  const hasSession = useAuthStore((state) => !!state.session);
  const isOnboarded = useAuthStore((state) => Boolean(state.profile?.is_onboarded));

  if (hasSession) {
    return <Redirect href={isOnboarded ? '/(tabs)' : '/onboarding'} />;
  }

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
