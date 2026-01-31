import { LiquidTabBar } from '@/components/navigation/LiquidTabBar';
import { Colors } from '@/constants/Colors';
import { useTotalUnreadCount } from '@/hooks/useConversations';
import { useAuthStore } from '@/stores/authStore';
import { Redirect, Tabs } from 'expo-router';
import { Calendar, Home, MessageCircle, Search, User } from 'lucide-react-native';
import React from 'react';


export default function TabLayout() {
  const hasSession = useAuthStore((state) => !!state.session);
  const isOnboarded = useAuthStore((state) => Boolean(state.profile?.is_onboarded));
  const isProvider = useAuthStore((state) => state.profile?.role === 'provider');
  const unreadCount = useTotalUnreadCount();

  // Pas connecté → rediriger vers l'auth
  if (!hasSession) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Connecté mais pas onboardé → rediriger vers l'onboarding
  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  // Prestataire → rediriger vers le dashboard provider
  if (isProvider) {
    return <Redirect href="/(provider)/dashboard" />;
  }

  return (
    <Tabs
      tabBar={(props) => <LiquidTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // Labels are managed in the custom bar or hidden
        tabBarActiveTintColor: Colors.primary.DEFAULT,
        tabBarInactiveTintColor: Colors.gray[400],
      }}
    >
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
          // Badge needs to be handled in custom tab bar if not supported automatically
          // Note: custom tabBar prop usually overrides default badge rendering of standard tabs. 
          // We might need to pass badge count to LiquidTabBar.
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
