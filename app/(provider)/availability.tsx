/**
 * Page de gestion des disponibilités pour le provider
 */

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Check, ChevronRight, Clock, Moon, Sun } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AVAILABILITY_STORAGE_KEY = '@umade_provider_availability';

interface DaySchedule {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
    breakStart?: string;
    breakEnd?: string;
}

interface WeekSchedule {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

type DayKey = keyof WeekSchedule;

const DAYS: { key: DayKey; label: string; shortLabel: string }[] = [
    { key: 'monday', label: 'Lundi', shortLabel: 'Lun' },
    { key: 'tuesday', label: 'Mardi', shortLabel: 'Mar' },
    { key: 'wednesday', label: 'Mercredi', shortLabel: 'Mer' },
    { key: 'thursday', label: 'Jeudi', shortLabel: 'Jeu' },
    { key: 'friday', label: 'Vendredi', shortLabel: 'Ven' },
    { key: 'saturday', label: 'Samedi', shortLabel: 'Sam' },
    { key: 'sunday', label: 'Dimanche', shortLabel: 'Dim' },
];

const TIME_SLOTS = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
];

const DEFAULT_SCHEDULE: DaySchedule = {
    isOpen: true,
    openTime: '09:00',
    closeTime: '18:00',
};

const DEFAULT_WEEK: WeekSchedule = {
    monday: { ...DEFAULT_SCHEDULE },
    tuesday: { ...DEFAULT_SCHEDULE },
    wednesday: { ...DEFAULT_SCHEDULE },
    thursday: { ...DEFAULT_SCHEDULE },
    friday: { ...DEFAULT_SCHEDULE },
    saturday: { isOpen: true, openTime: '09:00', closeTime: '13:00' },
    sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
};

export default function ProviderAvailabilityScreen() {
    const router = useRouter();
    const { userId } = useAuth();
    const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_WEEK);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);
    const [showTimePicker, setShowTimePicker] = useState<'openTime' | 'closeTime' | null>(null);

    useEffect(() => {
        loadSchedule();
    }, [userId]);

    const loadSchedule = async () => {
        try {
            const stored = await AsyncStorage.getItem(`${AVAILABILITY_STORAGE_KEY}_${userId}`);
            if (stored) {
                setSchedule(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading schedule:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveSchedule = async () => {
        setIsSaving(true);
        try {
            // 1. Save locally for UI persistence
            await AsyncStorage.setItem(
                `${AVAILABILITY_STORAGE_KEY}_${userId}`,
                JSON.stringify(schedule)
            );

            // 2. Sync to Supabase for Client visibility
            if (!userId) throw new Error('No user ID');

            // Get provider ID
            const { data: provider } = await supabase
                .from('providers')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (!provider) throw new Error('Provider not found');

            // Generate slots for the next 3 months
            const slots = generateAvailabilitySlots(provider.id, schedule);

            // Delete future availabilities to overwrite with new schedule
            // We keep past data for history, but overwrite from tomorrow onwards
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            const { error: deleteError } = await supabase
                .from('availabilities')
                .delete()
                .eq('provider_id', provider.id)
                .gte('date', tomorrowStr);

            if (deleteError) throw deleteError;

            // Insert new slots in batches (Supabase has limit)
            const BATCH_SIZE = 100;
            for (let i = 0; i < slots.length; i += BATCH_SIZE) {
                const batch = slots.slice(i, i + BATCH_SIZE);
                const { error: insertError } = await supabase
                    .from('availabilities')
                    .insert(batch);

                if (insertError) throw insertError;
            }

            Alert.alert('Succès', 'Vos disponibilités ont été enregistrées et sont maintenant visibles pour les clients.', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (error) {
            console.error('Error saving schedule:', error);
            Alert.alert('Erreur', 'Impossible de sauvegarder les disponibilités dans la base de données.');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to generate slots
    const generateAvailabilitySlots = (providerId: string, currentSchedule: WeekSchedule) => {
        const slots: any[] = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1); // Start from tomorrow

        // Generate for 90 days (approx 3 months)
        const daysToGenerate = 90;

        for (let i = 0; i < daysToGenerate; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);

            // Get day name (lowercase for key matching)
            const dayIndex = currentDate.getDay(); // 0 = Sunday, 1 = Monday...
            let dayKey: DayKey;

            switch (dayIndex) {
                case 1: dayKey = 'monday'; break;
                case 2: dayKey = 'tuesday'; break;
                case 3: dayKey = 'wednesday'; break;
                case 4: dayKey = 'thursday'; break;
                case 5: dayKey = 'friday'; break;
                case 6: dayKey = 'saturday'; break;
                case 0: dayKey = 'sunday'; break;
                default: continue;
            }

            const dayConfig = currentSchedule[dayKey];

            if (dayConfig.isOpen && dayConfig.openTime && dayConfig.closeTime) {
                const dateStr = currentDate.toISOString().split('T')[0];

                // Generate 30min slots
                // Parse times (HH:MM)
                const [openH, openM] = dayConfig.openTime.split(':').map(Number);
                const [closeH, closeM] = dayConfig.closeTime.split(':').map(Number);

                let currentH = openH;
                let currentM = openM;

                while (currentH < closeH || (currentH === closeH && currentM < closeM)) {
                    // Start Time
                    const startStr = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;

                    // Add 30 mins
                    let nextM = currentM + 30;
                    let nextH = currentH;
                    if (nextM >= 60) {
                        nextM -= 60;
                        nextH += 1;
                    }

                    // Check if slot goes beyond closeTime
                    if (nextH > closeH || (nextH === closeH && nextM > closeM)) {
                        break;
                    }

                    const endStr = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;

                    slots.push({
                        provider_id: providerId,
                        date: dateStr,
                        start_time: startStr,
                        end_time: endStr,
                        // is_available column does not exist, existence implies availability
                    });

                    currentH = nextH;
                    currentM = nextM;
                }
            }
        }
        return slots;
    };

    const toggleDay = (day: DayKey) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: { ...prev[day], isOpen: !prev[day].isOpen },
        }));
    };

    const updateTime = (day: DayKey, field: 'openTime' | 'closeTime', value: string) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: { ...prev[day], [field]: value },
        }));
    };

    const applyToAllDays = (day: DayKey) => {
        const sourceSchedule = schedule[day];
        const newSchedule = { ...schedule };

        DAYS.forEach((d) => {
            if (d.key !== 'sunday') {
                newSchedule[d.key] = { ...sourceSchedule };
            }
        });

        setSchedule(newSchedule);
        Alert.alert('Appliqué', 'Les horaires ont été copiés sur tous les jours (sauf dimanche)');
    };

    const renderTimeSelector = (
        day: DayKey,
        field: 'openTime' | 'closeTime',
        label: string
    ) => {
        const currentValue = schedule[day][field];
        const isActive = selectedDay === day && showTimePicker === field;

        return (
            <View style={styles.timeSelector}>
                <Text style={styles.timeLabel}>{label}</Text>
                <TouchableOpacity
                    style={[styles.timeButton, isActive && styles.timeButtonActive]}
                    onPress={() => {
                        setSelectedDay(day);
                        setShowTimePicker(isActive ? null : field);
                    }}
                >
                    <Clock size={14} color={isActive ? Colors.primary.DEFAULT : Colors.gray[500]} />
                    <Text style={[styles.timeValue, isActive && styles.timeValueActive]}>
                        {currentValue}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderTimePicker = (day: DayKey, field: 'openTime' | 'closeTime') => {
        if (selectedDay !== day || showTimePicker !== field) return null;

        return (
            <View style={styles.timePickerContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.timePickerContent}
                >
                    {TIME_SLOTS.map((time) => {
                        const isSelected = schedule[day][field] === time;
                        return (
                            <TouchableOpacity
                                key={time}
                                style={[styles.timeSlot, isSelected && styles.timeSlotSelected]}
                                onPress={() => {
                                    updateTime(day, field, time);
                                    setShowTimePicker(null);
                                }}
                            >
                                <Text
                                    style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected]}
                                >
                                    {time}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    const renderDayCard = (day: { key: DayKey; label: string }) => {
        const daySchedule = schedule[day.key];
        const isWeekend = day.key === 'saturday' || day.key === 'sunday';

        return (
            <View key={day.key} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                    <View style={styles.dayInfo}>
                        <View style={[styles.dayIcon, isWeekend && styles.dayIconWeekend]}>
                            {isWeekend ? (
                                <Moon size={16} color={isWeekend ? Colors.primary.DEFAULT : Colors.gray[500]} />
                            ) : (
                                <Sun size={16} color={Colors.warning.DEFAULT} />
                            )}
                        </View>
                        <Text style={styles.dayLabel}>{day.label}</Text>
                    </View>
                    <Switch
                        value={daySchedule.isOpen}
                        onValueChange={() => toggleDay(day.key)}
                        trackColor={{ false: Colors.gray[200], true: Colors.primary.DEFAULT + '40' }}
                        thumbColor={daySchedule.isOpen ? Colors.primary.DEFAULT : Colors.gray[400]}
                    />
                </View>

                {/* Simple Status Text instead of Hours */}
                <View style={styles.statusContainer}>
                    {daySchedule.isOpen ? (
                        <Text style={styles.statusTextOpen}>Disponible</Text>
                    ) : (
                        <Text style={styles.statusTextClosed}>Fermé</Text>
                    )}
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <LoadingSpinner />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Disponibilités</Text>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveSchedule}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <LoadingSpinner size="small" />
                    ) : (
                        <Check size={24} color={Colors.primary.DEFAULT} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>📅 Vos horaires de travail</Text>
                    <Text style={styles.infoText}>
                        Définissez vos jours de travail.
                        Les clients pourront réserver sur ces journées.
                    </Text>
                </View>

                {/* Blocked Dates Link */}
                <TouchableOpacity
                    style={styles.blockedDatesLink}
                    onPress={() => router.push('/(provider)/blocked-dates')}
                >
                    <View style={styles.blockedDatesLeft}>
                        <View style={styles.blockedDatesIcon}>
                            <Calendar size={20} color={Colors.primary.DEFAULT} />
                        </View>
                        <View>
                            <Text style={styles.blockedDatesTitle}>Indisponibilités</Text>
                            <Text style={styles.blockedDatesSubtitle}>Vacances, congés, jours fériés...</Text>
                        </View>
                    </View>
                    <ChevronRight size={20} color={Colors.gray[400]} />
                </TouchableOpacity>

                {/* Days */}
                {DAYS.map((day) => renderDayCard(day))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
        backgroundColor: Colors.white,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    saveButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    infoCard: {
        backgroundColor: Colors.primary.DEFAULT + '10',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary.DEFAULT,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: Colors.text.secondary,
        lineHeight: 20,
    },
    dayCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dayInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dayIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: Colors.warning.DEFAULT + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    dayIconWeekend: {
        backgroundColor: Colors.primary.DEFAULT + '15',
    },
    dayLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    timeSelector: {
        flex: 1,
    },
    timeLabel: {
        fontSize: 12,
        color: Colors.text.secondary,
        marginBottom: 6,
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.gray[50],
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    timeButtonActive: {
        backgroundColor: Colors.primary.DEFAULT + '10',
        borderWidth: 1,
        borderColor: Colors.primary.DEFAULT,
    },
    timeValue: {
        fontSize: 15,
        fontWeight: '500',
        color: Colors.text.primary,
    },
    timeValueActive: {
        color: Colors.primary.DEFAULT,
    },
    timeSeparator: {
        paddingHorizontal: 12,
        paddingTop: 18,
    },
    timeSeparatorText: {
        fontSize: 16,
        color: Colors.gray[400],
    },
    timePickerContainer: {
        marginTop: 12,
    },
    timePickerContent: {
        paddingVertical: 8,
        gap: 8,
    },
    timeSlot: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: Colors.gray[50],
        borderRadius: 20,
        marginRight: 8,
    },
    timeSlotSelected: {
        backgroundColor: Colors.primary.DEFAULT,
    },
    timeSlotText: {
        fontSize: 14,
        color: Colors.text.primary,
    },
    timeSlotTextSelected: {
        color: Colors.white,
        fontWeight: '600',
    },
    applyButton: {
        marginTop: 12,
        alignSelf: 'flex-start',
    },
    applyButtonText: {
        fontSize: 13,
        color: Colors.primary.DEFAULT,
        fontWeight: '500',
    },
    statusContainer: {
        marginTop: 8,
        paddingLeft: 44, // Align with text (Icon 32 + Margin 12)
    },
    statusTextOpen: {
        fontSize: 14,
        color: Colors.success,
        fontWeight: '500',
    },
    statusTextClosed: {
        fontSize: 14,
        color: Colors.text.tertiary,
    },
    blockedDatesLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    blockedDatesLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    blockedDatesIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary.light + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    blockedDatesTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    blockedDatesSubtitle: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginTop: 2,
    },
});
