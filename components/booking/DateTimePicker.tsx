import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { DayAvailability } from '@/types';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface DateTimePickerProps {
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  availabilityMap: Map<string, DayAvailability>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  selectedSlot: string | null;
  onSelectSlot: (slot: string) => void;
}

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export function DateTimePicker({
  year,
  month,
  onMonthChange,
  availabilityMap,
  selectedDate,
  onSelectDate,
  selectedSlot,
  onSelectSlot,
}: DateTimePickerProps) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    // Monday = 0, Sunday = 6 (ISO week)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    return days;
  }, [year, month]);

  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  const canGoPrev = year > today.getFullYear() ||
    (year === today.getFullYear() && month > today.getMonth() + 1);

  const selectedDayAvailability = selectedDate
    ? availabilityMap.get(selectedDate)
    : null;

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.monthHeader}>
        <TouchableOpacity
          onPress={handlePrevMonth}
          disabled={!canGoPrev}
          style={[styles.navButton, !canGoPrev && styles.navButtonDisabled]}
        >
          <ChevronLeft size={24} color={canGoPrev ? Colors.text.primary : Colors.gray[300]} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[month - 1]} {year}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
          <ChevronRight size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Day of week headers */}
      <View style={styles.weekRow}>
        {DAYS_OF_WEEK.map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isPast = dateStr < todayStr;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const availability = availabilityMap.get(dateStr);
          const hasSlots = !!availability && availability.slots.length > 0;
          const isDisabled = isPast || !hasSlots;

          return (
            <TouchableOpacity
              key={dateStr}
              style={[
                styles.dayCell,
                isToday && styles.dayCellToday,
                isSelected && styles.dayCellSelected,
                isDisabled && styles.dayCellDisabled,
              ]}
              onPress={() => !isDisabled && onSelectDate(dateStr)}
              disabled={isDisabled}
            >
              <Text
                style={[
                  styles.dayText,
                  isToday && styles.dayTextToday,
                  isSelected && styles.dayTextSelected,
                  isDisabled && styles.dayTextDisabled,
                  hasSlots && !isDisabled && styles.dayTextAvailable,
                ]}
              >
                {day}
              </Text>
              {hasSlots && !isDisabled && !isSelected && (
                <View style={styles.availableDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Time slots */}
      {selectedDate && (
        <View style={styles.slotsSection}>
          <Text style={styles.slotsTitle}>Créneaux disponibles</Text>
          {selectedDayAvailability && selectedDayAvailability.slots.length > 0 ? (
            <View style={styles.slotsGrid}>
              {selectedDayAvailability.slots.map((slot) => {
                const slotKey = slot.start_time;
                const isSlotSelected = slotKey === selectedSlot;

                return (
                  <TouchableOpacity
                    key={slotKey}
                    style={[
                      styles.slotChip,
                      isSlotSelected && styles.slotChipSelected,
                    ]}
                    onPress={() => onSelectSlot(slotKey)}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        isSlotSelected && styles.slotTextSelected,
                      ]}
                    >
                      {slot.start_time.slice(0, 5)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noSlotsText}>
              Aucun créneau disponible pour cette date
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  monthTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.xs,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Layout.spacing.xs,
  },
  weekDayText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    color: Colors.text.tertiary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Layout.radius.sm,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  dayCellSelected: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.primary,
  },
  dayTextToday: {
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: Colors.gray[400],
  },
  dayTextAvailable: {
    fontWeight: '600',
  },
  availableDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.success.DEFAULT,
    position: 'absolute',
    bottom: 6,
  },
  slotsSection: {
    marginTop: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  slotsTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Layout.spacing.md,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  slotChip: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.md,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    backgroundColor: Colors.white,
  },
  slotChipSelected: {
    borderColor: Colors.primary.DEFAULT,
    backgroundColor: Colors.primary[50],
  },
  slotText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  slotTextSelected: {
    color: Colors.primary.DEFAULT,
  },
  noSlotsText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: Layout.spacing.lg,
  },
});
