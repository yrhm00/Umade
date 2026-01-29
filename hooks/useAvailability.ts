/**
 * Hook pour gérer les disponibilités des prestataires
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Config } from '@/constants/Config';
import { Availability, DayAvailability } from '@/types';

async function fetchProviderAvailability(
  providerId: string,
  year: number,
  month: number
): Promise<Availability[]> {
  // month is 1-indexed
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('availabilities')
    .select('*')
    .eq('provider_id', providerId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function fetchDateSlots(
  providerId: string,
  date: string
): Promise<Availability[]> {
  const { data, error } = await supabase
    .from('availabilities')
    .select('*')
    .eq('provider_id', providerId)
    .eq('date', date)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Check which dates already have confirmed bookings
async function fetchBookedDates(
  providerId: string,
  year: number,
  month: number
): Promise<Set<string>> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('bookings')
    .select('booking_date')
    .eq('provider_id', providerId)
    .in('status', ['confirmed', 'pending'])
    .gte('booking_date', startDate)
    .lte('booking_date', endDate);

  if (error) throw error;

  const dates = new Set<string>();
  for (const b of data || []) {
    dates.add(b.booking_date);
  }
  return dates;
}

/**
 * Récupère les disponibilités d'un prestataire pour un mois donné.
 * Retourne un Map de date -> DayAvailability pour faciliter le lookup.
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

      const [availabilities, bookedDates] = await Promise.all([
        fetchProviderAvailability(providerId, year, month),
        fetchBookedDates(providerId, year, month),
      ]);

      const dayMap = new Map<string, DayAvailability>();

      // Group slots by date
      for (const slot of availabilities) {
        const existing = dayMap.get(slot.date);
        if (existing) {
          existing.slots.push({
            start_time: slot.start_time,
            end_time: slot.end_time,
          });
        } else {
          dayMap.set(slot.date, {
            date: slot.date,
            isAvailable: !bookedDates.has(slot.date),
            slots: [
              {
                start_time: slot.start_time,
                end_time: slot.end_time,
              },
            ],
          });
        }
      }

      return dayMap;
    },
    enabled: !!providerId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Récupère les créneaux disponibles pour un prestataire à une date donnée.
 */
export function useAvailableSlots(
  providerId: string | undefined,
  date: string | undefined
) {
  return useQuery({
    queryKey: [Config.cacheKeys.availability, 'slots', providerId, date],
    queryFn: async (): Promise<{ start_time: string; end_time: string }[]> => {
      if (!providerId || !date) return [];

      const slots = await fetchDateSlots(providerId, date);
      return slots.map((s) => ({
        start_time: s.start_time,
        end_time: s.end_time,
      }));
    },
    enabled: !!providerId && !!date,
    staleTime: 1000 * 60 * 2,
  });
}
