/**
 * Booking Details Screen
 * Détails réservation, résumé devis/paiements et sync calendrier.
 */

import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { PaymentSummarySheet } from '@/components/booking/PaymentSummarySheet';
import { PaymentTracker } from '@/components/booking/PaymentTracker';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { useAuth } from '@/hooks/useAuth';
import {
  useBookingContract,
  useBookingCompletionConfirmation,
  useCreateBookingCheckoutSession,
  useBookingFinance,
  useBookingPayments,
  useBookingReminders,
  useCreateManualBookingReminder,
  useRecordBookingPayment,
  useSendBookingReminderNow,
  useUpsertProviderCalendarSyncSettings,
} from '@/hooks/useBookingAdvanced';
import { useBooking, useUpdateBookingStatus } from '@/hooks/useBookings';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useConversations } from '@/hooks/useConversations';
import { useConfirmBookingCompletion } from '@/hooks/useProviderPayout';
import { supabase } from '@/lib/supabase';
import {
  buildBookingDateTimes,
  buildGoogleCalendarUrl,
  buildIcsForBookings,
} from '@/lib/calendarSync';
import { goBackOrFallback } from '@/lib/navigation';
import { toast } from '@/lib/toast';
import { formatDate, formatPrice } from '@/lib/utils';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as ExpoLinking from 'expo-linking';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as WebBrowser from 'expo-web-browser';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Pencil,
  ShieldCheck,
  Wallet,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Alert,
  Linking as RNLinking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatDateTimeLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPaymentStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'deposit_pending':
      return 'Acompte attendu';
    case 'deposit_paid':
      return 'Acompte reçu';
    case 'paid':
      return 'Réglé';
    case 'cancelled':
      return 'Annulé';
    case 'refunded':
      return 'Remboursé';
    case 'unpaid':
    default:
      return 'Non payé';
  }
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export default function BookingDetailsScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const { profile, userId } = useAuth();
  const isProvider = profile?.role === 'provider';
  const { id, payment, type } = useLocalSearchParams<{
    id: string;
    payment?: 'success' | 'cancelled';
    type?: 'deposit' | 'balance';
  }>();

  const { data: booking, isLoading, refetch } = useBooking(id);
  const { mutate: updateStatus, isPending } = useUpdateBookingStatus();

  const { data: finance, refetch: refetchFinance } = useBookingFinance(id);
  const { data: payments = [], refetch: refetchPayments } = useBookingPayments(id);
  const { data: reminders = [] } = useBookingReminders(id);
  const { data: completionConfirmation, refetch: refetchCompletionConfirmation } =
    useBookingCompletionConfirmation(id);

  const { mutate: recordPayment, isPending: isRecordingPayment } = useRecordBookingPayment();
  const { mutateAsync: createCheckoutSessionAsync, isPending: isCreatingCheckout } =
    useCreateBookingCheckoutSession();
  const { mutateAsync: createManualReminderAsync, isPending: isCreatingAutoReminder } =
    useCreateManualBookingReminder();
  const { mutateAsync: sendReminderNowAsync, isPending: isSendingAutoReminder } = useSendBookingReminderNow();
  const { mutate: upsertCalendarSync, isPending: isSavingCalendarSync } =
    useUpsertProviderCalendarSyncSettings();
  const { mutate: confirmBookingCompletion, isPending: isConfirmingCompletion } =
    useConfirmBookingCompletion();
  const { data: contract, refetch: refetchContract } = useBookingContract(id);
  const { data: conversations = [] } = useConversations();
  const paymentSummaryRef = useRef<BottomSheetModal>(null);
  const autoReminderInFlightRef = useRef(false);
  const sessionAutoReminderAtRef = useRef(0);
  const paymentFeedbackKeyRef = useRef<string | null>(null);

  const hasConfiguredQuote = useMemo(() => {
    if (!finance) return false;
    return Boolean(
      (finance.quote_amount || 0) > 0 ||
      (finance.deposit_amount || 0) > 0 ||
      finance.deposit_due_date ||
      finance.balance_due_date
    );
  }, [finance]);

  const depositRemaining = useMemo(() => {
    if (!finance) return 0;
    return Math.max((finance.deposit_amount || 0) - (finance.deposit_paid_amount || 0), 0);
  }, [finance]);

  const balanceRemaining = useMemo(() => {
    if (!finance) return 0;
    return Math.max((finance.balance_amount || 0) - (finance.balance_paid_amount || 0), 0);
  }, [finance]);

  const providerDepositRemaining = useMemo(() => {
    if (!finance) return 0;
    const quoteAmount = finance.quote_amount || finance.total_price || 0;
    const targetDeposit =
      finance.deposit_amount > 0
        ? finance.deposit_amount
        : Math.round((quoteAmount * 0.3 + Number.EPSILON) * 100) / 100;
    return Math.max(targetDeposit - (finance.deposit_paid_amount || 0), 0);
  }, [finance]);

  const providerBalanceRemaining = useMemo(() => {
    if (!finance) return 0;
    const quoteAmount = finance.quote_amount || finance.total_price || 0;
    const targetDeposit =
      finance.deposit_amount > 0
        ? finance.deposit_amount
        : Math.round((quoteAmount * 0.3 + Number.EPSILON) * 100) / 100;
    const targetBalance =
      finance.balance_amount > 0
        ? finance.balance_amount
        : Math.max(quoteAmount - targetDeposit, 0);
    return Math.max(targetBalance - (finance.balance_paid_amount || 0), 0);
  }, [finance]);

  const lastSentDepositReminderAt = useMemo(() => {
    const sentTimestamps = reminders
      .filter(
        (reminder) =>
          reminder.reminder_type === 'deposit' &&
          reminder.target_role === 'client' &&
          reminder.status === 'sent'
      )
      .map((reminder) => new Date(reminder.sent_at || reminder.updated_at).getTime())
      .filter((value) => !Number.isNaN(value));

    if (!sentTimestamps.length) return null;
    return Math.max(...sentTimestamps);
  }, [reminders]);

  const shouldAutoSendDepositReminder = useMemo(() => {
    if (!id || !isProvider || !booking || !finance) return false;
    if (booking.status === 'cancelled' || booking.status === 'completed') return false;
    if (
      finance.payment_status === 'paid' ||
      finance.payment_status === 'cancelled' ||
      finance.payment_status === 'refunded'
    ) {
      return false;
    }
    if ((finance.deposit_amount || 0) <= 0 || depositRemaining <= 0) return false;

    if (finance.deposit_due_date) {
      const dueDate = new Date(`${finance.deposit_due_date}T00:00:00`);
      if (!Number.isNaN(dueDate.getTime()) && dueDate.getTime() > Date.now()) {
        return false;
      }
    }

    if (
      lastSentDepositReminderAt &&
      Date.now() - lastSentDepositReminderAt < DAY_IN_MS
    ) {
      return false;
    }

    return true;
  }, [id, isProvider, booking, finance, depositRemaining, lastSentDepositReminderAt]);

  const displayedTotalPrice = useMemo(() => {
    if (finance && finance.quote_amount > 0) {
      return finance.quote_amount;
    }
    return booking?.total_price || 0;
  }, [finance, booking?.total_price]);

  const completionRole = useMemo<'provider' | 'client' | null>(() => {
    if (!booking) return null;
    if (userId && booking.client_id === userId) return 'client';
    if (isProvider) return 'provider';
    return null;
  }, [booking, userId, isProvider]);

  const completionTotalDue = useMemo(() => {
    if (!finance) return 0;
    const quote = finance.quote_amount || finance.total_price || 0;
    return Math.max(Number(quote || 0), 0);
  }, [finance]);

  const completionTotalPaid = useMemo(() => {
    if (!finance) return 0;
    return Math.max(Number(finance.deposit_paid_amount || 0) + Number(finance.balance_paid_amount || 0), 0);
  }, [finance]);

  const isFullyPaidForCompletion = useMemo(() => {
    if (!finance) return false;
    if (finance.payment_status === 'paid') return true;
    if (completionTotalDue <= 0) return false;
    return completionTotalPaid + 0.005 >= completionTotalDue;
  }, [finance, completionTotalDue, completionTotalPaid]);

  const providerCompletionConfirmed = !!completionConfirmation?.provider_confirmed_at;
  const clientCompletionConfirmed = !!completionConfirmation?.client_confirmed_at;
  const bothCompletionConfirmed = providerCompletionConfirmed && clientCompletionConfirmed;
  const currentRoleAlreadyConfirmed =
    completionRole === 'provider'
      ? providerCompletionConfirmed
      : completionRole === 'client'
        ? clientCompletionConfirmed
        : false;

  const handleCancel = () => {
    if (!id) return;

    Alert.alert(
      'Annuler la réservation',
      'Êtes-vous sûr de vouloir annuler cette réservation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Annuler la réservation',
          style: 'destructive',
          onPress: () => {
            updateStatus(
              { bookingId: id, status: 'cancelled' },
              {
                onSuccess: () => {
                  refetch();
                  refetchFinance();
                },
                onError: (error) => toast.error(error.message),
              }
            );
          },
        },
      ]
    );
  };

  const handleConfirm = () => {
    if (!id) return;

    Alert.alert('Confirmer la réservation', 'Valider cette demande de réservation ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: () => {
          updateStatus(
            { bookingId: id, status: 'confirmed' },
            {
              onSuccess: () => {
                refetch();
                refetchFinance();
              },
              onError: (error) => Alert.alert('Erreur', error.message),
            }
          );
        },
      },
    ]);
  };

  const handleMarkDepositPaid = () => {
    if (!id || !finance) return;
    if (finance.contract_required !== false && contractStatus !== 'signed') {
      Alert.alert(
        'Signature requise',
        'Le contrat doit être signé par les 2 parties avant tout paiement.'
      );
      return;
    }

    const amount = providerDepositRemaining;

    if (amount <= 0) {
      Alert.alert('Acompte déjà réglé', "L'acompte est déjà payé.");
      return;
    }

    recordPayment(
      {
        bookingId: id,
        paymentType: 'deposit',
        amount,
        markPaid: true,
      },
      {
        onSuccess: () => {
          Alert.alert('Acompte enregistré', `${formatPrice(amount)} enregistré.`);
          refetch();
          refetchFinance();
          refetchPayments();
        },
        onError: (error) => Alert.alert('Erreur', error.message),
      }
    );
  };

  const handleMarkBalancePaid = () => {
    if (!id || !finance) return;
    if (finance.contract_required !== false && contractStatus !== 'signed') {
      Alert.alert(
        'Signature requise',
        'Le contrat doit être signé par les 2 parties avant tout paiement.'
      );
      return;
    }

    const amount = providerBalanceRemaining;

    if (amount <= 0) {
      Alert.alert('Solde déjà réglé', 'Le solde est déjà payé.');
      return;
    }

    recordPayment(
      {
        bookingId: id,
        paymentType: 'balance',
        amount,
        markPaid: true,
      },
      {
        onSuccess: () => {
          Alert.alert('Solde enregistré', `${formatPrice(amount)} enregistré.`);
          refetch();
          refetchFinance();
          refetchPayments();
        },
        onError: (error) => Alert.alert('Erreur', error.message),
      }
    );
  };

  const handlePayOnline = useCallback(
    async (paymentType: 'deposit' | 'balance') => {
      if (!id) return;

      const amount = paymentType === 'deposit' ? depositRemaining : balanceRemaining;
      if (amount <= 0) {
        Alert.alert('Paiement non requis', 'Ce montant est déjà réglé.');
        return;
      }

      try {
        const appSuccessUrl = ExpoLinking.createURL('/payment-result', {
          queryParams: {
            booking_id: id,
            payment: 'success',
            type: paymentType,
          },
        });
        const appCancelUrl = ExpoLinking.createURL('/payment-result', {
          queryParams: {
            booking_id: id,
            payment: 'cancelled',
            type: paymentType,
          },
        });

        const webReturnBase = process.env.EXPO_PUBLIC_CHECKOUT_RETURN_BASE_URL?.trim();
        const hasWebReturnBase = !!webReturnBase && /^https?:\/\//i.test(webReturnBase);
        const normalizedWebReturnBase = hasWebReturnBase ? webReturnBase.replace(/\/+$/, '') : '';
        const bridgeBase = hasWebReturnBase
          ? normalizedWebReturnBase.includes('/functions/v1/checkout-return') ||
            normalizedWebReturnBase.endsWith('.html')
            ? normalizedWebReturnBase
            : `${normalizedWebReturnBase}/payment-result`
          : null;

        const buildWebReturnUrl = (base: string, paymentStatus: 'success' | 'cancelled', appReturn: string) => {
          const separator = base.includes('?') ? '&' : '?';
          return `${base}${separator}booking_id=${encodeURIComponent(
            id
          )}&payment=${paymentStatus}&type=${paymentType}&app_return=${encodeURIComponent(appReturn)}`;
        };

        const successUrl = bridgeBase
          ? buildWebReturnUrl(bridgeBase, 'success', appSuccessUrl)
          : appSuccessUrl;
        const cancelUrl = bridgeBase
          ? buildWebReturnUrl(bridgeBase, 'cancelled', appCancelUrl)
          : appCancelUrl;

        const session = await createCheckoutSessionAsync({
          bookingId: id,
          paymentType,
          successUrl,
          cancelUrl,
        });

        await WebBrowser.openBrowserAsync(session.checkoutUrl);

        // In case the user closes the browser before redirect, refresh snapshot.
        refetch();
        refetchFinance();
        refetchPayments();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Impossible de lancer le paiement.';
        Alert.alert('Paiement indisponible', message);
      }
    },
    [
      id,
      depositRemaining,
      balanceRemaining,
      createCheckoutSessionAsync,
      refetch,
      refetchFinance,
      refetchPayments,
    ]
  );

  useEffect(() => {
    if (!shouldAutoSendDepositReminder || !id || !finance) return;
    if (autoReminderInFlightRef.current) return;
    if (Date.now() - sessionAutoReminderAtRef.current < DAY_IN_MS) return;

    autoReminderInFlightRef.current = true;
    sessionAutoReminderAtRef.current = Date.now();

    const dueDateLabel = finance.deposit_due_date ? formatDate(finance.deposit_due_date) : null;
    const message = dueDateLabel
      ? `Petit rappel Umade : l'acompte de ${formatPrice(
          depositRemaining
        )} attendu pour le ${dueDateLabel} n'a pas encore été réglé.`
      : `Petit rappel Umade : l'acompte de ${formatPrice(
          depositRemaining
        )} n'a pas encore été réglé.`;

    (async () => {
      try {
        const reminder = await createManualReminderAsync({
          bookingId: id,
          targetRole: 'client',
          reminderType: 'deposit',
          message,
        });
        await sendReminderNowAsync({
          reminderId: reminder.id,
          message,
        });
      } catch (error) {
        console.error('auto_deposit_reminder_failed', error);
        sessionAutoReminderAtRef.current = 0;
      } finally {
        autoReminderInFlightRef.current = false;
      }
    })();
  }, [
    shouldAutoSendDepositReminder,
    id,
    finance,
    depositRemaining,
    createManualReminderAsync,
    sendReminderNowAsync,
  ]);

  useEffect(() => {
    if (!payment) return;

    const feedbackKey = `${payment}-${type || 'unknown'}-${id || 'booking'}`;
    if (paymentFeedbackKeyRef.current === feedbackKey) return;
    paymentFeedbackKeyRef.current = feedbackKey;

    if (payment === 'success') {
      let cancelled = false;
      const runRefresh = () => {
        if (cancelled) return;
        refetch();
        refetchFinance();
        refetchPayments();
      };

      // Stripe webhook settlement may take a few seconds; refresh a few times.
      runRefresh();
      const retries = [1500, 4000, 8000].map((ms) => setTimeout(runRefresh, ms));

      return () => {
        cancelled = true;
        retries.forEach((timer) => clearTimeout(timer));
      };
    }

    if (payment === 'cancelled') return;
  }, [payment, type, id, refetch, refetchFinance, refetchPayments]);

  const handleUpdateCalendarSyncMode = (
    syncMode: 'google_export' | 'apple_export'
  ) => {
    if (!booking?.provider_id) return;

    upsertCalendarSync(
      {
        providerId: booking.provider_id,
        updates: { sync_mode: syncMode },
      },
      {
        onError: (error) => Alert.alert('Erreur', error.message),
      }
    );
  };

  const bookingDateTimes = useMemo(() => {
    if (!booking) return null;
    return buildBookingDateTimes(booking as any);
  }, [booking]);

  const calendarTitle = useMemo(() => {
    if (!booking) return 'Réservation Umade';
    const serviceName = (booking as any).services?.name || 'Prestation';
    const providerName = (booking as any).providers?.business_name || 'Prestataire';
    return `${serviceName} - ${providerName}`;
  }, [booking]);

  const calendarDescription = useMemo(() => {
    if (!booking) return 'Réservation Umade';
    const notes = booking.client_message?.trim();
    if (notes) return `${notes}\n\nRéservation #${booking.id}`;
    return `Réservation #${booking.id}`;
  }, [booking]);

  const buildCurrentBookingIcs = useCallback(() => {
    if (!booking) return null;

    return buildIcsForBookings([
      {
        id: booking.id,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        service_name: (booking as any).services?.name || 'Prestation',
        provider_name: (booking as any).providers?.business_name || 'Prestataire',
        note: booking.client_message,
      },
    ]);
  }, [booking]);

  const handleOpenGoogleCalendar = async () => {
    if (!bookingDateTimes || !booking) return;

    const url = buildGoogleCalendarUrl({
      title: calendarTitle,
      description: calendarDescription,
      start: bookingDateTimes.start,
      end: bookingDateTimes.end,
    });

    const canOpen = await RNLinking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Impossible', "Impossible d'ouvrir Google Calendar sur cet appareil.");
      return;
    }

    await RNLinking.openURL(url);
  };

  const handleCopyIcs = async (showAlert = true) => {
    const ics = buildCurrentBookingIcs();
    if (!ics) return;
    await Clipboard.setStringAsync(ics);
    if (showAlert) {
      Alert.alert('Copié', 'Contenu ICS copié. Colle-le dans un fichier .ics si besoin.');
    }
  };

  const handleOpenAppleCalendar = async (): Promise<boolean> => {
    const ics = buildCurrentBookingIcs();
    if (!ics || !booking) return false;
    if (Platform.OS !== 'ios') return false;

    const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!baseDir) return false;

    const fileName = `umade-booking-${booking.id}-${Date.now()}.ics`;
    const fileUri = `${baseDir}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, ics);
    await RNLinking.openURL(fileUri);
    return true;
  };

  const handleCalendarSyncPress = () => {
    Alert.alert(
      'Synchroniser calendrier',
      'Choisis le calendrier à utiliser.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Apple Calendar',
          onPress: async () => {
            handleUpdateCalendarSyncMode('apple_export');
            try {
              const opened = await handleOpenAppleCalendar();
              if (!opened) {
                await handleCopyIcs(false);
                Alert.alert(
                  'Apple Calendar',
                  "Ouverture directe indisponible ici. Le contenu ICS est copié dans le presse-papiers."
                );
              }
            } catch {
              await handleCopyIcs(false);
              Alert.alert(
                'Apple Calendar',
                "Impossible d'ouvrir Apple Calendar automatiquement. Le contenu ICS est copié en secours."
              );
            }
          },
        },
        {
          text: 'Google Calendar',
          onPress: async () => {
            handleUpdateCalendarSyncMode('google_export');
            await handleOpenGoogleCalendar();
          },
        },
      ]
    );
  };

  // Contract status helpers
  const contractStatus = useMemo(() => {
    if (!contract) return 'none';
    const providerSigned = !!contract.provider_signature_name && !!contract.provider_signed_at;
    const clientSigned = !!contract.client_signature_name && !!contract.client_signed_at;
    if (providerSigned && clientSigned) return 'signed';
    if (providerSigned || clientSigned) return 'partial';
    return 'draft';
  }, [contract]);

  // Client payment notification handler
  const handleClientPaymentNotification = useCallback(
    async (paymentType: 'deposit' | 'balance') => {
      if (!id || !booking || !finance) return;

      // Find the conversation between client and provider
      const providerId = booking.provider_id;
      const conv = conversations.find(
        (c: any) =>
          (c.participant_1 === providerId || c.participant_2 === providerId) &&
          c.booking_id === id
      ) || conversations.find(
        (c: any) => c.participant_1 === providerId || c.participant_2 === providerId
      );

      if (!conv) {
        Alert.alert('Pas de conversation', "Aucune conversation trouvée avec le prestataire. Envoie d'abord un message.");
        return;
      }

      const amount =
        paymentType === 'deposit'
          ? finance.deposit_amount || 0
          : Math.max((finance.quote_amount || 0) - (finance.deposit_amount || 0), 0);
      const label = paymentType === 'deposit' ? "l'acompte" : 'le solde';

      Alert.alert(
        'Confirmer',
        `Notifier le prestataire que vous avez effectué le virement de ${formatPrice(amount)} (${label}) ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Envoyer',
            onPress: async () => {
              try {
                const messageContent = JSON.stringify({
                  type: 'payment_notification',
                  booking_id: id,
                  payment_type: paymentType,
                  amount,
                  message: `Le client confirme avoir effectué le virement de ${formatPrice(amount)} pour ${label}.`,
                });

                const { error } = await (supabase as any).from('messages').insert({
                  conversation_id: conv.id,
                  sender_id: profile?.id || '',
                  content: messageContent,
                });

                if (error) throw error;

                Alert.alert('Notification envoyée', 'Le prestataire a été notifié de votre paiement.');
              } catch (error: any) {
                Alert.alert('Erreur', error.message || 'Impossible d\'envoyer la notification.');
              }
            },
          },
        ]
      );
    },
    [id, booking, finance, conversations, profile?.id]
  );

  const handleOpenPaymentSummary = useCallback(() => {
    paymentSummaryRef.current?.present();
  }, []);

  const handleConfirmCompletion = useCallback(() => {
    if (!id || !completionRole) return;
    if (!isFullyPaidForCompletion) {
      Alert.alert(
        'Validation indisponible',
        'La validation de la prestation sera possible uniquement après paiement complet.'
      );
      return;
    }
    if (booking?.status === 'cancelled') {
      Alert.alert('Réservation annulée', 'Impossible de valider une réservation annulée.');
      return;
    }
    if (currentRoleAlreadyConfirmed) {
      Alert.alert('Déjà validé', 'Votre validation a déjà été enregistrée.');
      return;
    }

    const roleLabel = completionRole === 'provider' ? 'prestataire' : 'client';

    Alert.alert(
      'Valider la prestation',
      `Confirmer la validation de la prestation côté ${roleLabel} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: () => {
            confirmBookingCompletion(
              { bookingId: id },
              {
                onSuccess: (result: any) => {
                  refetchCompletionConfirmation();
                  refetch();
                  refetchFinance();

                  const providerDone = !!result?.provider_confirmed_at;
                  const clientDone = !!result?.client_confirmed_at;
                  Alert.alert(
                    providerDone && clientDone ? 'Validation complète' : 'Validation enregistrée',
                    providerDone && clientDone
                      ? 'Les deux parties ont validé la prestation.'
                      : 'Votre validation est enregistrée. En attente de la seconde partie.'
                  );
                },
                onError: (error: any) => {
                  Alert.alert('Erreur', error?.message || 'Impossible de confirmer la prestation.');
                },
              }
            );
          },
        },
      ]
    );
  }, [
    id,
    completionRole,
    isFullyPaidForCompletion,
    booking?.status,
    currentRoleAlreadyConfirmed,
    confirmBookingCompletion,
    refetchCompletionConfirmation,
    refetch,
    refetchFinance,
  ]);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement..." />;
  }

  if (!booking) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Réservation non trouvée</Text>
          <Button title="Retour" onPress={() => goBackOrFallback(router)} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const isBookingPending = booking.status === 'pending';
  const isBookingConfirmed = booking.status === 'confirmed';
  const isQuoteLockedByStatus =
    booking.status === 'confirmed' || booking.status === 'completed' || booking.status === 'cancelled';
  const canProviderConfirm = isProvider && isBookingPending;
  const canProviderCancel = isProvider && (isBookingPending || isBookingConfirmed);
  const canClientCancel = !isProvider && (isBookingPending || isBookingConfirmed);
  const requiresContractSignatures = finance?.contract_required !== false;
  const paymentUnlockedByContract = !requiresContractSignatures || contractStatus === 'signed';
  const canClientPayOnline =
    !isProvider &&
    booking.status !== 'cancelled' &&
    paymentUnlockedByContract &&
    (depositRemaining > 0 || balanceRemaining > 0);
  const canCurrentUserConfirmCompletion =
    !!completionRole &&
    booking.status !== 'cancelled' &&
    isFullyPaidForCompletion &&
    !currentRoleAlreadyConfirmed &&
    !bothCompletionConfirmed;

  const responseBoxBg = isDark ? colors.backgroundTertiary : `${colors.primary}10`;
  const cancelBoxBg = isDark ? `${colors.error}20` : `${colors.error}10`;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Détail réservation',
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.backgroundSecondary },
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              refetch();
              refetchFinance();
              refetchCompletionConfirmation();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.statusRow}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Statut</Text>
          <BookingStatusBadge status={booking.status} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Prestataire</Text>
          <View style={styles.providerRow}>
            <Avatar
              source={(booking as any).providers?.profiles?.avatar_url ?? undefined}
              name={(booking as any).providers?.business_name || '?'}
              size="lg"
            />
            <View style={styles.providerInfo}>
              <Text style={[styles.providerName, { color: colors.text }]}> 
                {(booking as any).providers?.business_name}
              </Text>
              <Text style={[styles.serviceName, { color: colors.textSecondary }]}> 
                {(booking as any).services?.name}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Détails</Text>

          <View style={styles.detailItem}>
            <View style={[styles.detailIconWrap, { backgroundColor: `${colors.primary}16` }]}> 
              <Calendar size={16} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date</Text>
              <Text style={[styles.detailText, { color: colors.text }]}>{formatDate(booking.booking_date)}</Text>
            </View>
          </View>

          <View style={[styles.detailDivider, { backgroundColor: colors.border }]} />

          {booking.start_time && (
            <View style={styles.detailItem}>
              <View style={[styles.detailIconWrap, { backgroundColor: `${colors.primary}16` }]}> 
                <Clock size={16} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Heure</Text>
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {booking.start_time.slice(0, 5)}
                  {booking.end_time ? ` - ${booking.end_time.slice(0, 5)}` : ''}
                </Text>
              </View>
            </View>
          )}

          {booking.client_message && (
            <>
              <View style={[styles.detailDivider, { backgroundColor: colors.border }]} />
              <View style={styles.detailItem}>
                <View style={[styles.detailIconWrap, { backgroundColor: `${colors.primary}16` }]}> 
                  <FileText size={16} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Message client</Text>
                  <Text style={[styles.detailText, { color: colors.text }]}>{booking.client_message}</Text>
                </View>
              </View>
            </>
          )}

          {(booking.provider_response || booking.cancellation_reason) && (
            <View style={[styles.detailDivider, { backgroundColor: colors.border }]} />
          )}

          {booking.provider_response && (
            <View
              style={[
                styles.responseBox,
                {
                  backgroundColor: responseBoxBg,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text style={[styles.responseLabel, { color: colors.primary }]}>Réponse du prestataire</Text>
              <Text style={[styles.responseText, { color: colors.text }]}>{booking.provider_response}</Text>
            </View>
          )}

          {booking.cancellation_reason && (
            <View
              style={[
                styles.cancelBox,
                {
                  backgroundColor: cancelBoxBg,
                  borderColor: colors.error,
                },
              ]}
            >
              <Text style={[styles.cancelLabel, { color: colors.error }]}>Raison d'annulation</Text>
              <Text style={[styles.cancelText, { color: colors.text }]}>{booking.cancellation_reason}</Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.card,
            styles.priceCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.text }]}>Prix total</Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}> 
              {formatPrice(displayedTotalPrice)}
            </Text>
          </View>
        </View>

        {finance && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionTitleRow}>
              <Wallet size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Devis & paiements</Text>
            </View>

            <View style={styles.financeRow}>
              <Text style={[styles.financeLabel, { color: colors.textSecondary }]}>Devis</Text>
              <Text style={[styles.financeValue, { color: colors.text }]}>
                {formatPrice(finance.quote_amount || finance.total_price)}
              </Text>
            </View>
            <View style={styles.financeRow}>
              <Text style={[styles.financeLabel, { color: colors.textSecondary }]}>Acompte payé</Text>
              <Text style={[styles.financeValue, { color: colors.text }]}>
                {formatPrice(finance.deposit_paid_amount || 0)}
              </Text>
            </View>
            <View style={styles.financeRow}>
              <Text style={[styles.financeLabel, { color: colors.textSecondary }]}>Solde payé</Text>
              <Text style={[styles.financeValue, { color: colors.text }]}>
                {formatPrice(finance.balance_paid_amount || 0)}
              </Text>
            </View>
            <View style={styles.financeRow}>
              <Text style={[styles.financeLabel, { color: colors.textSecondary }]}>Statut paiement</Text>
              <Text style={[styles.financeValue, { color: colors.primary }]}>
                {formatPaymentStatusLabel(finance.payment_status)}
              </Text>
            </View>

            <View style={styles.sectionDivider} />
            <PaymentTracker finance={finance} payments={payments} />

            <Button
              title="Voir le résumé complet"
              onPress={handleOpenPaymentSummary}
              variant="outline"
              fullWidth
              size="sm"
            />

            {!isProvider && !paymentUnlockedByContract && (
              <>
                <View style={styles.sectionDivider} />
                <Text style={[styles.subSectionTitle, { color: colors.text }]}>Paiement en attente</Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Le contrat doit être signé par le prestataire et le client avant tout paiement.
                </Text>
                {contract ? (
                  <Button
                    title="Voir et signer le contrat"
                    onPress={() => router.push(`/booking/${id}/contract-sign`)}
                    variant="outline"
                    fullWidth
                  />
                ) : (
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Le devis doit d'abord être finalisé par le prestataire.
                  </Text>
                )}
              </>
            )}

            {canClientPayOnline && (
              <>
                <View style={styles.sectionDivider} />
                <Text style={[styles.subSectionTitle, { color: colors.text }]}>Paiement en ligne sécurisé</Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Payez directement en carte via Stripe. Le statut de la réservation est mis à jour automatiquement.
                </Text>
                <View style={styles.duoButtonsRow}>
                  <Button
                    title={
                      depositRemaining > 0
                        ? `Payer acompte (${formatPrice(depositRemaining)})`
                        : 'Acompte réglé'
                    }
                    onPress={() => handlePayOnline('deposit')}
                    loading={isCreatingCheckout}
                    disabled={isCreatingCheckout || depositRemaining <= 0}
                    variant={depositRemaining > 0 ? 'primary' : 'outline'}
                    style={styles.halfButton}
                  />
                  <Button
                    title={
                      balanceRemaining > 0
                        ? `Payer solde (${formatPrice(balanceRemaining)})`
                        : 'Solde réglé'
                    }
                    onPress={() => handlePayOnline('balance')}
                    loading={isCreatingCheckout}
                    disabled={isCreatingCheckout || balanceRemaining <= 0}
                    variant="outline"
                    style={styles.halfButton}
                  />
                </View>

                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Si vous payez par virement bancaire hors plateforme, vous pouvez aussi notifier le prestataire.
                </Text>
                <View style={styles.duoButtonsRow}>
                  <Button
                    title="Notifier acompte (virement)"
                    onPress={() => handleClientPaymentNotification('deposit')}
                    variant="outline"
                    style={styles.halfButton}
                  />
                  <Button
                    title="Notifier solde (virement)"
                    onPress={() => handleClientPaymentNotification('balance')}
                    variant="outline"
                    style={styles.halfButton}
                  />
                </View>
              </>
            )}

            {isProvider && (
              <>
                <View
                  style={[
                    styles.quoteBanner,
                    {
                      borderColor: `${colors.primary}40`,
                      backgroundColor: isDark ? `${colors.primary}14` : `${colors.primary}0E`,
                    },
                  ]}
                >
                  <View style={{ flex: 1, gap: Layout.spacing.xs }}>
                    <Text style={[styles.quoteBannerTitle, { color: colors.text }]}>Gestion du devis</Text>
                    <Text style={[styles.quoteBannerText, { color: colors.textSecondary }]}>
                      Définis un devis clair, les échéances et confirme les paiements en un seul endroit.
                    </Text>
                  </View>
                  <Button
                    title={
                      isQuoteLockedByStatus
                        ? 'Devis verrouillé'
                        : hasConfiguredQuote
                          ? 'Modifier le devis'
                          : 'Faire un devis'
                    }
                    onPress={() => {
                      if (!id) return;
                      router.push(`/booking/${id}/quote`);
                    }}
                    variant="outline"
                    size="sm"
                    disabled={isQuoteLockedByStatus}
                  />
                </View>

                <View style={styles.duoButtonsRow}>
                  <Button
                    title={
                      !paymentUnlockedByContract
                        ? 'Signature requise'
                        : providerDepositRemaining > 0
                        ? `Marquer acompte payé (${formatPrice(providerDepositRemaining)})`
                        : 'Acompte réglé'
                    }
                    onPress={handleMarkDepositPaid}
                    loading={isRecordingPayment}
                    disabled={
                      isRecordingPayment || providerDepositRemaining <= 0 || !paymentUnlockedByContract
                    }
                    variant="outline"
                    style={styles.halfButton}
                  />
                  <Button
                    title={
                      !paymentUnlockedByContract
                        ? 'Signature requise'
                        : providerBalanceRemaining > 0
                        ? `Marquer solde payé (${formatPrice(providerBalanceRemaining)})`
                        : 'Solde réglé'
                    }
                    onPress={handleMarkBalancePaid}
                    loading={isRecordingPayment}
                    disabled={
                      isRecordingPayment || providerBalanceRemaining <= 0 || !paymentUnlockedByContract
                    }
                    variant="outline"
                    style={styles.halfButton}
                  />
                </View>
              </>
            )}

            {payments.length > 0 && (
              <>
                <View style={styles.sectionDivider} />
                <Text style={[styles.subSectionTitle, { color: colors.text }]}>Historique des paiements</Text>
                {payments.slice(0, 6).map((payment) => (
                  <View key={payment.id} style={styles.paymentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.paymentTitle, { color: colors.text }]}>
                        {payment.payment_type} · {payment.status}
                      </Text>
                      <Text style={[styles.paymentMeta, { color: colors.textSecondary }]}>
                        {payment.paid_at
                          ? `Payé le ${formatDateTimeLabel(payment.paid_at)}`
                          : payment.due_date
                            ? `Échéance ${formatDate(payment.due_date)}`
                            : 'Sans échéance'}
                      </Text>
                    </View>
                    <Text style={[styles.paymentAmount, { color: colors.primary }]}>
                      {formatPrice(payment.amount)}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {isProvider && (
              <>
                <View style={styles.sectionDivider} />
                <View
                  style={[
                    styles.autoReminderCard,
                    {
                      borderColor: `${colors.primary}40`,
                      backgroundColor: isDark ? `${colors.primary}14` : `${colors.primary}0D`,
                    },
                  ]}
                >
                  <Text style={[styles.autoReminderTitle, { color: colors.text }]}>
                    Rappel acompte automatique
                  </Text>
                  <Text style={[styles.autoReminderText, { color: colors.textSecondary }]}>
                    Si l'acompte reste impayé après l'échéance, un rappel est envoyé automatiquement au client.
                  </Text>
                  {(isCreatingAutoReminder || isSendingAutoReminder) && (
                    <Text style={[styles.autoReminderSendingText, { color: colors.primary }]}>
                      Envoi automatique en cours...
                    </Text>
                  )}
                </View>
              </>
            )}
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionTitleRow}>
            <FileText size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contrat</Text>
          </View>

          {contractStatus === 'signed' && (
            <View style={[styles.contractSignedBanner, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
              <ShieldCheck size={16} color="#059669" />
              <Text style={styles.contractSignedText}>Signé par les deux parties ✓</Text>
            </View>
          )}

          {contractStatus === 'partial' && (
            <View style={[styles.contractPartialBanner, { backgroundColor: isDark ? '#78350F33' : '#FFFBEB' }]}>
              <Clock size={16} color="#F59E0B" />
              <Text style={[styles.contractPartialText, { color: '#F59E0B' }]}>En attente d'une signature</Text>
            </View>
          )}

          {contractStatus === 'draft' && (
            <View style={[styles.contractDraftBanner, { backgroundColor: isDark ? colors.backgroundTertiary : '#F3F4F6' }]}>
              <Pencil size={16} color={colors.textSecondary} />
              <Text style={[styles.contractDraftText, { color: colors.textSecondary }]}>Contrat en brouillon</Text>
            </View>
          )}

          {contractStatus === 'none' && (
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Le contrat sera généré après confirmation du devis par le prestataire.
            </Text>
          )}

          {contract && (
            <View style={styles.contractMetaRow}>
              <Text style={[styles.contractVersionText, { color: colors.textSecondary }]}>
                v{contract.version} · {contract.title}
              </Text>
            </View>
          )}

          <View style={styles.duoButtonsRow}>
            {isProvider && !contract && (
              <Button
                title="Finaliser le devis"
                onPress={() => router.push(`/booking/${id}/quote`)}
                fullWidth
              />
            )}
            {contract && (
              <Button
                title={contractStatus === 'signed' ? 'Voir le contrat' : 'Voir et signer'}
                onPress={() => router.push(`/booking/${id}/contract-sign`)}
                variant="primary"
                fullWidth
                icon={contractStatus === 'signed' ? <CheckCircle2 size={14} color="#FFFFFF" /> : undefined}
              />
            )}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionTitleRow}>
            <ShieldCheck size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Validation prestation</Text>
          </View>

          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            La prestation est validée quand le prestataire et le client confirment la fin de mission.
          </Text>

          <View style={styles.completionStatusList}>
            <View style={styles.completionStatusRow}>
              <View style={[styles.completionIconWrap, { backgroundColor: `${colors.primary}16` }]}>
                {providerCompletionConfirmed ? (
                  <CheckCircle2 size={16} color="#059669" />
                ) : (
                  <Clock size={16} color={colors.textSecondary} />
                )}
              </View>
              <View style={styles.completionStatusContent}>
                <Text style={[styles.completionStatusTitle, { color: colors.text }]}>Prestataire</Text>
                <Text style={[styles.completionStatusText, { color: colors.textSecondary }]}>
                  {providerCompletionConfirmed
                    ? `Validé le ${formatDateTimeLabel(completionConfirmation?.provider_confirmed_at)}`
                    : 'En attente de validation'}
                </Text>
              </View>
            </View>

            <View style={styles.completionStatusRow}>
              <View style={[styles.completionIconWrap, { backgroundColor: `${colors.primary}16` }]}>
                {clientCompletionConfirmed ? (
                  <CheckCircle2 size={16} color="#059669" />
                ) : (
                  <Clock size={16} color={colors.textSecondary} />
                )}
              </View>
              <View style={styles.completionStatusContent}>
                <Text style={[styles.completionStatusTitle, { color: colors.text }]}>Client</Text>
                <Text style={[styles.completionStatusText, { color: colors.textSecondary }]}>
                  {clientCompletionConfirmed
                    ? `Validé le ${formatDateTimeLabel(completionConfirmation?.client_confirmed_at)}`
                    : 'En attente de validation'}
                </Text>
              </View>
            </View>
          </View>

          {!isFullyPaidForCompletion && (
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Disponible uniquement après paiement complet du devis.
            </Text>
          )}

          {bothCompletionConfirmed ? (
            <View style={[styles.completionDoneBanner, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
              <CheckCircle2 size={16} color="#059669" />
              <Text style={styles.completionDoneText}>Prestation validée par les 2 parties ✓</Text>
            </View>
          ) : completionRole ? (
            <Button
              title={
                currentRoleAlreadyConfirmed
                  ? 'Validation enregistrée'
                  : completionRole === 'provider'
                    ? 'Valider côté prestataire'
                    : 'Valider côté client'
              }
              onPress={handleConfirmCompletion}
              loading={isConfirmingCompletion}
              disabled={!canCurrentUserConfirmCompletion || isConfirmingCompletion}
              variant={canCurrentUserConfirmCompletion ? 'primary' : 'outline'}
              fullWidth
            />
          ) : (
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Seules les deux parties de la réservation peuvent valider la prestation.
            </Text>
          )}
        </View>

        {isProvider && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Synchronisation calendrier</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}> 
              Les réservations confirmées bloquent automatiquement vos dates. Connecte rapidement Google ou Apple.
            </Text>
            <Button
              title="Synchroniser mon calendrier"
              onPress={handleCalendarSyncPress}
              loading={isSavingCalendarSync}
              disabled={isSavingCalendarSync}
              fullWidth
            />
          </View>
        )}

        {(canProviderConfirm || canProviderCancel || canClientCancel) && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>

            {canProviderConfirm && (
              <View style={styles.providerActionsRow}>
                <Button
                  title="Refuser"
                  onPress={handleCancel}
                  variant="outline"
                  loading={isPending}
                  disabled={isPending}
                  fullWidth
                  style={[styles.actionHalfButton, { borderColor: colors.error }]}
                  textStyle={{ color: colors.error }}
                />
                <Button
                  title="Confirmer"
                  onPress={handleConfirm}
                  loading={isPending}
                  disabled={isPending}
                  fullWidth
                  style={styles.actionHalfButton}
                />
              </View>
            )}

            {!canProviderConfirm && canProviderCancel && (
              <Button
                title="Annuler la réservation"
                onPress={handleCancel}
                variant="outline"
                loading={isPending}
                disabled={isPending}
                fullWidth
                style={[styles.cancelButton, { borderColor: colors.error }]}
                textStyle={{ color: colors.error }}
              />
            )}

            {canClientCancel && (
              <Button
                title="Annuler la réservation"
                onPress={handleCancel}
                variant="outline"
                loading={isPending}
                disabled={isPending}
                fullWidth
                style={[styles.cancelButton, { borderColor: colors.error }]}
                textStyle={{ color: colors.error }}
              />
            )}
          </View>
        )}
      </ScrollView>

      {finance && (
        <PaymentSummarySheet
          ref={paymentSummaryRef}
          finance={finance}
          payments={payments}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
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
  statusRow: {
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.lg,
    gap: Layout.spacing.xs,
  },
  sectionLabel: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  card: {
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.bold,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  subSectionTitle: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.bold,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: Layout.fontSize.lg,
    fontFamily: fontFamily.semiBold,
  },
  serviceName: {
    fontSize: Layout.fontSize.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.spacing.sm,
  },
  detailIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  detailContent: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.semiBold,
  },
  detailText: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    lineHeight: 22,
  },
  detailDivider: {
    height: 1,
    width: '100%',
  },
  responseBox: {
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    borderWidth: 1,
  },
  responseLabel: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.semiBold,
    marginBottom: Layout.spacing.xs,
  },
  responseText: {
    fontSize: Layout.fontSize.sm,
    fontStyle: 'italic',
  },
  cancelBox: {
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    borderWidth: 1,
  },
  cancelLabel: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.semiBold,
    marginBottom: Layout.spacing.xs,
  },
  cancelText: {
    fontSize: Layout.fontSize.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceCard: {
    paddingVertical: Layout.spacing.lg,
  },
  priceLabel: {
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.semiBold,
  },
  priceValue: {
    fontSize: Layout.fontSize['2xl'],
    fontFamily: fontFamily.bold,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(120,120,120,0.2)',
    marginVertical: Layout.spacing.xs,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financeLabel: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.medium,
  },
  financeValue: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.bold,
  },
  quoteBanner: {
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  quoteBannerTitle: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.bold,
  },
  quoteBannerText: {
    fontSize: Layout.fontSize.xs,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Layout.spacing.md,
  },
  switchLabel: {
    flex: 1,
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.medium,
  },
  duoButtonsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
  },
  paymentTitle: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.semiBold,
    textTransform: 'capitalize',
  },
  paymentMeta: {
    fontSize: Layout.fontSize.xs,
  },
  paymentAmount: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.bold,
  },
  contractBodyInput: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  contractTitle: {
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.bold,
  },
  contractBodyPreview: {
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
  },
  signatureRow: {
    gap: 4,
  },
  signatureLabel: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.semiBold,
  },
  signatureValue: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.semiBold,
  },
  infoText: {
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
  },
  autoReminderCard: {
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    gap: Layout.spacing.xs,
  },
  autoReminderTitle: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.bold,
  },
  autoReminderText: {
    fontSize: Layout.fontSize.xs,
    lineHeight: 18,
  },
  autoReminderSendingText: {
    marginTop: Layout.spacing.xs,
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.semiBold,
  },
  requestCard: {
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.sm,
    gap: Layout.spacing.xs,
  },
  requestTitle: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.bold,
  },
  requestMeta: {
    fontSize: Layout.fontSize.sm,
  },
  requestReason: {
    fontSize: Layout.fontSize.sm,
    fontStyle: 'italic',
  },
  historyRow: {
    paddingVertical: Layout.spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,120,0.25)',
  },
  historyTitle: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.semiBold,
  },
  historyMeta: {
    fontSize: Layout.fontSize.xs,
    textTransform: 'capitalize',
  },
  cancelButton: {
    marginTop: Layout.spacing.xs,
  },
  providerActionsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
  },
  actionHalfButton: {
    flex: 1,
  },
  dateFieldContainer: {
    marginBottom: Layout.spacing.md,
    gap: Layout.spacing.xs,
  },
  dateFieldLabel: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.medium,
  },
  dateFieldPressable: {
    minHeight: Layout.inputHeight,
    borderRadius: Layout.radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Layout.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  dateFieldValue: {
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.medium,
  },
  datePickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  datePickerModalCard: {
    borderTopLeftRadius: Layout.radius.xl,
    borderTopRightRadius: Layout.radius.xl,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  datePickerModalTitle: {
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
  },
  datePickerModalActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  datePickerModalActionButton: {
    flex: 1,
  },
  contractSignedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.radius.md,
  },
  contractSignedText: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.bold,
    color: '#059669',
  },
  contractPartialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.radius.md,
  },
  contractPartialText: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.bold,
  },
  contractDraftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.radius.md,
  },
  contractDraftText: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.semiBold,
  },
  contractMetaRow: {
    paddingVertical: Layout.spacing.xs,
  },
  contractVersionText: {
    fontSize: Layout.fontSize.xs,
  },
  completionStatusList: {
    gap: Layout.spacing.sm,
  },
  completionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  completionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionStatusContent: {
    flex: 1,
    gap: 2,
  },
  completionStatusTitle: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.semiBold,
  },
  completionStatusText: {
    fontSize: Layout.fontSize.xs,
  },
  completionDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.radius.md,
  },
  completionDoneText: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.bold,
    color: '#059669',
  },
});
