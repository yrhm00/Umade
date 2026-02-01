/**
 * Notification Settings Screen
 * Dark Mode Support
 */

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/useNotificationPreferences';
import { Stack } from 'expo-router';
import {
  Calendar,
  Megaphone,
  MessageCircle,
  Star,
} from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PreferenceRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
}

function PreferenceRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  disabled,
  colors,
  isDark,
}: PreferenceRowProps) {
  const iconBg = isDark ? colors.backgroundTertiary : `${colors.primary}10`;

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.textContainer}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: isDark ? colors.backgroundTertiary : '#D1D5DB',
          true: `${colors.primary}80`,
        }}
        thumbColor={value ? colors.primary : isDark ? colors.textTertiary : '#F3F4F6'}
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const { data: preferences, isLoading } = useNotificationPreferences();
  const { mutate: updatePreferences, isPending } =
    useUpdateNotificationPreferences();

  const handleToggle = (
    key: 'booking_updates' | 'messages' | 'reviews' | 'marketing',
    value: boolean
  ) => {
    updatePreferences({ [key]: value });
  };

  if (isLoading || !preferences) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Notifications',
            headerBackTitle: 'Paramètres',
          }}
        />
        <LoadingSpinner fullScreen message="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerBackTitle: 'Paramètres',
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications push</Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Choisissez les notifications que vous souhaitez recevoir sur votre
          téléphone.
        </Text>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <PreferenceRow
            icon={<Calendar size={22} color={colors.primary} />}
            title="Réservations"
            description="Confirmations, rappels et mises à jour de vos réservations"
            value={preferences.booking_updates}
            onValueChange={(v) => handleToggle('booking_updates', v)}
            disabled={isPending}
            colors={colors}
            isDark={isDark}
          />

          <PreferenceRow
            icon={<MessageCircle size={22} color={colors.primary} />}
            title="Messages"
            description="Nouveaux messages de prestataires"
            value={preferences.messages}
            onValueChange={(v) => handleToggle('messages', v)}
            disabled={isPending}
            colors={colors}
            isDark={isDark}
          />

          <PreferenceRow
            icon={<Star size={22} color="#F59E0B" />}
            title="Avis"
            description="Réponses à vos avis et demandes d'avis"
            value={preferences.reviews}
            onValueChange={(v) => handleToggle('reviews', v)}
            disabled={isPending}
            colors={colors}
            isDark={isDark}
          />

          <PreferenceRow
            icon={<Megaphone size={22} color={colors.textTertiary} />}
            title="Marketing"
            description="Offres spéciales et nouveautés"
            value={preferences.marketing}
            onValueChange={(v) => handleToggle('marketing', v)}
            disabled={isPending}
            colors={colors}
            isDark={isDark}
          />
        </View>

        <Text style={[styles.footerNote, { color: colors.textTertiary }]}>
          Vous pouvez également désactiver les notifications dans les paramètres
          de votre téléphone.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    marginBottom: Layout.spacing.xs,
  },
  sectionDescription: {
    fontSize: Layout.fontSize.md,
    lineHeight: 22,
    marginBottom: Layout.spacing.lg,
  },
  section: {
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
    marginBottom: Layout.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: Layout.spacing.md,
  },
  rowTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowDescription: {
    fontSize: Layout.fontSize.sm,
    lineHeight: 18,
  },
  footerNote: {
    fontSize: Layout.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
