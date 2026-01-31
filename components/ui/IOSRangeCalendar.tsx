import { Colors } from '@/constants/Colors';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface IOSRangeCalendarProps {
    startDate: string | null;
    endDate: string | null;
    onRangeSelect: (start: string, end: string | null) => void;
    minDate?: string;
}

const DAYS_OF_WEEK = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export function IOSRangeCalendar({
    startDate,
    endDate,
    onRangeSelect,
    minDate = new Date().toISOString().split('T')[0],
}: IOSRangeCalendarProps) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth - 1, 1);
        const lastDay = new Date(currentYear, currentMonth, 0);
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
    }, [currentYear, currentMonth]);

    const weeks = useMemo(() => {
        const result: (number | null)[][] = [];
        for (let i = 0; i < calendarDays.length; i += 7) {
            result.push(calendarDays.slice(i, i + 7));
        }
        if (result.length > 0) {
            const lastWeek = result[result.length - 1];
            while (lastWeek.length < 7) {
                lastWeek.push(null);
            }
        }
        return result;
    }, [calendarDays]);

    const handlePrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear((prev) => prev - 1);
        } else {
            setCurrentMonth((prev) => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear((prev) => prev + 1);
        } else {
            setCurrentMonth((prev) => prev + 1);
        }
    };

    const handleDayPress = (dateStr: string) => {
        if (!startDate || (startDate && endDate)) {
            // Start new selection
            onRangeSelect(dateStr, null);
        } else if (startDate && !endDate) {
            // End selection
            if (dateStr < startDate) {
                // If selected date is before start date, swap
                onRangeSelect(dateStr, startDate);
            } else {
                onRangeSelect(startDate, dateStr);
            }
        }
    };

    const canGoPrev = currentYear > today.getFullYear() ||
        (currentYear === today.getFullYear() && currentMonth > today.getMonth() + 1);

    return (
        <View style={styles.container}>
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
                    {MONTH_NAMES[currentMonth - 1]} {currentYear}
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

            <View style={styles.weekRow}>
                {DAYS_OF_WEEK.map((day) => (
                    <View key={day} style={styles.weekDayCell}>
                        <Text style={styles.weekDayText}>{day}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.calendarGrid}>
                {weeks.map((week, weekIndex) => (
                    <View key={weekIndex} style={styles.weekGridRow}>
                        {week.map((day, dayIndex) => {
                            if (day === null) {
                                return <View key={`empty-${weekIndex}-${dayIndex}`} style={styles.dayCell} />;
                            }

                            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isPast = dateStr < minDate;
                            const isToday = dateStr === todayStr;

                            const isStart = dateStr === startDate;
                            const isEnd = dateStr === endDate;
                            const isSelected = isStart || isEnd;
                            const isInRange = startDate && endDate && dateStr > startDate && dateStr < endDate;

                            return (
                                <TouchableOpacity
                                    key={dateStr}
                                    style={styles.dayCell}
                                    onPress={() => !isPast && handleDayPress(dateStr)}
                                    disabled={isPast}
                                    activeOpacity={0.7}
                                >
                                    {/* Connectivity lines for range */}
                                    {isInRange && <View style={styles.rangeBackground} />}
                                    {isStart && endDate && <View style={styles.rangeStartBackground} />}
                                    {isEnd && startDate && <View style={styles.rangeEndBackground} />}

                                    <View style={[
                                        styles.dayInner,
                                        isSelected && styles.dayInnerSelected,
                                        isInRange && styles.dayInnerRange,
                                        isToday && !isSelected && !isInRange && styles.dayInnerToday,
                                    ]}>
                                        <Text
                                            style={[
                                                styles.dayText,
                                                isToday && !isSelected && !isInRange && styles.dayTextToday,
                                                isSelected && styles.dayTextSelected,
                                                isInRange && styles.dayTextRange,
                                                isPast && styles.dayTextDisabled,
                                            ]}
                                        >
                                            {day}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
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
    // Range backgrounds
    rangeBackground: {
        position: 'absolute',
        left: -1,
        right: -1,
        top: 2, // Adjusted vertically
        bottom: 2,
        backgroundColor: Colors.primary.light + '40', // Very light transparency
    },
    rangeStartBackground: {
        position: 'absolute',
        left: '50%',
        right: -1,
        top: 2,
        bottom: 2,
        backgroundColor: Colors.primary.light + '40',
        borderTopLeftRadius: 18,
        borderBottomLeftRadius: 18,
    },
    rangeEndBackground: {
        position: 'absolute',
        left: -1,
        right: '50%',
        top: 2,
        bottom: 2,
        backgroundColor: Colors.primary.light + '40',
        borderTopRightRadius: 18,
        borderBottomRightRadius: 18,
    },
    dayInner: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
        zIndex: 2,
    },
    dayInnerSelected: {
        backgroundColor: Colors.primary.DEFAULT,
    },
    dayInnerRange: {
        // Transparent, background is handled by rangeBackground
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
    dayTextRange: {
        color: Colors.primary.DEFAULT,
        fontWeight: '500',
    },
    dayTextDisabled: {
        color: Colors.gray[300],
    },
});
