/**
 * Hook pour gérer les disponibilités des prestataires
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import { DayAvailability } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { BlockedPeriod } from './useBlockedDates';

// Helper to check if a date is blocked based on blocked periods
function isDateBlocked(date: string, blockedPeriods: BlockedPeriod[]): boolean {
  for (const period of blockedPeriods) {
    if (date >= period.start && date <= period.end) {
      return true;
    }
  }
  return false;
}

/**
 * Récupère les disponibilités d'un prestataire pour un mois donné.
 * Retourne un Map de date -> DayAvailability pour faciliter le lookup.
 * 
 * Nouvelle logique (Day-based):
 * - Un jour est disponible s'il n'est pas dans le passé
 * - ET s'il n'est pas dans une période bloquée (blocked_dates)
 */
export function useProviderAvailability(
  providerId: string | undefined,
  year: number,
  month: number
) {
  return useQuery({
    queryKey: [Config.cacheKeys.availability, providerId, year, month],
    queryFn: async (): Promise<Map<string, DayAvailability>> => {
      if (!providerId) return new Map();

      // 1. Récupérer les dates bloquées du provider
      const { data: provider, error } = await supabase
        .from('providers')
        .select('blocked_dates')
        .eq('id', providerId)
        .single();

      if (error) throw error;

      const blockedPeriods = (provider?.blocked_dates as BlockedPeriod[]) || [];
      const dayMap = new Map<string, DayAvailability>();

      const daysInMonth = new Date(year, month, 0).getDate();
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Générer tous les jours du mois
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        // Vérifier si le jour est disponible
        const isPast = dateStr < todayStr;
        const isBlocked = isDateBlocked(dateStr, blockedPeriods);
        const isAvailable = !isPast && !isBlocked;

        dayMap.set(dateStr, {
          date: dateStr,
          isAvailable,
          slots: isAvailable ? [{ start_time: '00:00', end_time: '23:59' }] : [], // Dummy slot allows selection
        });
      }

      return dayMap;
    },
    enabled: !!providerId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Récupère les créneaux disponibles pour un prestataire à une date donnée.
 * (Deprecated but kept for compatibility if needed, returns empty or dummy)
 */
export function useAvailableSlots(
  providerId: string | undefined,
  date: string | undefined
) {
  return useQuery({
    queryKey: [Config.cacheKeys.availability, 'slots', providerId, date],
    queryFn: async (): Promise<{ start_time: string; end_time: string }[]> => {
      // Always return generic booking range or empty
      return [];
    },
    enabled: !!providerId && !!date,
    staleTime: Infinity,
  });
}
