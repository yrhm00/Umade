
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    ArrowLeft,
    ArrowRight,
    Briefcase,
    Calendar,
    Check,
    MapPin,
    Mic,
    MoreHorizontal,
    Music,
    PartyPopper,
    StickyNote,
    Users
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { CustomCalendar } from '@/components/ui/CustomCalendar';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { CreateEventInput } from '@/types';

interface WizardEventFormProps {
    onSubmit: (data: CreateEventInput) => void;
    isLoading?: boolean;
}

const STEPS = [
    { id: 1, title: "L'essentiel", icon: PartyPopper },
    { id: 2, title: "La Date", icon: Calendar },
    { id: 3, title: "Le Lieu", icon: MapPin },
    { id: 4, title: "Détails", icon: StickyNote },
];

const EVENT_TYPES = [
    { value: 'mariage', label: 'Mariage', icon: Users },
    { value: 'anniversaire', label: 'Anniversaire', icon: PartyPopper },
    { value: 'corporate', label: 'Corporate', icon: Briefcase },
    { value: 'soiree', label: 'Soirée', icon: Music },
    { value: 'conference', label: 'Conférence', icon: Mic },
    { value: 'autre', label: 'Autre', icon: MoreHorizontal },
];

export function WizardEventForm({ onSubmit, isLoading }: WizardEventFormProps) {
    const colors = useColors();
    const isDark = useIsDarkTheme();
    const [currentStep, setCurrentStep] = useState(1);

    // Form State
    const [title, setTitle] = useState('');
    const [eventType, setEventType] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [location, setLocation] = useState('');
    const [isLocationTBD, setIsLocationTBD] = useState(false); // To Be Determined
    const [guestCount, setGuestCount] = useState('');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');
    const [notes, setNotes] = useState('');

    const [error, setError] = useState<string | null>(null);

    const handleNext = () => {
        setError(null);

        // Validation per step
        if (currentStep === 1) {
            if (!title.trim()) {
                setError('Veuillez donner un titre à votre événement');
                return;
            }
            if (!eventType) {
                setError('Veuillez choisir un type d\'événement');
                return;
            }
        }

        if (currentStep === 2) {
            if (!selectedDate) {
                setError('Veuillez sélectionner une date');
                return;
            }
        }

        if (currentStep === 3) {
            if (!isLocationTBD && !location.trim()) {
                setError('Veuillez indiquer un lieu ou cocher "Je ne sais pas encore"');
                return;
            }
        }

        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setError(null);
        }
    };

    const handleSubmit = () => {
        const payload: CreateEventInput = {
            title: title.trim(),
            event_type: eventType,
            event_date: selectedDate, // CustomCalendar returns YYYY-MM-DD
        };

        // Add optional fields
        if (isLocationTBD) {
            payload.location = "À définir";
        } else if (location.trim()) {
            payload.location = location.trim();
        }

        if (guestCount) payload.guest_count = parseInt(guestCount);
        if (budgetMin) payload.budget_min = parseFloat(budgetMin);
        if (budgetMax) payload.budget_max = parseFloat(budgetMax);
        if (notes.trim()) payload.notes = notes.trim();

        onSubmit(payload);
    };

    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${(currentStep / STEPS.length) * 100}%`, backgroundColor: colors.primary }
                    ]}
                />
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                Étape {currentStep} sur {STEPS.length}
            </Text>
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Commençons par l'essentiel ✨</Text>

            <View style={styles.inputGroup}>
                <Input
                    label="Titre de l'événement"
                    placeholder="Ex: 30 ans de Sarah"
                    value={title}
                    onChangeText={setTitle}
                    autoFocus
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>C'est quel genre d'événement ?</Text>
                <View style={styles.typeGrid}>
                    {EVENT_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = eventType === type.value;
                        return (
                            <TouchableOpacity
                                key={type.value}
                                style={[
                                    styles.typeCard,
                                    { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' },
                                    isSelected && { borderColor: colors.primary, backgroundColor: isDark ? colors.backgroundTertiary : Colors.primary['50'] }
                                ]}
                                onPress={() => setEventType(type.value)}
                            >
                                <View style={[
                                    styles.iconCircle,
                                    { backgroundColor: isDark ? colors.backgroundTertiary : Colors.primary['50'] },
                                    isSelected && { backgroundColor: colors.primary }
                                ]}>
                                    <Icon size={20} color={isSelected ? Colors.white : colors.primary} />
                                </View>
                                <Text style={[
                                    styles.typeLabel,
                                    { color: colors.text },
                                    isSelected && { color: colors.primary, fontWeight: '700' }
                                ]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Quand ça se passe ? 📅</Text>
            <View style={styles.calendarContainer}>
                <CustomCalendar
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                />
            </View>
            {selectedDate && (
                <View style={[styles.selectedDateBadge, { backgroundColor: isDark ? colors.backgroundTertiary : Colors.primary['50'] }]}>
                    <Text style={[styles.selectedDateText, { color: colors.primary }]}>
                        Date choisie : {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr })}
                    </Text>
                </View>
            )}
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Où ça se passe ? 📍</Text>

            <View style={styles.inputGroup}>
                <Input
                    label="Lieu"
                    placeholder="Ex: Salle des fêtes de Lyon"
                    value={location}
                    onChangeText={setLocation}
                    editable={!isLocationTBD}
                    style={isLocationTBD ? [styles.inputDisabled, { backgroundColor: colors.backgroundTertiary, color: colors.textTertiary }] : undefined}
                />
            </View>

            <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => {
                    const newValue = !isLocationTBD;
                    setIsLocationTBD(newValue);
                    if (newValue) setLocation('');
                }}
            >
                <View style={[
                    styles.checkbox,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    isLocationTBD && { borderColor: colors.primary, backgroundColor: colors.primary }
                ]}>
                    {isLocationTBD && <Check size={14} color={Colors.white} />}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>Je ne sais pas encore</Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep4 = () => (
        <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Quelques détails en plus ? 📝</Text>

            <View style={styles.inputGroup}>
                <Input
                    label="Nombre d'invités (approx.)"
                    placeholder="Ex: 50"
                    value={guestCount}
                    onChangeText={setGuestCount}
                    keyboardType="number-pad"
                    leftIcon={<Users size={18} color={colors.textTertiary} />}
                />
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Budget envisagé</Text>
            <View style={styles.budgetRow}>
                <View style={{ flex: 1 }}>
                    <Input
                        placeholder="Min €"
                        value={budgetMin}
                        onChangeText={setBudgetMin}
                        keyboardType="decimal-pad"
                    />
                </View>
                <Text style={[styles.budgetSep, { color: colors.textTertiary }]}>-</Text>
                <View style={{ flex: 1 }}>
                    <Input
                        placeholder="Max €"
                        value={budgetMax}
                        onChangeText={setBudgetMax}
                        keyboardType="decimal-pad"
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Input
                    label="Notes"
                    placeholder="Précisions pour les prestataires..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={4}
                    style={{ height: 100, textAlignVertical: 'top' }}
                />
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            {renderProgressBar()}

            <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                {error && (
                    <View style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : Colors.error['50'] }]}>
                        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                    </View>
                )}

                <View style={styles.footerButtons}>
                    {currentStep > 1 ? (
                        <TouchableOpacity
                            style={[styles.backButton, { backgroundColor: colors.backgroundTertiary }]}
                            onPress={handleBack}
                        >
                            <ArrowLeft size={20} color={colors.text} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 44 }} /> // Spacer to keep layout balanced
                    )}

                    <Button
                        title={currentStep === 4 ? "Créer l'événement" : "Continuer"}
                        onPress={handleNext}
                        loading={isLoading}
                        style={styles.nextButton}
                        icon={currentStep < 4 ? <ArrowRight size={20} color={Colors.white} /> : undefined}
                        iconPosition="right"
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    progressContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    stepText: {
        fontSize: 12,
        textAlign: 'right',
    },
    scrollContent: {
        flex: 1,
    },
    scrollInner: {
        padding: 20,
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 10,
    },
    // Type Grid
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    typeCard: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    // Calendar Step
    calendarContainer: {
        marginTop: 10,
    },
    selectedDateBadge: {
        marginTop: 20,
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    selectedDateText: {
        fontWeight: '600',
    },
    // Location Step
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxLabel: {
        fontSize: 15,
    },
    inputDisabled: {
        // styles handled dynamically
    },
    // Budget & Footer
    budgetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    budgetSep: {
        marginHorizontal: 10,
        fontSize: 20,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
    errorBanner: {
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    errorText: {
        fontSize: 13,
    },
    footerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButton: {
        flex: 1,
        marginLeft: 16,
    },
});
