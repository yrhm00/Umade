import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  MessageCircle,
  Star,
  Megaphone,
} from 'lucide-react-native';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/useNotificationPreferences';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface PreferenceRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

function PreferenceRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  disabled,
}: PreferenceRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.textContainer}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: Colors.gray[300],
          true: Colors.primary.light,
        }}
        thumbColor={value ? Colors.primary.DEFAULT : Colors.gray[100]}
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
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
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerBackTitle: 'Paramètres',
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Notifications push</Text>
        <Text style={styles.sectionDescription}>
          Choisissez les notifications que vous souhaitez recevoir sur votre
          téléphone.
        </Text>

        <View style={styles.section}>
          <PreferenceRow
            icon={<Calendar size={22} color={Colors.primary.DEFAULT} />}
            title="Réservations"
            description="Confirmations, rappels et mises à jour de vos réservations"
            value={preferences.booking_updates}
            onValueChange={(v) => handleToggle('booking_updates', v)}
            disabled={isPending}
          />

          <PreferenceRow
            icon={<MessageCircle size={22} color={Colors.primary.DEFAULT} />}
            title="Messages"
            description="Nouveaux messages de prestataires"
            value={preferences.messages}
            onValueChange={(v) => handleToggle('messages', v)}
            disabled={isPending}
          />

          <PreferenceRow
            icon={<Star size={22} color={Colors.warning.DEFAULT} />}
            title="Avis"
            description="Réponses à vos avis et demandes d'avis"
            value={preferences.reviews}
            onValueChange={(v) => handleToggle('reviews', v)}
            disabled={isPending}
          />

          <PreferenceRow
            icon={<Megaphone size={22} color={Colors.gray[500]} />}
            title="Marketing"
            description="Offres spéciales et nouveautés"
            value={preferences.marketing}
            onValueChange={(v) => handleToggle('marketing', v)}
            disabled={isPending}
          />
        </View>

        <Text style={styles.footerNote}>
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
    backgroundColor: Colors.background.tertiary,
  },
  content: {
    padding: Layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Layout.spacing.xs,
  },
  sectionDescription: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Layout.spacing.lg,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
    marginBottom: Layout.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[50],
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
    color: Colors.text.primary,
    marginBottom: 2,
  },
  rowDescription: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  footerNote: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
