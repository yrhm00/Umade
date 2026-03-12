/**
 * Booking Flow Screen
 * Dark Mode Support
 */

import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { DateTimePicker } from '@/components/booking/DateTimePicker';
import { ServiceSelector } from '@/components/booking/ServiceSelector';
import {
  ElegantCelebrationOverlay,
  ElegantCelebrationOverlayRef,
} from '@/components/celebrations/ElegantCelebrationOverlay';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useProviderAvailability } from '@/hooks/useAvailability';
import { useCreateBooking } from '@/hooks/useBookings';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useUserEvents } from '@/hooks/useEvents';
import { useProviderDetail } from '@/hooks/useProviders';
import { AppHaptics } from '@/lib/haptics';
import { Service } from '@/types';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, CalendarCheck2, Check } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { toast } from '@/lib/toast';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';

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
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const { providerId } = useLocalSearchParams<{ providerId: string }>();

  const { data: provider, isLoading: providerLoading } =
    useProviderDetail(providerId);
  const { data: events } = useUserEvents();
  const { mutate: createBooking, isPending: isCreating } = useCreateBooking();

  // Celebration
  const celebrationRef = useRef<ElegantCelebrationOverlayRef>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Step state
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const currentStepIndex = STEPS.indexOf(currentStep);

  // Form state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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
        return !!selectedDate;
      case 'event':
        return true;
      case 'notes':
        return true;
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
      goBackOrFallback(router);
    }
  };

  const handleConfirm = () => {
    if (!selectedService || !selectedDate || !providerId) return;

    createBooking(
      {
        provider_id: providerId,
        service_id: selectedService.id,
        event_id: selectedEventId || undefined,
        booking_date: selectedDate,
        total_price: selectedService.price,
        client_message: clientMessage.trim() || undefined,
      } as any,
      {
        onSuccess: () => {
          celebrationRef.current?.fire();
          AppHaptics.celebration();
          setTimeout(() => setShowSuccess(true), 400);
        },
        onError: (error) => {
          toast.error(error.message || 'Impossible de créer la réservation');
        },
      }
    );
  };

  if (providerLoading) {
    return <LoadingSpinner fullScreen message="Chargement..." />;
  }

  if (!provider) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Prestataire non trouvé</Text>
          <Button title="Retour" onPress={() => goBackOrFallback(router)} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const services = (provider.services || []).filter(
    (s) => s.is_active !== false
  );

  const eventOptionBg = isDark ? colors.card : Colors.white;
  const eventOptionSelectedBg = isDark ? colors.backgroundTertiary : `${colors.primary}10`;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: provider.business_name,
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.backgroundSecondary },
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          {STEPS.map((step, index) => (
            <View
              key={step}
              style={[
                styles.progressDot,
                { backgroundColor: colors.border },
                index <= currentStepIndex && { backgroundColor: colors.primary },
              ]}
            />
          ))}
        </View>

        {/* Step title */}
        <Text style={[styles.stepTitle, { color: colors.text }]}>{STEP_TITLES[currentStep]}</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textTertiary }]}>
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
                }}
              />
            )}

            {currentStep === 'event' && (
              <View style={styles.eventStep}>
                <TouchableOpacity
                  style={[
                    styles.eventOption,
                    { backgroundColor: eventOptionBg, borderColor: colors.border },
                    !selectedEventId && { borderColor: colors.primary, backgroundColor: eventOptionSelectedBg },
                  ]}
                  onPress={() => setSelectedEventId(null)}
                >
                  <Text
                    style={[
                      styles.eventOptionText,
                      { color: colors.text },
                      !selectedEventId && { color: colors.primary },
                    ]}
                  >
                    Sans événement
                  </Text>
                  <Text style={[styles.eventOptionDesc, { color: colors.textSecondary }]}>
                    Réservation indépendante
                  </Text>
                </TouchableOpacity>

                {events && events.length > 0 && (
                  <>
                    <Text style={[styles.eventSectionLabel, { color: colors.textSecondary }]}>
                      Ou lier à un événement existant :
                    </Text>
                    {events
                      .filter((e) => new Date(e.event_date) >= new Date())
                      .map((event) => (
                        <TouchableOpacity
                          key={event.id}
                          style={[
                            styles.eventOption,
                            { backgroundColor: eventOptionBg, borderColor: colors.border },
                            selectedEventId === event.id && { borderColor: colors.primary, backgroundColor: eventOptionSelectedBg },
                          ]}
                          onPress={() => setSelectedEventId(event.id)}
                        >
                          <Text
                            style={[
                              styles.eventOptionText,
                              { color: colors.text },
                              selectedEventId === event.id && { color: colors.primary },
                            ]}
                          >
                            {event.title}
                          </Text>
                          <Text style={[styles.eventOptionDesc, { color: colors.textSecondary }]}>
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
                time={null}
                eventTitle={selectedEvent?.title}
                notes={clientMessage || undefined}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom navigation */}
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <ArrowLeft size={20} color={colors.textSecondary} />
            <Text style={[styles.backText, { color: colors.textSecondary }]}>Retour</Text>
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

      {/* Celebration overlay */}
      <ElegantCelebrationOverlay ref={celebrationRef} />

      {/* Success sheet */}
      {showSuccess && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[StyleSheet.absoluteFill, styles.successOverlay]}
        >
          <Pressable style={styles.successBackdrop} onPress={() => { setShowSuccess(false); router.replace('/(tabs)/events'); }} />
          <Animated.View
            entering={FadeInUp.delay(100).springify().damping(18)}
            style={[styles.successSheet, { backgroundColor: colors.card }]}
          >
            <View style={[styles.successIconCircle, { backgroundColor: `${colors.primary}15` }]}>
              <CalendarCheck2 size={40} color={colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: colors.text }]}>
              Réservation envoyée !
            </Text>
            <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
              Votre demande pour{' '}
              <Text style={{ fontWeight: '600', color: colors.text }}>
                {selectedService?.name}
              </Text>
              {' '}chez{' '}
              <Text style={{ fontWeight: '600', color: colors.text }}>
                {provider?.business_name}
              </Text>
              {selectedDate && (
                <>
                  {' '}le{' '}
                  <Text style={{ fontWeight: '600', color: colors.text }}>
                    {new Date(selectedDate).toLocaleDateString('fr-BE', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </Text>
                </>
              )}
              {' '}a été envoyée. Vous recevrez une confirmation.
            </Text>
            <Button
              title="Voir mes événements"
              onPress={() => {
                setShowSuccess(false);
                router.replace('/(tabs)/events');
              }}
              size="lg"
              style={styles.successButton}
            />
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
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
  },
  stepTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    paddingHorizontal: Layout.spacing.lg,
  },
  stepSubtitle: {
    fontSize: Layout.fontSize.sm,
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  stepContent: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  eventStep: {
    gap: Layout.spacing.sm,
  },
  eventOption: {
    borderRadius: Layout.radius.md,
    borderWidth: 1.5,
    padding: Layout.spacing.md,
  },
  eventOptionText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  eventOptionDesc: {
    fontSize: Layout.fontSize.sm,
    marginTop: Layout.spacing.xs,
  },
  eventSectionLabel: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.xs,
  },
  notesStep: {
    flex: 1,
  },
  notesInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: Layout.spacing.sm,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderTopWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    padding: Layout.spacing.sm,
  },
  backText: {
    fontSize: Layout.fontSize.md,
  },
  confirmButton: {
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
  // Success overlay
  successOverlay: {
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  successBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  successSheet: {
    borderTopLeftRadius: Layout.radius.xl,
    borderTopRightRadius: Layout.radius.xl,
    padding: Layout.spacing.xl,
    paddingBottom: Layout.spacing.xxl,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  successTitle: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    marginBottom: Layout.spacing.sm,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: Layout.fontSize.md,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
  },
  successButton: {
    width: '100%',
  },
});
