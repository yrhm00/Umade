/**
 * Page des statistiques pour le provider
 */

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    BarChart3,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Star,
    TrendingUp,
    User,
    Users,
    XCircle
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ProviderStats {
    // Bookings
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    pendingBookings: number;
    // Revenue
    totalRevenue: number;
    averageBookingValue: number;
    // Clients
    totalClients: number;
    returningClients: number;
    // Reviews
    totalReviews: number;
    averageRating: number;
    // Time-based stats
    bookingsThisMonth: number;
    revenueThisMonth: number;
    bookingsLastMonth: number;
    revenueLastMonth: number;
    // Monthly breakdown
    monthlyData: Array<{
        month: string;
        bookings: number;
        revenue: number;
    }>;
}

interface BookingHistoryItem {
    id: string;
    booking_date: string;
    start_time: string;
    status: string;
    total_price: number;
    client_name: string;
    client_avatar: string | null;
    service_name: string;
    service_duration: number;
}

interface BookingHistory {
    items: BookingHistoryItem[];
    groupedByMonth: Record<string, BookingHistoryItem[]>;
}

async function fetchBookingHistory(userId: string): Promise<BookingHistory> {
    const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (!provider) {
        return { items: [], groupedByMonth: {} };
    }

    const { data: bookings } = await supabase
        .from('bookings')
        .select(`
            id,
            booking_date,
            start_time,
            status,
            total_price,
            profiles:client_id (full_name, avatar_url),
            services:service_id (name, duration_minutes)
        `)
        .eq('provider_id', provider.id)
        .in('status', ['completed', 'cancelled'])
        .order('booking_date', { ascending: false })
        .limit(100);

    const items: BookingHistoryItem[] = (bookings || []).map((b: any) => ({
        id: b.id,
        booking_date: b.booking_date,
        start_time: b.start_time || '00:00',
        status: b.status,
        total_price: b.total_price || 0,
        client_name: b.profiles?.full_name || 'Client inconnu',
        client_avatar: b.profiles?.avatar_url || null,
        service_name: b.services?.name || 'Service',
        service_duration: b.services?.duration_minutes || 60,
    }));

    // Group by month
    const groupedByMonth: Record<string, BookingHistoryItem[]> = {};
    items.forEach((item) => {
        const date = new Date(item.booking_date);
        const monthKey = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        if (!groupedByMonth[monthKey]) {
            groupedByMonth[monthKey] = [];
        }
        groupedByMonth[monthKey].push(item);
    });

    return { items, groupedByMonth };
}

async function fetchProviderStats(userId: string): Promise<ProviderStats> {
    // Get provider ID
    const { data: provider } = await supabase
        .from('providers')
        .select('id, average_rating, review_count')
        .eq('user_id', userId)
        .single();

    if (!provider) {
        return getEmptyStats();
    }

    // Get all bookings
    const { data: bookings } = await supabase
        .from('bookings')
        .select('id, status, total_price, booking_date, client_id, created_at')
        .eq('provider_id', provider.id);

    const allBookings = bookings || [];

    // Calculate dates
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Calculate booking stats
    const completedBookings = allBookings.filter(b => b.status === 'completed');
    const cancelledBookings = allBookings.filter(b => b.status === 'cancelled');
    const pendingBookings = allBookings.filter(b => b.status === 'pending' || b.status === 'confirmed');

    // Revenue
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const averageBookingValue = completedBookings.length > 0
        ? totalRevenue / completedBookings.length
        : 0;

    // Clients
    const uniqueClients = new Set(allBookings.map(b => b.client_id));
    const clientBookingCounts: Record<string, number> = {};
    allBookings.forEach(b => {
        if (b.client_id) {
            clientBookingCounts[b.client_id] = (clientBookingCounts[b.client_id] || 0) + 1;
        }
    });
    const returningClients = Object.values(clientBookingCounts).filter(count => count > 1).length;

    // This month stats
    const bookingsThisMonth = allBookings.filter(b =>
        new Date(b.booking_date) >= startOfThisMonth
    );
    const completedThisMonth = bookingsThisMonth.filter(b => b.status === 'completed');
    const revenueThisMonth = completedThisMonth.reduce((sum, b) => sum + (b.total_price || 0), 0);

    // Last month stats
    const bookingsLastMonth = allBookings.filter(b => {
        const date = new Date(b.booking_date);
        return date >= startOfLastMonth && date <= endOfLastMonth;
    });
    const completedLastMonth = bookingsLastMonth.filter(b => b.status === 'completed');
    const revenueLastMonth = completedLastMonth.reduce((sum, b) => sum + (b.total_price || 0), 0);

    // Monthly data for chart (last 6 months)
    const monthlyData: ProviderStats['monthlyData'] = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthBookings = allBookings.filter(b => {
            const bDate = new Date(b.booking_date);
            return bDate >= monthStart && bDate <= monthEnd && b.status === 'completed';
        });

        monthlyData.push({
            month: date.toLocaleDateString('fr-FR', { month: 'short' }),
            bookings: monthBookings.length,
            revenue: monthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
        });
    }

    return {
        totalBookings: allBookings.length,
        completedBookings: completedBookings.length,
        cancelledBookings: cancelledBookings.length,
        pendingBookings: pendingBookings.length,
        totalRevenue,
        averageBookingValue,
        totalClients: uniqueClients.size,
        returningClients,
        totalReviews: provider.review_count || 0,
        averageRating: provider.average_rating || 0,
        bookingsThisMonth: bookingsThisMonth.length,
        revenueThisMonth,
        bookingsLastMonth: bookingsLastMonth.length,
        revenueLastMonth,
        monthlyData,
    };
}

function getEmptyStats(): ProviderStats {
    return {
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        pendingBookings: 0,
        totalRevenue: 0,
        averageBookingValue: 0,
        totalClients: 0,
        returningClients: 0,
        totalReviews: 0,
        averageRating: 0,
        bookingsThisMonth: 0,
        revenueThisMonth: 0,
        bookingsLastMonth: 0,
        revenueLastMonth: 0,
        monthlyData: [],
    };
}

type TabType = 'overview' | 'bookings' | 'clients' | 'history';

export default function ProviderStatsScreen() {
    const router = useRouter();
    const { userId } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

    const {
        data: stats,
        isLoading,
        refetch,
        isRefetching,
    } = useQuery({
        queryKey: ['provider', 'stats', userId],
        queryFn: () => fetchProviderStats(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5,
    });

    const {
        data: history,
        isLoading: historyLoading,
        refetch: refetchHistory,
    } = useQuery({
        queryKey: ['provider', 'history', userId],
        queryFn: () => fetchBookingHistory(userId!),
        enabled: !!userId && activeTab === 'history',
        staleTime: 1000 * 60 * 5,
    });

    const calculateGrowth = (current: number, previous: number): string => {
        if (previous === 0) return current > 0 ? '+100%' : '0%';
        const growth = ((current - previous) / previous) * 100;
        return `${growth >= 0 ? '+' : ''}${growth.toFixed(0)}%`;
    };

    const getGrowthColor = (current: number, previous: number): string => {
        if (current > previous) return Colors.success.DEFAULT;
        if (current < previous) return Colors.error.DEFAULT;
        return Colors.text.secondary;
    };

    const renderChart = () => {
        if (!stats?.monthlyData.length) return null;

        const maxValue = Math.max(...stats.monthlyData.map(m => m.revenue), 1);
        const barWidth = (SCREEN_WIDTH - 80) / 6 - 8;

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Revenus des 6 derniers mois</Text>
                <View style={styles.chart}>
                    {stats.monthlyData.map((month, index) => {
                        const height = (month.revenue / maxValue) * 120;
                        const isLast = index === stats.monthlyData.length - 1;

                        return (
                            <View key={month.month} style={styles.barContainer}>
                                <Text style={styles.barValue}>
                                    {month.revenue > 0 ? `${(month.revenue / 1000).toFixed(0)}k` : '0'}
                                </Text>
                                <View style={styles.barWrapper}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: Math.max(height, 4),
                                                backgroundColor: isLast
                                                    ? Colors.primary.DEFAULT
                                                    : Colors.primary.DEFAULT + '40',
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={[styles.barLabel, isLast && styles.barLabelActive]}>
                                    {month.month}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderOverviewTab = () => (
        <>
            {/* Main Stats */}
            <View style={styles.mainStatsRow}>
                <View style={[styles.mainStatCard, { backgroundColor: Colors.primary.DEFAULT + '10' }]}>
                    <DollarSign size={24} color={Colors.primary.DEFAULT} />
                    <Text style={styles.mainStatValue}>{formatPrice(stats?.totalRevenue || 0)}</Text>
                    <Text style={styles.mainStatLabel}>Chiffre d'affaires total</Text>
                </View>
                <View style={[styles.mainStatCard, { backgroundColor: Colors.success.DEFAULT + '10' }]}>
                    <CheckCircle size={24} color={Colors.success.DEFAULT} />
                    <Text style={styles.mainStatValue}>{stats?.completedBookings || 0}</Text>
                    <Text style={styles.mainStatLabel}>Prestations réalisées</Text>
                </View>
            </View>

            {/* Monthly Comparison */}
            <View style={styles.comparisonCard}>
                <Text style={styles.comparisonTitle}>Ce mois vs le mois dernier</Text>
                <View style={styles.comparisonRow}>
                    <View style={styles.comparisonItem}>
                        <Text style={styles.comparisonLabel}>Réservations</Text>
                        <View style={styles.comparisonValues}>
                            <Text style={styles.comparisonValue}>{stats?.bookingsThisMonth || 0}</Text>
                            <Text
                                style={[
                                    styles.comparisonGrowth,
                                    { color: getGrowthColor(stats?.bookingsThisMonth || 0, stats?.bookingsLastMonth || 0) },
                                ]}
                            >
                                {calculateGrowth(stats?.bookingsThisMonth || 0, stats?.bookingsLastMonth || 0)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.comparisonDivider} />
                    <View style={styles.comparisonItem}>
                        <Text style={styles.comparisonLabel}>Revenus</Text>
                        <View style={styles.comparisonValues}>
                            <Text style={styles.comparisonValue}>{formatPrice(stats?.revenueThisMonth || 0)}</Text>
                            <Text
                                style={[
                                    styles.comparisonGrowth,
                                    { color: getGrowthColor(stats?.revenueThisMonth || 0, stats?.revenueLastMonth || 0) },
                                ]}
                            >
                                {calculateGrowth(stats?.revenueThisMonth || 0, stats?.revenueLastMonth || 0)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Chart */}
            {renderChart()}

            {/* Rating Card */}
            <View style={styles.ratingCard}>
                <View style={styles.ratingStarContainer}>
                    <Star size={28} color={Colors.warning.DEFAULT} fill={Colors.warning.DEFAULT} />
                </View>
                <View style={styles.ratingHeader}>
                    <Text style={styles.ratingValue}>{stats?.averageRating?.toFixed(1) || '-'}</Text>
                    <Text style={styles.ratingLabel}> / 5</Text>
                </View>
                <Text style={styles.ratingSubtext}>
                    Basé sur {stats?.totalReviews || 0} avis client{(stats?.totalReviews || 0) > 1 ? 's' : ''}
                </Text>
            </View>
        </>
    );

    const renderBookingsTab = () => (
        <>
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: Colors.primary.DEFAULT + '15' }]}>
                        <Calendar size={20} color={Colors.primary.DEFAULT} />
                    </View>
                    <Text style={styles.statValue}>{stats?.totalBookings || 0}</Text>
                    <Text style={styles.statLabel}>Total réservations</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: Colors.success.DEFAULT + '15' }]}>
                        <CheckCircle size={20} color={Colors.success.DEFAULT} />
                    </View>
                    <Text style={styles.statValue}>{stats?.completedBookings || 0}</Text>
                    <Text style={styles.statLabel}>Terminées</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: Colors.warning.DEFAULT + '15' }]}>
                        <Clock size={20} color={Colors.warning.DEFAULT} />
                    </View>
                    <Text style={styles.statValue}>{stats?.pendingBookings || 0}</Text>
                    <Text style={styles.statLabel}>En attente</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: Colors.error.DEFAULT + '15' }]}>
                        <XCircle size={20} color={Colors.error.DEFAULT} />
                    </View>
                    <Text style={styles.statValue}>{stats?.cancelledBookings || 0}</Text>
                    <Text style={styles.statLabel}>Annulées</Text>
                </View>
            </View>

            {/* Average Value */}
            <View style={styles.averageCard}>
                <BarChart3 size={24} color={Colors.primary.DEFAULT} />
                <View style={styles.averageContent}>
                    <Text style={styles.averageValue}>{formatPrice(stats?.averageBookingValue || 0)}</Text>
                    <Text style={styles.averageLabel}>Panier moyen</Text>
                </View>
            </View>

            {/* Completion Rate */}
            {stats && stats.totalBookings > 0 && (
                <View style={styles.rateCard}>
                    <Text style={styles.rateTitle}>Taux de réalisation</Text>
                    <View style={styles.rateBar}>
                        <View
                            style={[
                                styles.rateFill,
                                { width: `${(stats.completedBookings / stats.totalBookings) * 100}%` },
                            ]}
                        />
                    </View>
                    <Text style={styles.rateValue}>
                        {((stats.completedBookings / stats.totalBookings) * 100).toFixed(0)}%
                    </Text>
                </View>
            )}
        </>
    );

    const renderClientsTab = () => (
        <>
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: Colors.primary.DEFAULT + '15' }]}>
                        <Users size={20} color={Colors.primary.DEFAULT} />
                    </View>
                    <Text style={styles.statValue}>{stats?.totalClients || 0}</Text>
                    <Text style={styles.statLabel}>Clients total</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: Colors.success.DEFAULT + '15' }]}>
                        <TrendingUp size={20} color={Colors.success.DEFAULT} />
                    </View>
                    <Text style={styles.statValue}>{stats?.returningClients || 0}</Text>
                    <Text style={styles.statLabel}>Clients fidèles</Text>
                </View>
            </View>

            {/* Loyalty Rate */}
            {stats && stats.totalClients > 0 && (
                <View style={styles.loyaltyCard}>
                    <Text style={styles.loyaltyTitle}>💝 Taux de fidélité</Text>
                    <Text style={styles.loyaltyValue}>
                        {((stats.returningClients / stats.totalClients) * 100).toFixed(0)}%
                    </Text>
                    <Text style={styles.loyaltySubtext}>
                        {stats.returningClients} client{stats.returningClients > 1 ? 's' : ''} ont réservé plusieurs fois
                    </Text>
                </View>
            )}
        </>
    );

    // Filter history items
    const filteredHistory = useMemo(() => {
        if (!history?.items) return [];
        if (historyFilter === 'all') return history.items;
        return history.items.filter((item) => item.status === historyFilter);
    }, [history, historyFilter]);

    // Group filtered items by month
    const filteredGroupedByMonth = useMemo(() => {
        const grouped: Record<string, BookingHistoryItem[]> = {};
        filteredHistory.forEach((item) => {
            const date = new Date(item.booking_date);
            const monthKey = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            if (!grouped[monthKey]) {
                grouped[monthKey] = [];
            }
            grouped[monthKey].push(item);
        });
        return grouped;
    }, [filteredHistory]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };

    const formatTime = (timeStr: string) => {
        return timeStr.substring(0, 5);
    };

    const renderHistoryItem = (item: BookingHistoryItem) => (
        <View key={item.id} style={styles.historyItem}>
            <View style={styles.historyDate}>
                <Text style={styles.historyDateText}>{formatDate(item.booking_date)}</Text>
                <Text style={styles.historyTimeText}>{formatTime(item.start_time)}</Text>
            </View>
            <View style={styles.historyContent}>
                <View style={styles.historyClientRow}>
                    {item.client_avatar ? (
                        <Image source={{ uri: item.client_avatar }} style={styles.historyAvatar} />
                    ) : (
                        <View style={styles.historyAvatarPlaceholder}>
                            <User size={14} color={Colors.gray[400]} />
                        </View>
                    )}
                    <Text style={styles.historyClientName}>{item.client_name}</Text>
                </View>
                <Text style={styles.historyServiceName}>{item.service_name}</Text>
                <View style={styles.historyFooter}>
                    <Text style={styles.historyPrice}>{formatPrice(item.total_price)}</Text>
                    <View
                        style={[
                            styles.historyStatusBadge,
                            item.status === 'completed'
                                ? styles.historyStatusCompleted
                                : styles.historyStatusCancelled,
                        ]}
                    >
                        {item.status === 'completed' ? (
                            <CheckCircle size={12} color={Colors.success.DEFAULT} />
                        ) : (
                            <XCircle size={12} color={Colors.error.DEFAULT} />
                        )}
                        <Text
                            style={[
                                styles.historyStatusText,
                                item.status === 'completed'
                                    ? styles.historyStatusTextCompleted
                                    : styles.historyStatusTextCancelled,
                            ]}
                        >
                            {item.status === 'completed' ? 'Terminée' : 'Annulée'}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderHistoryTab = () => {
        if (historyLoading) {
            return (
                <View style={styles.historyLoading}>
                    <LoadingSpinner />
                </View>
            );
        }

        return (
            <>
                {/* Filters */}
                <View style={styles.historyFilters}>
                    <TouchableOpacity
                        style={[styles.historyFilterButton, historyFilter === 'all' && styles.historyFilterActive]}
                        onPress={() => setHistoryFilter('all')}
                    >
                        <Text style={[styles.historyFilterText, historyFilter === 'all' && styles.historyFilterTextActive]}>
                            Toutes
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.historyFilterButton, historyFilter === 'completed' && styles.historyFilterActive]}
                        onPress={() => setHistoryFilter('completed')}
                    >
                        <Text style={[styles.historyFilterText, historyFilter === 'completed' && styles.historyFilterTextActive]}>
                            Terminées
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.historyFilterButton, historyFilter === 'cancelled' && styles.historyFilterActive]}
                        onPress={() => setHistoryFilter('cancelled')}
                    >
                        <Text style={[styles.historyFilterText, historyFilter === 'cancelled' && styles.historyFilterTextActive]}>
                            Annulées
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* History List */}
                {filteredHistory.length === 0 ? (
                    <View style={styles.historyEmpty}>
                        <Calendar size={48} color={Colors.gray[300]} />
                        <Text style={styles.historyEmptyTitle}>Aucune prestation</Text>
                        <Text style={styles.historyEmptyText}>
                            Votre historique de prestations apparaîtra ici
                        </Text>
                    </View>
                ) : (
                    Object.entries(filteredGroupedByMonth).map(([month, items]) => (
                        <View key={month} style={styles.historyMonthSection}>
                            <Text style={styles.historyMonthTitle}>{month}</Text>
                            <View style={styles.historyMonthItems}>
                                {items.map(renderHistoryItem)}
                            </View>
                        </View>
                    ))
                )}
            </>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <LoadingSpinner />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Statistiques</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Tabs */}
            <View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabsContainer}
                    contentContainerStyle={styles.tabsContentContainer}
                >
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
                        onPress={() => setActiveTab('overview')}
                    >
                        <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                            Vue d'ensemble
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'bookings' && styles.tabActive]}
                        onPress={() => setActiveTab('bookings')}
                    >
                        <Text style={[styles.tabText, activeTab === 'bookings' && styles.tabTextActive]}>
                            Réservations
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'clients' && styles.tabActive]}
                        onPress={() => setActiveTab('clients')}
                    >
                        <Text style={[styles.tabText, activeTab === 'clients' && styles.tabTextActive]}>
                            Clients
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'history' && styles.tabActive]}
                        onPress={() => setActiveTab('history')}
                    >
                        <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                            Historique
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => refetch()}
                        tintColor={Colors.primary.DEFAULT}
                    />
                }
            >
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'bookings' && renderBookingsTab()}
                {activeTab === 'clients' && renderClientsTab()}
                {activeTab === 'history' && renderHistoryTab()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    placeholder: {
        width: 40,
    },
    tabsContainer: {
        backgroundColor: Colors.white,
    },
    tabsContentContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: 'center',
        backgroundColor: Colors.gray[50],
        borderRadius: 10,
    },
    tabActive: {
        backgroundColor: Colors.primary.DEFAULT,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.text.secondary,
    },
    tabTextActive: {
        color: Colors.white,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    mainStatsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    mainStatCard: {
        flex: 1,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    mainStatValue: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text.primary,
        marginTop: 12,
    },
    mainStatLabel: {
        fontSize: 12,
        color: Colors.text.secondary,
        marginTop: 4,
        textAlign: 'center',
    },
    comparisonCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    comparisonTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 16,
    },
    comparisonRow: {
        flexDirection: 'row',
    },
    comparisonItem: {
        flex: 1,
    },
    comparisonDivider: {
        width: 1,
        backgroundColor: Colors.gray[200],
        marginHorizontal: 16,
    },
    comparisonLabel: {
        fontSize: 12,
        color: Colors.text.secondary,
        marginBottom: 8,
    },
    comparisonValues: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    comparisonValue: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    comparisonGrowth: {
        fontSize: 13,
        fontWeight: '600',
    },
    chartContainer: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 16,
    },
    chart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 160,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
    },
    barValue: {
        fontSize: 10,
        color: Colors.text.tertiary,
        marginBottom: 4,
    },
    barWrapper: {
        height: 120,
        justifyContent: 'flex-end',
    },
    bar: {
        width: 24,
        borderRadius: 4,
    },
    barLabel: {
        fontSize: 11,
        color: Colors.text.tertiary,
        marginTop: 8,
    },
    barLabelActive: {
        color: Colors.primary.DEFAULT,
        fontWeight: '600',
    },
    ratingCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    ratingStarContainer: {
        marginBottom: 8,
    },
    ratingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingValue: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    ratingLabel: {
        fontSize: 16,
        color: Colors.text.secondary,
    },
    ratingSubtext: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginTop: 8,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        width: (SCREEN_WIDTH - 44) / 2,
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.text.secondary,
        marginTop: 4,
    },
    averageCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    averageContent: {
        marginLeft: 16,
    },
    averageValue: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    averageLabel: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    rateCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
    },
    rateTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 12,
    },
    rateBar: {
        height: 8,
        backgroundColor: Colors.gray[100],
        borderRadius: 4,
        overflow: 'hidden',
    },
    rateFill: {
        height: '100%',
        backgroundColor: Colors.success.DEFAULT,
        borderRadius: 4,
    },
    rateValue: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.success.DEFAULT,
        marginTop: 8,
        textAlign: 'right',
    },
    loyaltyCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    loyaltyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 12,
    },
    loyaltyValue: {
        fontSize: 48,
        fontWeight: '700',
        color: Colors.primary.DEFAULT,
    },
    loyaltySubtext: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginTop: 8,
        textAlign: 'center',
    },
    // History styles
    historyLoading: {
        padding: 60,
        alignItems: 'center',
    },
    historyFilters: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    historyFilterButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: Colors.gray[50],
        borderRadius: 10,
        alignItems: 'center',
    },
    historyFilterActive: {
        backgroundColor: Colors.primary.DEFAULT,
    },
    historyFilterText: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.text.secondary,
    },
    historyFilterTextActive: {
        color: Colors.white,
    },
    historyEmpty: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
    },
    historyEmptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
        marginTop: 16,
    },
    historyEmptyText: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginTop: 8,
        textAlign: 'center',
    },
    historyMonthSection: {
        marginBottom: 16,
    },
    historyMonthTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 12,
        textTransform: 'capitalize',
    },
    historyMonthItems: {
        gap: 10,
    },
    historyItem: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
    },
    historyDate: {
        width: 60,
        marginRight: 12,
    },
    historyDateText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    historyTimeText: {
        fontSize: 11,
        color: Colors.text.tertiary,
        marginTop: 2,
    },
    historyContent: {
        flex: 1,
    },
    historyClientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    historyAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    historyAvatarPlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.gray[100],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    historyClientName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    historyServiceName: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginBottom: 8,
    },
    historyFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    historyPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    historyStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    historyStatusCompleted: {
        backgroundColor: Colors.success.DEFAULT + '15',
    },
    historyStatusCancelled: {
        backgroundColor: Colors.error.DEFAULT + '15',
    },
    historyStatusText: {
        fontSize: 11,
        fontWeight: '500',
    },
    historyStatusTextCompleted: {
        color: Colors.success.DEFAULT,
    },
    historyStatusTextCancelled: {
        color: Colors.error.DEFAULT,
    },
});
