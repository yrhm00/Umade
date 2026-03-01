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

      const daysInMonth = new Date(year, month, 0).getDate();
      const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      // Fetch blocked dates ET créneaux réels en parallèle
      const [providerResult, availabilityResult] = await Promise.all([
        supabase
          .from('providers')
          .select('blocked_dates')
          .eq('id', providerId)
          .single(),
        supabase
          .from('availabilities')
          .select('date, start_time, end_time')
          .eq('provider_id', providerId)
          .gte('date', firstDay)
          .lte('date', lastDay),
      ]);

      if (providerResult.error) throw providerResult.error;

      const blockedPeriods = (providerResult.data?.blocked_dates as unknown as BlockedPeriod[]) || [];

      // Construire un Map des créneaux réels par date
      const slotsMap = new Map<string, { start_time: string; end_time: string }[]>();
      (availabilityResult.data || []).forEach((a) => {
        const existing = slotsMap.get(a.date) || [];
        existing.push({ start_time: a.start_time, end_time: a.end_time });
        slotsMap.set(a.date, existing);
      });

      const dayMap = new Map<string, DayAvailability>();
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        const isPast = dateStr < todayStr;
        const isBlocked = isDateBlocked(dateStr, blockedPeriods);
        const isAvailable = !isPast && !isBlocked;

        // Utiliser les vrais créneaux si disponibles, sinon fallback sur le dummy slot
        const realSlots = slotsMap.get(dateStr);
        dayMap.set(dateStr, {
          date: dateStr,
          isAvailable,
          slots: isAvailable ? (realSlots || [{ start_time: '00:00', end_time: '23:59' }]) : [],
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
 * Utilise le RPC get_available_slots si disponible, sinon fallback sur query directe.
 */
export function useAvailableSlots(
  providerId: string | undefined,
  date: string | undefined
) {
  return useQuery({
    queryKey: [Config.cacheKeys.availability, 'slots', providerId, date],
    queryFn: async (): Promise<{ start_time: string; end_time: string }[]> => {
      if (!providerId || !date) return [];

      // Tenter d'utiliser le RPC get_available_slots
      const { data, error } = await supabase.rpc('get_available_slots' as any, {
        p_provider_id: providerId,
        p_date: date,
      });

      if (error) {
        // Fallback : query directe sur la table availabilities
        const { data: slots, error: slotsError } = await supabase
          .from('availabilities')
          .select('start_time, end_time')
          .eq('provider_id', providerId)
          .eq('date', date);

        if (slotsError) throw slotsError;
        return (slots || []).map((slot) => ({
          start_time: slot.start_time,
          end_time: slot.end_time,
        }));
      }

      return (data || []).map((slot: any) => ({
        start_time: slot.start_time,
        end_time: slot.end_time,
      }));
    },
    enabled: !!providerId && !!date,
    staleTime: 1000 * 60 * 5,
  });
}
