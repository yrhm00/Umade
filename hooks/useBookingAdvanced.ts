import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import {
  BookingCompletionConfirmation,
  BookingContract,
  BookingFinanceSnapshot,
  BookingPayment,
  BookingReminder,
  ProviderCalendarSyncSettings,
} from '@/types/bookingAdvanced';

const fromTable = (table: string) => (supabase as any).from(table);

const bookingAdvancedKey = (bookingId: string | undefined) => ['booking-advanced', bookingId];
const bookingPaymentsKey = (bookingId: string | undefined) => ['booking-payments', bookingId];
const bookingRemindersKey = (bookingId: string | undefined) => ['booking-reminders', bookingId];
const bookingContractKey = (bookingId: string | undefined) => ['booking-contract', bookingId];
const bookingCompletionKey = (bookingId: string | undefined) => ['booking-completion', bookingId];
const providerCalendarSyncKey = (providerId: string | undefined | null) => ['provider-calendar-sync', providerId];

interface BookingCheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
  amount: number;
  currency: string;
  paymentType: 'deposit' | 'balance';
}

export function useBookingFinance(bookingId: string | undefined) {
  return useQuery({
    queryKey: bookingAdvancedKey(bookingId),
    queryFn: async (): Promise<BookingFinanceSnapshot | null> => {
      if (!bookingId) return null;

      const { data, error } = await fromTable('bookings')
        .select(`
          id,
          status,
          quote_amount,
          total_price,
          deposit_amount,
          deposit_due_date,
          deposit_paid_amount,
          deposit_paid_at,
          balance_amount,
          balance_due_date,
          balance_paid_amount,
          balance_paid_at,
          payment_status,
          auto_confirm_on_deposit,
          contract_required,
          cancellation_policy,
          can_reschedule,
          max_reschedules,
          reschedule_count,
          booking_date,
          start_time,
          end_time,
          provider_id,
          client_id
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        quote_amount: Number(data.quote_amount || 0),
        total_price: Number(data.total_price || 0),
        deposit_amount: Number(data.deposit_amount || 0),
        deposit_paid_amount: Number(data.deposit_paid_amount || 0),
        balance_amount: Number(data.balance_amount || 0),
        balance_paid_amount: Number(data.balance_paid_amount || 0),
      } as BookingFinanceSnapshot;
    },
    enabled: !!bookingId,
  });
}

export function useBookingPayments(bookingId: string | undefined) {
  return useQuery({
    queryKey: bookingPaymentsKey(bookingId),
    queryFn: async (): Promise<BookingPayment[]> => {
      if (!bookingId) return [];

      const { data, error } = await fromTable('booking_payments')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return ((data || []) as BookingPayment[]).map((row) => ({
        ...row,
        amount: Number((row as any).amount || 0),
      }));
    },
    enabled: !!bookingId,
  });
}

export function useCreateManualBookingReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      targetRole = 'client',
      message,
      reminderType = 'custom',
      scheduledFor,
    }: {
      bookingId: string;
      targetRole?: 'client' | 'provider' | 'both';
      message: string;
      reminderType?: 'custom' | 'rsvp' | 'deposit' | 'balance' | 'contract' | 'event_day';
      scheduledFor?: string;
    }) => {
      const { data, error } = await fromTable('booking_reminders')
        .insert({
          booking_id: bookingId,
          reminder_type: reminderType,
          target_role: targetRole,
          channel: 'in_app',
          scheduled_for: scheduledFor || new Date().toISOString(),
          status: 'scheduled',
          message,
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as BookingReminder;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingRemindersKey(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: bookingAdvancedKey(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.bookings] });
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.notifications] });
      queryClient.setQueryData<BookingReminder[]>(
        bookingRemindersKey(variables.bookingId),
        (prev) => (prev ? [result, ...prev] : [result])
      );
    },
  });
}

export function useRecordBookingPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      paymentType,
      amount,
      dueDate,
      markPaid = true,
      note,
    }: {
      bookingId: string;
      paymentType: 'deposit' | 'balance' | 'full' | 'refund';
      amount: number;
      dueDate?: string | null;
      markPaid?: boolean;
      note?: string | null;
    }) => {
      const { data, error } = await supabase.rpc('record_booking_payment' as any, {
        p_booking_id: bookingId,
        p_payment_type: paymentType,
        p_amount: amount,
        p_due_date: dueDate || null,
        p_mark_paid: markPaid,
        p_note: note || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.bookings] });
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.providers] });
      queryClient.invalidateQueries({ queryKey: bookingAdvancedKey(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: bookingPaymentsKey(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: bookingRemindersKey(variables.bookingId) });
    },
  });
}

export function useCreateBookingCheckoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      paymentType,
      successUrl,
      cancelUrl,
    }: {
      bookingId: string;
      paymentType: 'deposit' | 'balance';
      successUrl?: string;
      cancelUrl?: string;
    }): Promise<BookingCheckoutSessionResponse> => {
      const { data, error } = await supabase.functions.invoke('create-booking-checkout', {
        body: {
          bookingId,
          paymentType,
          successUrl,
          cancelUrl,
        },
      });

      if (error) {
        const context = (error as any)?.context;
        let detailedMessage: string | null = null;
        if (context) {
          try {
            if (typeof context.clone === 'function') {
              const cloned = context.clone();
              const details = await cloned.json();
              if (details?.error) {
                detailedMessage = String(details.error);
              }
            }
          } catch {
            // Ignore JSON parsing failure and try text below.
          }

          if (!detailedMessage) {
            try {
              const text = await context.text();
              if (text) {
                try {
                  const parsed = JSON.parse(text);
                  if (parsed?.error) {
                    detailedMessage = String(parsed.error);
                  } else {
                    detailedMessage = text;
                  }
                } catch {
                  detailedMessage = text;
                }
              }
            } catch {
              // Ignore text parsing failures.
            }
          }
        }
        throw new Error(
          detailedMessage ||
            (error as any)?.message ||
            'Impossible de créer la session de paiement.'
        );
      }

      const payload = data as Partial<BookingCheckoutSessionResponse> | null;
      if (!payload?.checkoutUrl || !payload?.sessionId) {
        throw new Error('Réponse paiement invalide');
      }

      return {
        checkoutUrl: payload.checkoutUrl,
        sessionId: payload.sessionId,
        amount: Number(payload.amount || 0),
        currency: payload.currency || 'EUR',
        paymentType: payload.paymentType || paymentType,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.bookings] });
      queryClient.invalidateQueries({ queryKey: bookingAdvancedKey(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: bookingPaymentsKey(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: bookingRemindersKey(variables.bookingId) });
    },
  });
}

export function useUpdateBookingFinanceSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      updates,
    }: {
      bookingId: string;
      updates: Partial<{
        total_price: number;
        quote_amount: number;
        deposit_amount: number;
        deposit_due_date: string | null;
        balance_due_date: string | null;
        auto_confirm_on_deposit: boolean;
        contract_required: boolean;
        cancellation_policy: string | null;
        can_reschedule: boolean;
        max_reschedules: number;
      }>;
    }) => {
      const { data: bookingSnapshot, error: bookingSnapshotError } = await fromTable('bookings')
        .select('status')
        .eq('id', bookingId)
        .single();
      if (bookingSnapshotError) throw bookingSnapshotError;

      const status = (bookingSnapshot as { status?: string | null })?.status;
      if (status === 'confirmed' || status === 'completed' || status === 'cancelled') {
        throw new Error('Le devis est verrouillé après confirmation de la réservation.');
      }

      const payload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await fromTable('bookings')
        .update(payload)
        .eq('id', bookingId);

      if (error) throw error;

      const { error: refreshError } = await supabase.rpc('refresh_booking_finance' as any, {
        p_booking_id: bookingId,
      });
      if (refreshError) throw refreshError;

      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.bookings] });
      queryClient.invalidateQueries({ queryKey: bookingAdvancedKey(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: bookingPaymentsKey(variables.bookingId) });
    },
  });
}

export function useBookingReminders(bookingId: string | undefined) {
  return useQuery({
    queryKey: bookingRemindersKey(bookingId),
    queryFn: async (): Promise<BookingReminder[]> => {
      if (!bookingId) return [];

      const { data, error } = await fromTable('booking_reminders')
        .select('*')
        .eq('booking_id', bookingId)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return (data || []) as BookingReminder[];
    },
    enabled: !!bookingId,
  });
}

export function useCreateBookingDefaultReminders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase.rpc('create_default_booking_reminders' as any, {
        p_booking_id: bookingId,
      });
      if (error) throw error;
      return Number(data || 0);
    },
    onSuccess: (_, bookingId) => {
      queryClient.invalidateQueries({ queryKey: bookingRemindersKey(bookingId) });
      queryClient.invalidateQueries({ queryKey: bookingAdvancedKey(bookingId) });
    },
  });
}

export function useSendBookingReminderNow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reminderId, message }: { reminderId: string; message?: string | null }) => {
      const { error } = await supabase.rpc('send_booking_reminder_now' as any, {
        p_reminder_id: reminderId,
        p_custom_message: message || null,
      });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.notifications] });
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.bookings] });
      queryClient.invalidateQueries({ queryKey: ['booking-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['booking-advanced'] });
    },
  });
}

export function useProviderCalendarSyncSettings(providerId: string | undefined | null) {
  return useQuery({
    queryKey: providerCalendarSyncKey(providerId),
    queryFn: async (): Promise<ProviderCalendarSyncSettings | null> => {
      if (!providerId) return null;

      const { data, error } = await fromTable('provider_calendar_sync_settings')
        .select('*')
        .eq('provider_id', providerId)
        .maybeSingle();

      if (error) throw error;
      return (data as ProviderCalendarSyncSettings) || null;
    },
    enabled: !!providerId,
  });
}

export function useUpsertProviderCalendarSyncSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      providerId,
      updates,
    }: {
      providerId: string;
      updates: Partial<{
        sync_mode: 'manual' | 'google_export' | 'apple_export';
        auto_block_confirmed: boolean;
        include_pending: boolean;
      }>;
    }) => {
      const payload = {
        provider_id: providerId,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await fromTable('provider_calendar_sync_settings')
        .upsert(payload, { onConflict: 'provider_id' })
        .select('*')
        .single();

      if (error) throw error;
      return data as ProviderCalendarSyncSettings;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: providerCalendarSyncKey(variables.providerId) });
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.bookings] });
      queryClient.setQueryData(providerCalendarSyncKey(variables.providerId), result);
    },
  });
}

export function useMyBookingRole(booking: Pick<BookingFinanceSnapshot, 'client_id' | 'provider_id'> | null | undefined) {
  const { userId, profile } = useAuth();

  if (!booking || !userId) {
    return {
      bookingRole: null as 'client' | 'provider' | null,
      isClient: false,
      isProvider: false,
      appRole: profile?.role || null,
    };
  }

  const isClient = booking.client_id === userId;
  const isProvider = !isClient && profile?.role === 'provider';

  return {
    bookingRole: isClient ? 'client' : isProvider ? 'provider' : null,
    isClient,
    isProvider,
    appRole: profile?.role || null,
  };
}

// ─── Contract hooks ──────────────────────────────────────────

export function useBookingContract(bookingId: string | undefined) {
  return useQuery({
    queryKey: bookingContractKey(bookingId),
    queryFn: async (): Promise<BookingContract | null> => {
      if (!bookingId) return null;

      const { data, error } = await fromTable('booking_contracts')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (error) throw error;
      return (data as BookingContract) || null;
    },
    enabled: !!bookingId,
  });
}

export function useBookingCompletionConfirmation(bookingId: string | undefined) {
  return useQuery({
    queryKey: bookingCompletionKey(bookingId),
    queryFn: async (): Promise<BookingCompletionConfirmation | null> => {
      if (!bookingId) return null;

      const { data, error } = await fromTable('booking_completion_confirmations')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (error) throw error;
      return (data as BookingCompletionConfirmation) || null;
    },
    enabled: !!bookingId,
  });
}

export function useUpsertBookingContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      title,
      body,
    }: {
      bookingId: string;
      title: string;
      body: string;
    }) => {
      const { data, error } = await supabase.rpc('upsert_booking_contract' as any, {
        p_booking_id: bookingId,
        p_title: title,
        p_body: body,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingContractKey(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: bookingAdvancedKey(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.bookings] });
    },
  });
}

export function useSignBookingContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      signatureName,
    }: {
      bookingId: string;
      signatureName?: string | null;
    }) => {
      const { data, error } = await supabase.rpc('sign_booking_contract' as any, {
        p_booking_id: bookingId,
        p_signature_name: signatureName ?? null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingContractKey(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: bookingAdvancedKey(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: bookingPaymentsKey(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.bookings] });
    },
  });
}
