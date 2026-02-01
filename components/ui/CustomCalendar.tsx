import { Colors } from '@/constants/Colors';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CustomCalendarProps {
    selectedDate: string;
    onSelectDate: (date: string) => void;
}

export function CustomCalendar({ selectedDate, onSelectDate }: CustomCalendarProps) {
    const colors = useColors();
    const isDark = useIsDarkTheme();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday

        // Adjust strict day index to start on Monday (0) to Sunday (6)
        // Native getDay: Sun=0, Mon=1, ..., Sat=6
        // Wanted: Mon=0, ..., Sun=6
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

        return { days, firstDay: adjustedFirstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentMonth);

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const handleDateSelect = (day: number) => {
        // Create date object with local time to avoid timezone shifts
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1; // 1-12

        // Format YYYY-MM-DD manually
        const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        onSelectDate(formattedDate);
    };

    const renderDays = () => {
        const dayCells = [];

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            dayCells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        // Day cells
        for (let i = 1; i <= days; i++) {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1;
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            const isToday = new Date().toDateString() === new Date(year, month - 1, i).toDateString();

            dayCells.push(
                <TouchableOpacity
                    key={i}
                    style={[
                        styles.dayCell,
                        isSelected && { backgroundColor: colors.primary },
                        !isSelected && isToday && { backgroundColor: isDark ? colors.backgroundTertiary : Colors.primary['50'] }
                    ]}
                    onPress={() => handleDateSelect(i)}
                >
                    <Text style={[
                        styles.dayText,
                        { color: colors.text },
                        isSelected && { color: Colors.white, fontWeight: 'bold' },
                        !isSelected && isToday && { color: colors.primary, fontWeight: '600' }
                    ]}>
                        {i}
                    </Text>
                </TouchableOpacity>
            );
        }

        return dayCells;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.monthTitle, { color: colors.text }]}>
                    {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                    <ChevronRight size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Days of week */}
            <View style={styles.weekDays}>
                {daysOfWeek.map((day) => (
                    <Text key={day} style={[styles.weekDayText, { color: colors.textTertiary }]}>{day}</Text>
                ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.grid}>
                {renderDays()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    navButton: {
        padding: 4,
    },
    weekDays: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    weekDayText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '500',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%', // 100% / 7
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        marginBottom: 4,
    },
    dayText: {
        fontSize: 14,
    },
});
