/**
 * Hook pour gérer les dates bloquées (vacances, congés) des prestataires
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export interface BlockedPeriod {
    start: string; // YYYY-MM-DD
    end: string; // YYYY-MM-DD
    reason?: string;
}

/**
 * Récupère les dates bloquées du provider connecté
 */
export function useBlockedDates() {
    const { userId } = useAuth();

    return useQuery({
        queryKey: ['blocked-dates', userId],
        queryFn: async (): Promise<BlockedPeriod[]> => {
            if (!userId) return [];

            const { data, error } = await supabase
                .from('providers')
                .select('blocked_dates')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return (data?.blocked_dates as BlockedPeriod[]) || [];
        },
        enabled: !!userId,
    });
}

/**
 * Récupère les dates bloquées d'un provider spécifique (pour les clients)
 */
export function useProviderBlockedDates(providerId: string | undefined) {
    return useQuery({
        queryKey: ['blocked-dates', 'provider', providerId],
        queryFn: async (): Promise<BlockedPeriod[]> => {
            if (!providerId) return [];

            const { data, error } = await supabase
                .from('providers')
                .select('blocked_dates')
                .eq('id', providerId)
                .single();

            if (error) throw error;
            return (data?.blocked_dates as BlockedPeriod[]) || [];
        },
        enabled: !!providerId,
    });
}

/**
 * Ajouter une période bloquée
 */
export function useAddBlockedPeriod() {
    const queryClient = useQueryClient();
    const { userId } = useAuth();

    return useMutation({
        mutationFn: async (newPeriod: BlockedPeriod) => {
            if (!userId) throw new Error('Non authentifié');

            // Récupérer les périodes existantes
            const { data: provider, error: fetchError } = await supabase
                .from('providers')
                .select('id, blocked_dates')
                .eq('user_id', userId)
                .single();

            if (fetchError) throw fetchError;

            const existingPeriods = (provider?.blocked_dates as BlockedPeriod[]) || [];
            const updatedPeriods = [...existingPeriods, newPeriod];

            // Trier par date de début
            updatedPeriods.sort((a, b) => a.start.localeCompare(b.start));

            // Mettre à jour
            const { error: updateError } = await supabase
                .from('providers')
                .update({ blocked_dates: updatedPeriods })
                .eq('id', provider.id);

            if (updateError) throw updateError;

            return updatedPeriods;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
            queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.availability] });
        },
    });
}

/**
 * Supprimer une période bloquée
 */
export function useDeleteBlockedPeriod() {
    const queryClient = useQueryClient();
    const { userId } = useAuth();

    return useMutation({
        mutationFn: async (periodIndex: number) => {
            if (!userId) throw new Error('Non authentifié');

            // Récupérer les périodes existantes
            const { data: provider, error: fetchError } = await supabase
                .from('providers')
                .select('id, blocked_dates')
                .eq('user_id', userId)
                .single();

            if (fetchError) throw fetchError;

            const existingPeriods = (provider?.blocked_dates as BlockedPeriod[]) || [];
            const updatedPeriods = existingPeriods.filter((_, index) => index !== periodIndex);

            // Mettre à jour
            const { error: updateError } = await supabase
                .from('providers')
                .update({ blocked_dates: updatedPeriods })
                .eq('id', provider.id);

            if (updateError) throw updateError;

            return updatedPeriods;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
            queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.availability] });
        },
    });
}

/**
 * Vérifie si une date est dans une période bloquée
 */
export function isDateBlocked(date: string, blockedPeriods: BlockedPeriod[]): boolean {
    for (const period of blockedPeriods) {
        if (date >= period.start && date <= period.end) {
            return true;
        }
    }
    return false;
}
