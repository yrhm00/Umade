/**
 * Hook pour gérer les revenus du provider
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export type RevenuePeriod = 'week' | 'month' | 'year' | 'all';

const REVENUE_PERIOD_KEY = '@umade_revenue_period';

interface RevenueData {
    total: number;
    count: number;
    period: RevenuePeriod;
    periodLabel: string;
}

interface RevenueDetails {
    totalAllTime: number;
    totalThisYear: number;
    totalThisMonth: number;
    totalThisWeek: number;
    countAllTime: number;
    countThisYear: number;
    countThisMonth: number;
    countThisWeek: number;
    bookingsByMonth: Array<{
        month: string;
        total: number;
        count: number;
    }>;
    recentBookings: Array<{
        id: string;
        booking_date: string;
        total_price: number;
        status: string;
        client_name: string;
        service_name: string;
    }>;
}

function getStartOfPeriod(period: RevenuePeriod): Date | null {
    const now = new Date();

    switch (period) {
        case 'week': {
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Start from Monday
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - diff);
            startOfWeek.setHours(0, 0, 0, 0);
            return startOfWeek;
        }
        case 'month': {
            return new Date(now.getFullYear(), now.getMonth(), 1);
        }
        case 'year': {
            return new Date(now.getFullYear(), 0, 1);
        }
        case 'all':
        default:
            return null;
    }
}

function getPeriodLabel(period: RevenuePeriod): string {
    switch (period) {
        case 'week':
            return 'Cette semaine';
        case 'month':
            return 'Ce mois';
        case 'year':
            return 'Cette année';
        case 'all':
        default:
            return 'Total';
    }
}

async function fetchProviderRevenue(
    userId: string,
    period: RevenuePeriod
): Promise<RevenueData> {
    // Get provider ID
    const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (!provider) {
        return { total: 0, count: 0, period, periodLabel: getPeriodLabel(period) };
    }

    // Build query for completed bookings
    let query = supabase
        .from('bookings')
        .select('total_price')
        .eq('provider_id', provider.id)
        .eq('status', 'completed');

    const startDate = getStartOfPeriod(period);
    if (startDate) {
        query = query.gte('booking_date', startDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) throw error;

    const bookings = data || [];
    const total = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

    return {
        total,
        count: bookings.length,
        period,
        periodLabel: getPeriodLabel(period),
    };
}

async function fetchProviderRevenueDetails(userId: string): Promise<RevenueDetails> {
    // Get provider ID
    const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (!provider) {
        return {
            totalAllTime: 0,
            totalThisYear: 0,
            totalThisMonth: 0,
            totalThisWeek: 0,
            countAllTime: 0,
            countThisYear: 0,
            countThisMonth: 0,
            countThisWeek: 0,
            bookingsByMonth: [],
            recentBookings: [],
        };
    }

    // Fetch all completed bookings
    const { data: allBookings, error } = await supabase
        .from('bookings')
        .select(`
      id,
      booking_date,
      total_price,
      status,
      profiles:client_id(full_name),
      services(name)
    `)
        .eq('provider_id', provider.id)
        .eq('status', 'completed')
        .order('booking_date', { ascending: false });

    if (error) throw error;

    const bookings = allBookings || [];
    const now = new Date();

    // Calculate period dates
    const startOfWeek = getStartOfPeriod('week')!;
    const startOfMonth = getStartOfPeriod('month')!;
    const startOfYear = getStartOfPeriod('year')!;

    // Calculate totals for each period
    let totalAllTime = 0;
    let totalThisYear = 0;
    let totalThisMonth = 0;
    let totalThisWeek = 0;
    let countAllTime = 0;
    let countThisYear = 0;
    let countThisMonth = 0;
    let countThisWeek = 0;

    const monthlyData: Record<string, { total: number; count: number }> = {};

    for (const booking of bookings) {
        const amount = booking.total_price || 0;
        const bookingDate = new Date(booking.booking_date);

        totalAllTime += amount;
        countAllTime++;

        if (bookingDate >= startOfYear) {
            totalThisYear += amount;
            countThisYear++;
        }

        if (bookingDate >= startOfMonth) {
            totalThisMonth += amount;
            countThisMonth++;
        }

        if (bookingDate >= startOfWeek) {
            totalThisWeek += amount;
            countThisWeek++;
        }

        // Group by month for chart
        const monthKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { total: 0, count: 0 };
        }
        monthlyData[monthKey].total += amount;
        monthlyData[monthKey].count++;
    }

    // Convert monthly data to array (last 12 months)
    const bookingsByMonth: RevenueDetails['bookingsByMonth'] = [];
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short' });

        bookingsByMonth.push({
            month: monthLabel,
            total: monthlyData[monthKey]?.total || 0,
            count: monthlyData[monthKey]?.count || 0,
        });
    }

    // Get recent bookings (last 10)
    const recentBookings = bookings.slice(0, 10).map((b) => ({
        id: b.id,
        booking_date: b.booking_date,
        total_price: b.total_price || 0,
        status: b.status || 'completed',
        client_name: (b.profiles as { full_name: string | null })?.full_name || 'Client',
        service_name: (b.services as { name: string })?.name || 'Service',
    }));

    return {
        totalAllTime,
        totalThisYear,
        totalThisMonth,
        totalThisWeek,
        countAllTime,
        countThisYear,
        countThisMonth,
        countThisWeek,
        bookingsByMonth,
        recentBookings,
    };
}

export function useRevenuePeriod() {
    const [period, setPeriodState] = useState<RevenuePeriod>('month');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(REVENUE_PERIOD_KEY).then((stored) => {
            if (stored && ['week', 'month', 'year', 'all'].includes(stored)) {
                setPeriodState(stored as RevenuePeriod);
            }
            setIsLoaded(true);
        });
    }, []);

    const setPeriod = useCallback(async (newPeriod: RevenuePeriod) => {
        setPeriodState(newPeriod);
        await AsyncStorage.setItem(REVENUE_PERIOD_KEY, newPeriod);
    }, []);

    return { period, setPeriod, isLoaded };
}

export function useProviderRevenue(period: RevenuePeriod) {
    const { userId, isProvider } = useAuth();

    return useQuery({
        queryKey: [Config.cacheKeys.providers, 'revenue', userId, period],
        queryFn: () => fetchProviderRevenue(userId!, period),
        enabled: !!userId && isProvider,
        staleTime: 1000 * 60, // 1 minute
    });
}

export function useProviderRevenueDetails() {
    const { userId, isProvider } = useAuth();

    return useQuery({
        queryKey: [Config.cacheKeys.providers, 'revenue-details', userId],
        queryFn: () => fetchProviderRevenueDetails(userId!),
        enabled: !!userId && isProvider,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
