import { Colors } from '@/constants/Colors';
import { useTotalUnreadCount } from '@/hooks/useConversations';
import { useAuthStore } from '@/stores/authStore';
import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import { Redirect, withLayoutContext } from 'expo-router';
import React from 'react';

const { Navigator } = createNativeBottomTabNavigator();
const Tabs = withLayoutContext(Navigator);

export default function TabLayout() {
  const hasSession = useAuthStore((state) => !!state.session);
  const isOnboarded = useAuthStore((state) => Boolean(state.profile?.is_onboarded));
  const isProvider = useAuthStore((state) => state.profile?.role === 'provider');
  const unreadCount = useTotalUnreadCount();

  if (!hasSession) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!isOnboarded) {
    return <Redirect href={'/onboarding/event-type' as any} />;
  }

  if (isProvider) {
    return <Redirect href="/(provider)/dashboard" />;
  }

  const badgeText =
    unreadCount > 0 ? (unreadCount > 9 ? '9+' : String(unreadCount)) : undefined;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary.DEFAULT,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: () => ({ sfSymbol: 'house.fill' }),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Recherche',
          tabBarIcon: () => ({ sfSymbol: 'magnifyingglass' }),
          role: 'search' as any,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Événements',
          tabBarIcon: () => ({ sfSymbol: 'calendar' }),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: () => ({ sfSymbol: 'message.fill' }),
          tabBarBadge: badgeText,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: () => ({ sfSymbol: 'person.fill' }),
        }}
      />
    </Tabs>
  );
}
