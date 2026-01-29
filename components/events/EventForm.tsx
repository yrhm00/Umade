import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { CreateEventInput } from '@/types';

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
        style={styles.flex}
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

        <Text style={styles.label}>Type d'événement *</Text>
        <View style={styles.typeGrid}>
          {EVENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeChip,
                eventType === type.value && styles.typeChipActive,
              ]}
              onPress={() => setEventType(type.value)}
            >
              <Text
                style={[
                  styles.typeChipText,
                  eventType === type.value && styles.typeChipTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.eventType && (
          <Text style={styles.errorText}>{errors.eventType}</Text>
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

        <Text style={styles.label}>Budget (optionnel)</Text>
        <View style={styles.budgetRow}>
          <View style={styles.budgetField}>
            <Input
              placeholder="Min €"
              value={budgetMin}
              onChangeText={setBudgetMin}
              keyboardType="decimal-pad"
            />
          </View>
          <Text style={styles.budgetSeparator}>—</Text>
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
    color: Colors.text.primary,
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
    borderColor: Colors.gray[200],
    backgroundColor: Colors.white,
  },
  typeChipActive: {
    borderColor: Colors.primary.DEFAULT,
    backgroundColor: Colors.primary[50],
  },
  typeChipText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  typeChipTextActive: {
    color: Colors.primary.DEFAULT,
  },
  errorText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.error.DEFAULT,
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
    color: Colors.text.tertiary,
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
