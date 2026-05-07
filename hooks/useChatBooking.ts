import { Config } from '@/constants/Config';
import { BookingStatus, supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export function useChatBooking(conversationId: string | undefined) {
    const queryClient = useQueryClient();
    const { userId } = useAuth();

    // 1. Fetch the relevant booking
    const bookingQuery = useQuery({
        queryKey: [Config.cacheKeys.bookings, 'chat', conversationId],
        queryFn: async () => {
            if (!conversationId) return null;

            // Get conversation details to know participants
            const { data: conversation } = await supabase
                .from('conversations')
                .select('client_id, provider_id')
                .eq('id', conversationId)
                .single();

            if (!conversation) return null;

            // Fetch all actionable bookings between these two participants
            const { data: bookings, error } = await supabase
                .from('bookings')
                .select(`
          *,
          services (name, price, duration_minutes),
          profiles:client_id (full_name)
        `)
                .eq('client_id', conversation.client_id)
                .eq('provider_id', conversation.provider_id)
                .in('status', ['pending', 'confirmed'])
                .order('booking_date', { ascending: true });

            if (error) throw error;
            return bookings ?? [];
        },
        enabled: !!conversationId,
    });

    // 2. Mutation to update status
    const updateStatusMutation = useMutation({
        mutationFn: async ({
            bookingId,
            status
        }: {
            bookingId: string;
            status: BookingStatus
        }) => {
            const now = new Date().toISOString();
            const updates: Record<string, unknown> = {
                status,
                updated_at: now,
            };

            if (status === 'confirmed') {
                updates.confirmed_at = now;
            } else if (status === 'cancelled') {
                updates.cancelled_at = now;
            }

            const { data, error } = await supabase
                .from('bookings')
                .update(updates)
                .eq('id', bookingId)
                .select('id, booking_date, start_time, status')
                .single();

            if (error) throw error;

            if (conversationId && userId) {
                const { data: bookingDetails } = await supabase
                    .from('bookings')
                    .select(`
                        id,
                        booking_date,
                        start_time,
                        total_price,
                        services (name, price)
                    `)
                    .eq('id', bookingId)
                    .single();

                const bookingDate = bookingDetails?.booking_date
                    ? new Date(bookingDetails.booking_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                    })
                    : null;
                const bookingTime = bookingDetails?.start_time ? bookingDetails.start_time.slice(0, 5) : null;

                const humanMessage =
                    status === 'confirmed'
                        ? `Réservation confirmée${bookingDate ? ` pour le ${bookingDate}` : ''}${bookingTime ? ` à ${bookingTime}` : ''}.`
                        : status === 'cancelled'
                            ? `Demande refusée${bookingDate ? ` (${bookingDate}${bookingTime ? `, ${bookingTime}` : ''})` : ''}.`
                            : `Statut de la réservation mis à jour: ${status}.`;

                const content = JSON.stringify({
                    type: 'booking_status_update',
                    booking_id: bookingId,
                    status,
                    service_name: bookingDetails?.services?.name ?? null,
                    booking_date: bookingDetails?.booking_date ?? data?.booking_date ?? null,
                    start_time: bookingDetails?.start_time ?? data?.start_time ?? null,
                    price:
                        bookingDetails?.total_price ??
                        bookingDetails?.services?.price ??
                        null,
                    message: humanMessage,
                });

                const { error: messageError } = await supabase
                    .from('messages')
                    .insert({
                        conversation_id: conversationId,
                        sender_id: userId,
                        content,
                    });

                if (messageError) {
                    // On garde la mutation booking prioritaire, même si le message auto échoue.
                    console.warn('[useChatBooking] Auto message failed:', messageError.message);
                }
            }

            return data;
        },
        onSuccess: () => {
            // Refresh chat booking and general bookings
            queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.bookings] });
            queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.providers] });
            queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.conversations] });
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        },
    });

    const bookings = bookingQuery.data ?? [];

    return {
        bookings,
        booking: bookings[0] ?? null,
        isLoading: bookingQuery.isLoading,
        updateStatus: updateStatusMutation.mutateAsync,
        isUpdating: updateStatusMutation.isPending,
    };
}
