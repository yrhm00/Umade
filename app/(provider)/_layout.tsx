import { useColors } from '@/hooks/useColors';
import { useHasProviderProfile } from '@/hooks/useProviderOnboarding';
import { Redirect, Stack } from 'expo-router';

export default function ProviderLayout() {
  const colors = useColors();

  // Garde-fou : sans fiche `providers`, tous les écrans de cet espace
  // (services, portfolio, disponibilités, stats…) échouent. On renvoie vers
  // le setup — ce qui répare aussi les comptes créés avant ce correctif.
  const { data: hasProfile, isLoading } = useHasProviderProfile();

  if (isLoading) return null;

  if (hasProfile === false) {
    return <Redirect href={'/onboarding/provider/category' as any} />;
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
      <Stack.Screen
        name="dashboard"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="messages"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="bookings"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="reviews"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="revenue"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile-edit"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="availability"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="stats"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="services"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
