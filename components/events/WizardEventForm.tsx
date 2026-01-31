
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
            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${(currentStep / STEPS.length) * 100}%` }
                    ]}
                />
            </View>
            <Text style={styles.stepText}>
                Étape {currentStep} sur {STEPS.length}
            </Text>
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Commençons par l'essentiel ✨</Text>

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
                <Text style={styles.label}>C'est quel genre d'événement ?</Text>
                <View style={styles.typeGrid}>
                    {EVENT_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = eventType === type.value;
                        return (
                            <TouchableOpacity
                                key={type.value}
                                style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                                onPress={() => setEventType(type.value)}
                            >
                                <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
                                    <Icon size={20} color={isSelected ? Colors.white : Colors.primary.DEFAULT} />
                                </View>
                                <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
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
            <Text style={styles.stepTitle}>Quand ça se passe ? 📅</Text>
            <View style={styles.calendarContainer}>
                <CustomCalendar
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                />
            </View>
            {selectedDate && (
                <View style={styles.selectedDateBadge}>
                    <Text style={styles.selectedDateText}>
                        Date choisie : {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr })}
                    </Text>
                </View>
            )}
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Où ça se passe ? 📍</Text>

            <View style={styles.inputGroup}>
                <Input
                    label="Lieu"
                    placeholder="Ex: Salle des fêtes de Lyon"
                    value={location}
                    onChangeText={setLocation}
                    editable={!isLocationTBD}
                    style={isLocationTBD ? styles.inputDisabled : undefined}
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
                <View style={[styles.checkbox, isLocationTBD && styles.checkboxChecked]}>
                    {isLocationTBD && <Check size={14} color={Colors.white} />}
                </View>
                <Text style={styles.checkboxLabel}>Je ne sais pas encore</Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep4 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Quelques détails en plus ? 📝</Text>

            <View style={styles.inputGroup}>
                <Input
                    label="Nombre d'invités (approx.)"
                    placeholder="Ex: 50"
                    value={guestCount}
                    onChangeText={setGuestCount}
                    keyboardType="number-pad"
                    leftIcon={<Users size={18} color={Colors.gray[400]} />}
                />
            </View>

            <Text style={styles.label}>Budget envisagé</Text>
            <View style={styles.budgetRow}>
                <View style={{ flex: 1 }}>
                    <Input
                        placeholder="Min €"
                        value={budgetMin}
                        onChangeText={setBudgetMin}
                        keyboardType="decimal-pad"
                    />
                </View>
                <Text style={styles.budgetSep}>-</Text>
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
        <View style={styles.container}>
            {renderProgressBar()}

            <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
            </ScrollView>

            <View style={styles.footer}>
                {error && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <View style={styles.footerButtons}>
                    {currentStep > 1 ? (
                        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                            <ArrowLeft size={20} color={Colors.text.primary} />
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
        backgroundColor: Colors.background.secondary,
    },
    progressContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    progressBar: {
        height: 6,
        backgroundColor: Colors.gray[200],
        borderRadius: 3,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary.DEFAULT,
        borderRadius: 3,
    },
    stepText: {
        fontSize: 12,
        color: Colors.text.secondary,
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
        color: Colors.text.primary,
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text.primary,
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
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    typeCardSelected: {
        borderColor: Colors.primary.DEFAULT,
        backgroundColor: Colors.primary['50'],
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary['50'],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    iconCircleSelected: {
        backgroundColor: Colors.primary.DEFAULT,
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text.primary,
    },
    typeLabelSelected: {
        color: Colors.primary.DEFAULT,
        fontWeight: '700',
    },
    // Calendar Step
    calendarContainer: {
        marginTop: 10,
    },
    selectedDateBadge: {
        marginTop: 20,
        alignSelf: 'center',
        backgroundColor: Colors.primary['50'],
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    selectedDateText: {
        color: Colors.primary.DEFAULT,
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
        borderColor: Colors.gray[300],
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.white,
    },
    checkboxChecked: {
        borderColor: Colors.primary.DEFAULT,
        backgroundColor: Colors.primary.DEFAULT,
    },
    checkboxLabel: {
        fontSize: 15,
        color: Colors.text.primary,
    },
    inputDisabled: {
        backgroundColor: Colors.gray[100],
        color: Colors.gray[400],
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
        color: Colors.gray[400],
    },
    footer: {
        padding: 20,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.gray[100],
    },
    errorBanner: {
        backgroundColor: Colors.error['50'],
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    errorText: {
        color: Colors.error.DEFAULT,
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
        backgroundColor: Colors.gray[100],
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButton: {
        flex: 1,
        marginLeft: 16,
    },
});
