/**
 * Hook enrichi pour le Jour J — calculs temps réel sur la timeline
 */

import { supabase } from '@/lib/supabase';
import { TimelineItem } from '@/types/eventFeatures';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTimeline } from './useTimeline';

// Helper pour les relations imbriquées
const fromTable = (table: string) => (supabase as any).from(table);

export interface JourJProvider {
  id: string;
  business_name: string;
  phone: string | null;
  conversationId: string | null;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface JourJTimelineData {
  items: TimelineItem[];
  currentItem: TimelineItem | null;
  nextItem: TimelineItem | null;
  progress: number;
  isEventDay: boolean;
  completedCount: number;
  totalCount: number;
  minutesUntilNext: number | null;
  currentTimeFormatted: string;
}

/**
 * Hook principal — timeline enrichie avec calculs temps réel
 */
export function useJourJTimeline(eventId: string | undefined, eventDate: string | undefined): JourJTimelineData {
  const { data: items = [] } = useTimeline(eventId);
  const [now, setNow] = useState(new Date());

  // Refresh toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const isEventDay = useMemo(() => {
    if (!eventDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return eventDate === today;
  }, [eventDate, now]);

  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  const currentTimeFormatted = useMemo(() => {
    return now.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });
  }, [now]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [items]
  );

  const parseTime = useCallback((time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  }, []);

  const currentItem = useMemo(() => {
    if (!isEventDay || sortedItems.length === 0) return null;

    for (const item of sortedItems) {
      const startMin = parseTime(item.start_time);
      const endMin = item.end_time ? parseTime(item.end_time) : startMin + (item.duration_minutes || 30);

      if (currentTimeMinutes >= startMin && currentTimeMinutes < endMin) {
        return item;
      }
    }
    return null;
  }, [sortedItems, currentTimeMinutes, isEventDay, parseTime]);

  const nextItem = useMemo(() => {
    if (!isEventDay || sortedItems.length === 0) return null;

    for (const item of sortedItems) {
      const startMin = parseTime(item.start_time);
      if (startMin > currentTimeMinutes && !item.is_completed) {
        return item;
      }
    }
    return null;
  }, [sortedItems, currentTimeMinutes, isEventDay, parseTime]);

  const minutesUntilNext = useMemo(() => {
    if (!nextItem) return null;
    const nextStartMin = parseTime(nextItem.start_time);
    return nextStartMin - currentTimeMinutes;
  }, [nextItem, currentTimeMinutes, parseTime]);

  const completedCount = useMemo(
    () => items.filter((i) => i.is_completed).length,
    [items]
  );

  const progress = useMemo(
    () => (items.length > 0 ? completedCount / items.length : 0),
    [completedCount, items.length]
  );

  return {
    items: sortedItems,
    currentItem,
    nextItem,
    progress,
    isEventDay,
    completedCount,
    totalCount: items.length,
    minutesUntilNext,
    currentTimeFormatted,
  };
}

/**
 * Hook pour les prestataires liés aux timeline items (via vendor_id)
 */
export function useJourJVendors(eventId: string | undefined) {
  return useQuery({
    queryKey: ['jourj', 'vendors', eventId],
    queryFn: async (): Promise<JourJProvider[]> => {
      if (!eventId) return [];

      // 1. Récupérer les vendor_ids des timeline items
      const { data: timelineItems } = await fromTable('timeline_items')
        .select('vendor_id')
        .eq('event_id', eventId)
        .not('vendor_id', 'is', null);

      if (!timelineItems || timelineItems.length === 0) return [];

      const vendorIds = [...new Set((timelineItems as any[]).map((t) => t.vendor_id))];

      // 2. Récupérer les prestataires
      const { data: providers, error } = await fromTable('providers')
        .select(`
          id,
          business_name,
          phone,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .in('id', vendorIds);

      if (error) throw error;
      if (!providers) return [];

      // 3. Récupérer les conversations liées (optionnel)
      const { data: bookings } = await fromTable('bookings')
        .select('provider_id, conversation_id')
        .eq('event_id', eventId)
        .in('provider_id', vendorIds);

      const conversationMap = new Map<string, string>();
      for (const b of (bookings || []) as any[]) {
        if (b.conversation_id) {
          conversationMap.set(b.provider_id, b.conversation_id);
        }
      }

      return (providers as any[]).map((p) => ({
        id: p.id,
        business_name: p.business_name,
        phone: p.phone,
        profiles: p.profiles,
        conversationId: conversationMap.get(p.id) || null,
      })) as JourJProvider[];
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
  });
}
