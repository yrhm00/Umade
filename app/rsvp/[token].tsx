import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import {
  useGuestGroupRsvpPayload,
  useSubmitGuestGroupRsvp,
} from '@/hooks/useGuestGroupInvites';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RsvpStatus = 'pending' | 'confirmed' | 'declined' | 'maybe';

const STATUS_OPTIONS: Array<{ value: RsvpStatus; label: string; description: string }> = [
  { value: 'confirmed', label: 'Présent', description: 'Nous serons présents' },
  { value: 'declined', label: 'Absent', description: 'Nous ne pourrons pas venir' },
  { value: 'maybe', label: 'Peut-être', description: 'En attente de confirmation' },
];

export default function PublicRsvpScreen() {
  const colors = useColors();
  const { token } = useLocalSearchParams<{ token: string }>();

  const { data: payload, isLoading, refetch } = useGuestGroupRsvpPayload(token);
  const { mutate: submitRsvp, isPending } = useSubmitGuestGroupRsvp();

  const [status, setStatus] = useState<RsvpStatus>('confirmed');
  const [adults, setAdults] = useState('0');
  const [children, setChildren] = useState('0');
  const [contactName, setContactName] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!payload) return;
    const payloadStatus = (payload.status as RsvpStatus) || 'pending';
    setStatus(payloadStatus === 'pending' ? 'confirmed' : payloadStatus);
    setAdults(String(payload.confirmed_adults || 0));
    setChildren(String(payload.confirmed_children || 0));
    setContactName(payload.contact_name || '');
    setNote(payload.response_note || '');
  }, [payload]);

  const maxGuests = payload?.member_count || 0;
  const currentTotal = useMemo(() => {
    const adultsCount = Math.max(0, Math.floor(Number.parseInt(adults || '0', 10) || 0));
    const childrenCount = Math.max(0, Math.floor(Number.parseInt(children || '0', 10) || 0));
    return adultsCount + childrenCount;
  }, [adults, children]);

  const handleSubmit = () => {
    if (!token) return;

    const adultsCount = Math.max(0, Math.floor(Number.parseInt(adults || '0', 10) || 0));
    const childrenCount = Math.max(0, Math.floor(Number.parseInt(children || '0', 10) || 0));

    if (status === 'confirmed' && adultsCount + childrenCount <= 0) {
      Alert.alert('Nombre invalide', 'Indique au moins 1 personne présente.');
      return;
    }

    if (maxGuests > 0 && adultsCount + childrenCount > maxGuests) {
      Alert.alert(
        'Capacité dépassée',
        `Le foyer contient ${maxGuests} personne(s). Ajuste le nombre de présents.`
      );
      return;
    }

    submitRsvp(
      {
        token,
        status,
        adults: status === 'declined' ? 0 : adultsCount,
        children: status === 'declined' ? 0 : childrenCount,
        contactName: contactName.trim() || null,
        note: note.trim() || null,
      },
      {
        onSuccess: () => {
          Alert.alert('Merci', 'Votre réponse RSVP a bien été enregistrée.');
          refetch();
        },
        onError: (error: any) => {
          Alert.alert('Erreur', error?.message || "Impossible d'enregistrer votre réponse.");
        },
      }
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement du RSVP..." />;
  }

  if (!payload) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'RSVP',
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.backgroundSecondary },
          }}
        />
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Lien RSVP invalide</Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}> 
            Ce lien est expiré ou incorrect.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}> 
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'RSVP',
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.backgroundSecondary },
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.eventTitle, { color: colors.text }]}>{payload.event_title}</Text>
          <Text style={[styles.groupTitle, { color: colors.primary }]}>{payload.group_name}</Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}> 
            Foyer invité: {payload.member_count} personne(s)
          </Text>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Votre réponse</Text>

          <View style={styles.statusGrid}>
            {STATUS_OPTIONS.map((option) => {
              const isActive = status === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setStatus(option.value)}
                  style={[
                    styles.statusOption,
                    {
                      borderColor: isActive ? colors.primary : colors.border,
                      backgroundColor: isActive ? `${colors.primary}16` : colors.background,
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.statusTitle, { color: isActive ? colors.primary : colors.text }]}> 
                    {option.label}
                  </Text>
                  <Text style={[styles.statusDescription, { color: colors.textSecondary }]}> 
                    {option.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {status !== 'declined' && (
            <>
              <Input
                label="Adultes présents"
                value={adults}
                onChangeText={setAdults}
                keyboardType="number-pad"
              />
              <Input
                label="Enfants présents"
                value={children}
                onChangeText={setChildren}
                keyboardType="number-pad"
              />
              <Text style={[styles.counterHint, { color: colors.textTertiary }]}> 
                Total confirmé: {currentTotal}/{maxGuests}
              </Text>
            </>
          )}

          <Input
            label="Nom du contact"
            value={contactName}
            onChangeText={setContactName}
            placeholder="Ex: Nadia Dupont"
          />

          <Input
            label="Message (optionnel)"
            value={note}
            onChangeText={setNote}
            placeholder="Allergies, horaire, etc."
            multiline
            numberOfLines={4}
            style={styles.noteInput}
          />

          <Button
            title="Envoyer ma réponse"
            onPress={handleSubmit}
            loading={isPending}
            disabled={isPending}
            fullWidth
          />
        </View>
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
    gap: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl,
  },
  heroCard: {
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.xs,
  },
  eventTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
  },
  groupTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  metaText: {
    fontSize: Layout.fontSize.sm,
  },
  sectionCard: {
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '700',
  },
  statusGrid: {
    gap: Layout.spacing.sm,
  },
  statusOption: {
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.sm,
    gap: 2,
  },
  statusTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  statusDescription: {
    fontSize: Layout.fontSize.xs,
  },
  counterHint: {
    fontSize: Layout.fontSize.xs,
    marginTop: -Layout.spacing.sm,
    marginBottom: Layout.spacing.xs,
  },
  noteInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
  },
  emptyTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    marginBottom: Layout.spacing.sm,
  },
  emptyMessage: {
    fontSize: Layout.fontSize.md,
    textAlign: 'center',
  },
});
