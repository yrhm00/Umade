import React, { useState, useMemo } from 'react';
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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useProviderDetail } from '@/hooks/useProviders';
import { useUserEvents } from '@/hooks/useEvents';
import { useProviderAvailability } from '@/hooks/useAvailability';
import { useCreateBooking } from '@/hooks/useBookings';
import { ServiceSelector } from '@/components/booking/ServiceSelector';
import { DateTimePicker } from '@/components/booking/DateTimePicker';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Service, Event } from '@/types';

type BookingStep = 'service' | 'datetime' | 'event' | 'notes' | 'confirm';

const STEPS: BookingStep[] = ['service', 'datetime', 'event', 'notes', 'confirm'];

const STEP_TITLES: Record<BookingStep, string> = {
  service: 'Choisir un service',
  datetime: 'Date et heure',
  event: 'Lier à un événement',
  notes: 'Message',
  confirm: 'Confirmation',
};

export default function BookingFlowScreen() {
  const router = useRouter();
  const { providerId } = useLocalSearchParams<{ providerId: string }>();

  const { data: provider, isLoading: providerLoading } =
    useProviderDetail(providerId);
  const { data: events } = useUserEvents();
  const { mutate: createBooking, isPending: isCreating } = useCreateBooking();

  // Step state
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const currentStepIndex = STEPS.indexOf(currentStep);

  // Form state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [clientMessage, setClientMessage] = useState('');

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);

  const { data: availabilityMap } = useProviderAvailability(
    providerId,
    calYear,
    calMonth
  );

  const selectedEvent = useMemo(
    () => events?.find((e) => e.id === selectedEventId),
    [events, selectedEventId]
  );

  // Navigation
  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 'service':
        return !!selectedService;
      case 'datetime':
        return !!selectedDate && !!selectedSlot;
      case 'event':
        return true; // optional
      case 'notes':
        return true; // optional
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    } else {
      router.back();
    }
  };

  const handleConfirm = () => {
    if (!selectedService || !selectedDate || !selectedSlot || !providerId) return;

    createBooking(
      {
        provider_id: providerId,
        service_id: selectedService.id,
        event_id: selectedEventId || undefined,
        booking_date: selectedDate,
        start_time: selectedSlot,
        total_price: selectedService.price,
        client_message: clientMessage.trim() || undefined,
      } as any,
      {
        onSuccess: () => {
          Alert.alert(
            'Réservation envoyée',
            'Votre demande de réservation a été envoyée au prestataire. Vous recevrez une confirmation.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(tabs)/events'),
              },
            ]
          );
        },
        onError: (error) => {
          Alert.alert(
            'Erreur',
            error.message || 'Impossible de créer la réservation'
          );
        },
      }
    );
  };

  if (providerLoading) {
    return <LoadingSpinner fullScreen message="Chargement..." />;
  }

  if (!provider) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Prestataire non trouvé</Text>
          <Button title="Retour" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const services = (provider.services || []).filter(
    (s) => s.is_active !== false
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: provider.business_name,
          headerTintColor: Colors.text.primary,
          headerStyle: { backgroundColor: Colors.background.secondary },
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          {STEPS.map((step, index) => (
            <View
              key={step}
              style={[
                styles.progressDot,
                index <= currentStepIndex && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {/* Step title */}
        <Text style={styles.stepTitle}>{STEP_TITLES[currentStep]}</Text>
        <Text style={styles.stepSubtitle}>
          Étape {currentStepIndex + 1} sur {STEPS.length}
        </Text>

        {/* Step content */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.stepContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {currentStep === 'service' && (
              <ServiceSelector
                services={services}
                selectedId={selectedService?.id || null}
                onSelect={setSelectedService}
              />
            )}

            {currentStep === 'datetime' && (
              <DateTimePicker
                year={calYear}
                month={calMonth}
                onMonthChange={(y, m) => {
                  setCalYear(y);
                  setCalMonth(m);
                }}
                availabilityMap={availabilityMap || new Map()}
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setSelectedSlot(null);
                }}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
              />
            )}

            {currentStep === 'event' && (
              <View style={styles.eventStep}>
                <TouchableOpacity
                  style={[
                    styles.eventOption,
                    !selectedEventId && styles.eventOptionSelected,
                  ]}
                  onPress={() => setSelectedEventId(null)}
                >
                  <Text
                    style={[
                      styles.eventOptionText,
                      !selectedEventId && styles.eventOptionTextSelected,
                    ]}
                  >
                    Sans événement
                  </Text>
                  <Text style={styles.eventOptionDesc}>
                    Réservation indépendante
                  </Text>
                </TouchableOpacity>

                {events && events.length > 0 && (
                  <>
                    <Text style={styles.eventSectionLabel}>
                      Ou lier à un événement existant :
                    </Text>
                    {events
                      .filter((e) => new Date(e.event_date) >= new Date())
                      .map((event) => (
                        <TouchableOpacity
                          key={event.id}
                          style={[
                            styles.eventOption,
                            selectedEventId === event.id &&
                              styles.eventOptionSelected,
                          ]}
                          onPress={() => setSelectedEventId(event.id)}
                        >
                          <Text
                            style={[
                              styles.eventOptionText,
                              selectedEventId === event.id &&
                                styles.eventOptionTextSelected,
                            ]}
                          >
                            {event.title}
                          </Text>
                          <Text style={styles.eventOptionDesc}>
                            {new Date(event.event_date).toLocaleDateString(
                              'fr-BE',
                              {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              }
                            )}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </>
                )}
              </View>
            )}

            {currentStep === 'notes' && (
              <View style={styles.notesStep}>
                <Input
                  label="Message pour le prestataire (optionnel)"
                  placeholder="Ex: Merci de prévoir 2h de shooting en extérieur..."
                  value={clientMessage}
                  onChangeText={setClientMessage}
                  multiline
                  numberOfLines={4}
                  style={styles.notesInput}
                />
              </View>
            )}

            {currentStep === 'confirm' && selectedService && selectedDate && (
              <BookingConfirmation
                providerName={provider.business_name}
                service={selectedService}
                date={selectedDate}
                time={selectedSlot}
                eventTitle={selectedEvent?.title}
                notes={clientMessage || undefined}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom navigation */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <ArrowLeft size={20} color={Colors.text.secondary} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>

          {currentStep === 'confirm' ? (
            <Button
              title="Confirmer la réservation"
              onPress={handleConfirm}
              loading={isCreating}
              disabled={isCreating}
              size="lg"
              icon={<Check size={20} color={Colors.white} />}
              style={styles.confirmButton}
            />
          ) : (
            <Button
              title="Suivant"
              onPress={goNext}
              disabled={!canGoNext()}
              size="md"
              icon={<ArrowRight size={18} color={Colors.white} />}
              iconPosition="right"
            />
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
    gap: Layout.spacing.lg,
  },
  errorText: {
    fontSize: Layout.fontSize.lg,
    color: Colors.text.secondary,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[200],
  },
  progressDotActive: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  stepTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    paddingHorizontal: Layout.spacing.lg,
  },
  stepSubtitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.tertiary,
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  stepContent: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  // Event step
  eventStep: {
    gap: Layout.spacing.sm,
  },
  eventOption: {
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.md,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    padding: Layout.spacing.md,
  },
  eventOptionSelected: {
    borderColor: Colors.primary.DEFAULT,
    backgroundColor: Colors.primary[50],
  },
  eventOptionText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  eventOptionTextSelected: {
    color: Colors.primary.DEFAULT,
  },
  eventOptionDesc: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Layout.spacing.xs,
  },
  eventSectionLabel: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.text.secondary,
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.xs,
  },
  // Notes step
  notesStep: {
    flex: 1,
  },
  notesInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: Layout.spacing.sm,
  },
  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    backgroundColor: Colors.white,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    padding: Layout.spacing.sm,
  },
  backText: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.secondary,
  },
  confirmButton: {
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
});
