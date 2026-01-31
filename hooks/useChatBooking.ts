import { Config } from '@/constants/Config';
import { BookingStatus, supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useChatBooking(conversationId: string | undefined) {
    const queryClient = useQueryClient();

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

            // Find the LATEST PENDING booking between these two
            const { data: booking, error } = await supabase
                .from('bookings')
                .select(`
          *,
          services (name, price, duration_minutes),
          profiles:client_id (full_name)
        `)
                .eq('client_id', conversation.client_id)
                .eq('provider_id', conversation.provider_id)
                .eq('status', 'pending') // Only interested in pending ones for action
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
            return booking || null;
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
            const { data, error } = await supabase
                .from('bookings')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', bookingId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            // Refresh chat booking and general bookings
            queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.bookings] });
        },
    });

    return {
        booking: bookingQuery.data,
        isLoading: bookingQuery.isLoading,
        updateStatus: updateStatusMutation.mutateAsync,
        isUpdating: updateStatusMutation.isPending,
    };
}
