import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Home, Search, Calendar, MessageCircle, User } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useAuthStore } from '@/stores/authStore';
import { useTotalUnreadCount } from '@/hooks/useConversations';

const tabBarStyle = {
  height: Layout.tabBarHeight,
  paddingTop: 8,
  paddingBottom: 20,
  backgroundColor: Colors.white,
  borderTopWidth: 1,
  borderTopColor: Colors.gray[200],
} as const;

const tabBarLabelStyle = {
  fontSize: 11,
  fontWeight: '500',
} as const;

const screenOptions = {
  tabBarActiveTintColor: Colors.primary.DEFAULT,
  tabBarInactiveTintColor: Colors.gray[400],
  tabBarStyle,
  tabBarLabelStyle,
  headerShown: false,
} as const;

export default function TabLayout() {
  const hasSession = useAuthStore((state) => !!state.session);
  const isOnboarded = useAuthStore((state) => Boolean(state.profile?.is_onboarded));
  const unreadCount = useTotalUnreadCount();

  // Pas connecté → rediriger vers l'auth
  if (!hasSession) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Connecté mais pas onboardé → rediriger vers l'onboarding
  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Recherche',
          tabBarIcon: ({ color, size }) => (
            <Search size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Événements',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.primary.DEFAULT, fontSize: 10 },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
