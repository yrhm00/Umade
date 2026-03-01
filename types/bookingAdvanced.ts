export type BookingPaymentType = 'deposit' | 'balance' | 'full' | 'refund';
export type BookingPaymentState = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type BookingFinanceStatus =
  | 'unpaid'
  | 'deposit_pending'
  | 'deposit_paid'
  | 'paid'
  | 'refunded'
  | 'cancelled';

export interface BookingPayment {
  id: string;
  booking_id: string;
  payment_type: BookingPaymentType;
  amount: number;
  currency: string;
  status: BookingPaymentState;
  due_date: string | null;
  paid_at: string | null;
  transaction_ref: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingContract {
  id: string;
  booking_id: string;
  title: string;
  body: string;
  version: number;
  provider_signature_name: string | null;
  provider_signed_at: string | null;
  provider_signature_place: string | null;
  client_signature_name: string | null;
  client_signed_at: string | null;
  client_signature_place: string | null;
  attachment_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingCompletionConfirmation {
  booking_id: string;
  provider_confirmed_by: string | null;
  provider_confirmed_at: string | null;
  provider_note: string | null;
  client_confirmed_by: string | null;
  client_confirmed_at: string | null;
  client_note: string | null;
  created_at: string;
  updated_at: string;
}

export type BookingReminderType = 'rsvp' | 'deposit' | 'balance' | 'contract' | 'event_day' | 'custom';
export type BookingReminderTargetRole = 'client' | 'provider' | 'both';
export type BookingReminderChannel = 'in_app' | 'email' | 'sms';
export type BookingReminderStatus = 'scheduled' | 'sent' | 'failed' | 'cancelled';

export interface BookingReminder {
  id: string;
  booking_id: string;
  reminder_type: BookingReminderType;
  target_role: BookingReminderTargetRole;
  channel: BookingReminderChannel;
  scheduled_for: string;
  sent_at: string | null;
  status: BookingReminderStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export type BookingRescheduleRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export type BookingRescheduleRequestRole = 'client' | 'provider';

export interface BookingRescheduleRequest {
  id: string;
  booking_id: string;
  requested_by: string;
  requested_role: BookingRescheduleRequestRole;
  current_date: string;
  current_start_time: string | null;
  proposed_date: string;
  proposed_start_time: string | null;
  reason: string | null;
  status: BookingRescheduleRequestStatus;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingFinanceSnapshot {
  id: string;
  status: string | null;
  quote_amount: number;
  total_price: number;
  deposit_amount: number;
  deposit_due_date: string | null;
  deposit_paid_amount: number;
  deposit_paid_at: string | null;
  balance_amount: number;
  balance_due_date: string | null;
  balance_paid_amount: number;
  balance_paid_at: string | null;
  payment_status: BookingFinanceStatus;
  auto_confirm_on_deposit: boolean;
  contract_required: boolean;
  cancellation_policy: string | null;
  can_reschedule: boolean;
  max_reschedules: number;
  reschedule_count: number;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  provider_id: string;
  client_id: string;
}

export type ProviderCalendarSyncMode = 'manual' | 'google_export' | 'apple_export';

export interface ProviderCalendarSyncSettings {
  id: string;
  provider_id: string;
  sync_mode: ProviderCalendarSyncMode;
  auto_block_confirmed: boolean;
  include_pending: boolean;
  ics_secret: string;
  last_exported_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestGroupInvite {
  id: string;
  group_id: string;
  event_id: string;
  token: string;
  is_active: boolean;
  expires_at: string;
  created_by: string | null;
  last_response_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestGroupRsvpPayload {
  group_id: string;
  event_id: string;
  event_title: string;
  group_name: string;
  member_count: number;
  status: string;
  confirmed_adults: number;
  confirmed_children: number;
  response_note: string | null;
  contact_name: string | null;
}
