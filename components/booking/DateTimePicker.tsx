import { Colors } from '@/constants/Colors';
import { DayAvailability } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface DateTimePickerProps {
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  availabilityMap: Map<string, DayAvailability>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

// iOS style abbreviated days
const DAYS_OF_WEEK = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

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

  // Split days into weeks for better grid layout
  const weeks = useMemo(() => {
    const result: (number | null)[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    // Ensure last week has 7 days
    if (result.length > 0) {
      const lastWeek = result[result.length - 1];
      while (lastWeek.length < 7) {
        lastWeek.push(null);
      }
    }
    return result;
  }, [calendarDays]);

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
      {/* iOS-style calendar card */}
      <View style={styles.calendarCard}>
        {/* Month navigation - iOS style */}
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={handlePrevMonth}
            disabled={!canGoPrev}
            style={styles.navButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft
              size={22}
              color={canGoPrev ? Colors.text.secondary : Colors.gray[200]}
              strokeWidth={2.5}
            />
          </TouchableOpacity>

          <Text style={styles.monthTitle}>
            {MONTH_NAMES[month - 1]} {year}
          </Text>

          <TouchableOpacity
            onPress={handleNextMonth}
            style={styles.navButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronRight
              size={22}
              color={Colors.text.secondary}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        </View>

        {/* Day of week headers - iOS style */}
        <View style={styles.weekRow}>
          {DAYS_OF_WEEK.map((day) => (
            <View key={day} style={styles.weekDayCell}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid - iOS style rows */}
        <View style={styles.calendarGrid}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekGridRow}>
              {week.map((day, dayIndex) => {
                if (day === null) {
                  return <View key={`empty-${weekIndex}-${dayIndex}`} style={styles.dayCell} />;
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
                    style={styles.dayCell}
                    onPress={() => !isDisabled && onSelectDate(dateStr)}
                    disabled={isDisabled}
                    activeOpacity={0.6}
                  >
                    <View style={[
                      styles.dayInner,
                      isSelected && styles.dayInnerSelected,
                      isToday && !isSelected && styles.dayInnerToday,
                    ]}>
                      <Text
                        style={[
                          styles.dayText,
                          isToday && !isSelected && styles.dayTextToday,
                          isSelected && styles.dayTextSelected,
                          isDisabled && styles.dayTextDisabled,
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                    {/* Availability indicator dot */}
                    {hasSlots && !isDisabled && !isSelected && (
                      <View style={styles.availableDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Time slots removed - Day based only */}
      {selectedDate && !availabilityMap.get(selectedDate)?.isAvailable && (
        <View style={styles.noSlotsContainer}>
          <Text style={styles.noSlotsText}>
            Ce jour n'est pas disponible
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  calendarCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  navButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: -0.3,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : undefined,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekDayText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray[400],
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : undefined,
  },
  calendarGrid: {
    paddingHorizontal: 2,
  },
  weekGridRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayInner: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  dayInnerSelected: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  dayInnerToday: {
    backgroundColor: Colors.gray[100],
  },
  dayText: {
    fontSize: 17,
    fontWeight: '400',
    color: Colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : undefined,
  },
  dayTextToday: {
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  dayTextDisabled: {
    color: Colors.gray[300],
  },
  availableDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary.light,
    position: 'absolute',
    bottom: 4,
  },
  noSlotsContainer: {
    marginTop: 20,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  noSlotsText: {
    fontSize: 14,
    color: Colors.text.tertiary,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : undefined,
  },
});
