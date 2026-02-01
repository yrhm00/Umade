import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { CreateEventInput } from '@/types';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface EventFormProps {
  initialValues?: Partial<CreateEventInput>;
  onSubmit: (values: CreateEventInput) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const EVENT_TYPES = [
  { value: 'mariage', label: 'Mariage' },
  { value: 'anniversaire', label: 'Anniversaire' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'soiree', label: 'Soirée' },
  { value: 'conference', label: 'Conférence' },
  { value: 'autre', label: 'Autre' },
];

export function EventForm({
  initialValues,
  onSubmit,
  isLoading,
  submitLabel = 'Créer l\'événement',
}: EventFormProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const [title, setTitle] = useState(initialValues?.title || '');
  const [eventType, setEventType] = useState(initialValues?.event_type || '');
  const [eventDate, setEventDate] = useState(initialValues?.event_date || '');
  const [location, setLocation] = useState(initialValues?.location || '');
  const [guestCount, setGuestCount] = useState(
    initialValues?.guest_count?.toString() || ''
  );
  const [budgetMin, setBudgetMin] = useState(
    initialValues?.budget_min?.toString() || ''
  );
  const [budgetMax, setBudgetMax] = useState(
    initialValues?.budget_max?.toString() || ''
  );
  const [notes, setNotes] = useState(initialValues?.notes || '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Le titre est requis';
    }
    if (!eventType) {
      newErrors.eventType = 'Le type est requis';
    }
    if (!eventDate.trim()) {
      newErrors.eventDate = 'La date est requise';
    } else {
      // Validate date format YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(eventDate)) {
        newErrors.eventDate = 'Format: AAAA-MM-JJ';
      } else {
        const parsed = new Date(eventDate);
        if (parsed <= new Date()) {
          newErrors.eventDate = 'La date doit être dans le futur';
        }
      }
    }
    if (budgetMin && budgetMax && Number(budgetMin) > Number(budgetMax)) {
      newErrors.budgetMax = 'Le budget max doit être supérieur au min';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const input: CreateEventInput = {
      title: title.trim(),
      event_type: eventType,
      event_date: eventDate,
    };

    if (location.trim()) input.location = location.trim();
    if (guestCount) input.guest_count = parseInt(guestCount, 10);
    if (budgetMin) input.budget_min = parseFloat(budgetMin);
    if (budgetMax) input.budget_max = parseFloat(budgetMax);
    if (notes.trim()) input.notes = notes.trim();

    onSubmit(input);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.flex, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Input
          label="Titre *"
          placeholder="Ex: Mariage de Sophie et Pierre"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
        />

        <Text style={[styles.label, { color: colors.text }]}>Type d'événement *</Text>
        <View style={styles.typeGrid}>
          {EVENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeChip,
                {
                  backgroundColor: isDark ? colors.backgroundTertiary : Colors.white,
                  borderColor: isDark ? colors.border : Colors.gray[200]
                },
                eventType === type.value && {
                  borderColor: colors.primary,
                  backgroundColor: isDark ? colors.backgroundTertiary : Colors.primary[50], // Or a dark-mode specific selected BG
                },
                eventType === type.value && isDark && {
                  backgroundColor: colors.primary, // More distinct in dark mode
                  borderColor: colors.primary
                }
              ]}
              onPress={() => setEventType(type.value)}
            >
              <Text
                style={[
                  styles.typeChipText,
                  { color: colors.textSecondary },
                  eventType === type.value && { color: colors.primary },
                  eventType === type.value && isDark && { color: Colors.white }
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.eventType && (
          <Text style={[styles.errorText, { color: colors.error }]}>{errors.eventType}</Text>
        )}

        <Input
          label="Date *"
          placeholder="AAAA-MM-JJ"
          value={eventDate}
          onChangeText={setEventDate}
          error={errors.eventDate}
          keyboardType="numbers-and-punctuation"
        />

        <Input
          label="Lieu"
          placeholder="Ex: Bruxelles, Château de Modave..."
          value={location}
          onChangeText={setLocation}
        />

        <Input
          label="Nombre d'invités"
          placeholder="Ex: 150"
          value={guestCount}
          onChangeText={setGuestCount}
          keyboardType="number-pad"
        />

        <Text style={[styles.label, { color: colors.text }]}>Budget (optionnel)</Text>
        <View style={styles.budgetRow}>
          <View style={styles.budgetField}>
            <Input
              placeholder="Min €"
              value={budgetMin}
              onChangeText={setBudgetMin}
              keyboardType="decimal-pad"
            />
          </View>
          <Text style={[styles.budgetSeparator, { color: colors.textTertiary }]}>—</Text>
          <View style={styles.budgetField}>
            <Input
              placeholder="Max €"
              value={budgetMax}
              onChangeText={setBudgetMax}
              keyboardType="decimal-pad"
              error={errors.budgetMax}
            />
          </View>
        </View>

        <Input
          label="Notes"
          placeholder="Informations supplémentaires..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        <Button
          title={submitLabel}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          fullWidth
          size="lg"
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  label: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    marginBottom: Layout.spacing.xs,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  typeChip: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.full,
    borderWidth: 1.5,
  },
  typeChipText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  errorText: {
    fontSize: Layout.fontSize.xs,
    marginTop: -Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.spacing.sm,
  },
  budgetField: {
    flex: 1,
  },
  budgetSeparator: {
    fontSize: Layout.fontSize.lg,
    marginTop: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: Layout.spacing.sm,
  },
  submitButton: {
    marginTop: Layout.spacing.md,
  },
});
