/**
 * Sélecteur de timeline et nom d'événement (Phase 10)
 * Dark Mode Support
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Calendar } from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { EventTimeline, TIMELINE_OPTIONS } from '@/types/preferences';

interface TimelineSelectorProps {
  eventName: string;
  onEventNameChange: (name: string) => void;
  selectedTimeline: EventTimeline | null;
  onTimelineSelect: (timeline: EventTimeline) => void;
  eventDate: Date | null;
  onDateChange: (date: Date | null) => void;
}

export function TimelineSelector({
  eventName,
  onEventNameChange,
  selectedTimeline,
  onTimelineSelect,
  eventDate,
  onDateChange,
}: TimelineSelectorProps) {
  const colors = useColors();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const showDateInput = selectedTimeline && selectedTimeline !== 'just_looking';

  const handleDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-BE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* Event Name Input */}
      <Animated.View
        entering={FadeInDown.delay(0).duration(260)}
        style={styles.section}
      >
        <Text style={[styles.label, { color: colors.text }]}>
          Donne un petit nom à ton événement
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: isFocused ? colors.primary : colors.border,
              color: colors.text,
            },
          ]}
          value={eventName}
          onChangeText={onEventNameChange}
          placeholder="Ex: Mariage de Sophie & Thomas"
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </Animated.View>

      {/* Timeline Options */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(260)}
        style={styles.section}
      >
        <Text style={[styles.label, { color: colors.text }]}>
          C'est pour quand ?
        </Text>
        <View style={styles.optionsContainer}>
          {TIMELINE_OPTIONS.map((option, index) => (
            <TimelineOption
              key={option.value}
              option={option}
              isSelected={selectedTimeline === option.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onTimelineSelect(option.value);
              }}
              colors={colors}
            />
          ))}
        </View>
      </Animated.View>

      {/* Date Picker */}
      {showDateInput && (
        <Animated.View
          entering={FadeInDown.delay(200).duration(260)}
          style={styles.section}
        >
          <Text style={[styles.label, { color: colors.text }]}>
            Date prévue (optionnel)
          </Text>
          <Pressable
            style={[
              styles.dateButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color={colors.primary} />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {eventDate ? formatDate(eventDate) : 'Sélectionner une date'}
            </Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={eventDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
              locale="fr-BE"
            />
          )}
        </Animated.View>
      )}
    </View>
  );
}

interface TimelineOptionProps {
  option: (typeof TIMELINE_OPTIONS)[number];
  isSelected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}

function TimelineOption({
  option,
  isSelected,
  onPress,
  colors,
}: TimelineOptionProps) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: withTiming(
        isSelected ? colors.primary : colors.border,
        { duration: 180 }
      ),
    };
  }, [isSelected, colors]);

  return (
    <Pressable onPress={onPress} style={styles.optionWrapper}>
      <Animated.View
        style={[
          styles.option,
          animatedStyle,
          {
            backgroundColor: isSelected ? `${colors.primary}15` : colors.card,
          },
        ]}
      >
        <Text style={styles.optionEmoji}>{option.emoji}</Text>
        <Text
          style={[
            styles.optionLabel,
            { color: isSelected ? colors.primary : colors.text },
          ]}
        >
          {option.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.spacing.lg,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  label: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  input: {
    borderWidth: 2,
    borderRadius: Layout.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: Layout.fontSize.md,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionWrapper: {
    width: '48%',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: Layout.radius.lg,
    borderWidth: 2,
  },
  optionEmoji: {
    fontSize: 20,
  },
  optionLabel: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderRadius: Layout.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateText: {
    fontSize: Layout.fontSize.md,
  },
});
