import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export interface ClientStats {
    bookingsCount: number;
    favoritesCount: number;
    reviewsCount: number;
}

async function fetchClientStats(userId: string): Promise<ClientStats> {
    const [bookings, favorites, reviews] = await Promise.all([
        supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', userId),
        supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId),
        supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', userId),
    ]);

    return {
        bookingsCount: bookings.count || 0,
        favoritesCount: favorites.count || 0,
        reviewsCount: reviews.count || 0,
    };
}

export function useClientStats() {
    const { userId } = useAuth();

    return useQuery({
        queryKey: ['clientStats', userId],
        queryFn: () => fetchClientStats(userId!),
        enabled: !!userId,
    });
}
