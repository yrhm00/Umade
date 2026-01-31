/**
 * Page des revenus pour le provider
 */

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import {
    RevenuePeriod,
    useProviderRevenueDetails,
    useRevenuePeriod,
} from '@/hooks/useRevenue';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Check, DollarSign, TrendingUp } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 150;

const PERIOD_OPTIONS: Array<{ value: RevenuePeriod; label: string }> = [
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'year', label: 'Cette année' },
    { value: 'all', label: 'Tout le temps' },
];

export default function ProviderRevenueScreen() {
    const router = useRouter();
    const { period, setPeriod, isLoaded } = useRevenuePeriod();
    const [showPeriodModal, setShowPeriodModal] = useState(false);

    const {
        data: revenueDetails,
        isLoading,
        refetch,
        isRefetching,
    } = useProviderRevenueDetails();

    const getCurrentPeriodTotal = () => {
        if (!revenueDetails) return 0;
        switch (period) {
            case 'week':
                return revenueDetails.totalThisWeek;
            case 'month':
                return revenueDetails.totalThisMonth;
            case 'year':
                return revenueDetails.totalThisYear;
            case 'all':
            default:
                return revenueDetails.totalAllTime;
        }
    };

    const getCurrentPeriodCount = () => {
        if (!revenueDetails) return 0;
        switch (period) {
            case 'week':
                return revenueDetails.countThisWeek;
            case 'month':
                return revenueDetails.countThisMonth;
            case 'year':
                return revenueDetails.countThisYear;
            case 'all':
            default:
                return revenueDetails.countAllTime;
        }
    };

    const getCurrentPeriodLabel = () => {
        return PERIOD_OPTIONS.find((p) => p.value === period)?.label || 'Ce mois';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const handlePeriodSelect = async (selectedPeriod: RevenuePeriod) => {
        await setPeriod(selectedPeriod);
        setShowPeriodModal(false);
    };

    const renderChart = () => {
        if (!revenueDetails?.bookingsByMonth) return null;

        const maxValue = Math.max(...revenueDetails.bookingsByMonth.map((m) => m.total), 1);
        const barWidth = (SCREEN_WIDTH - 64) / 12 - 4;

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Revenus mensuels</Text>
                <View style={styles.chart}>
                    {revenueDetails.bookingsByMonth.map((month, index) => {
                        const height = (month.total / maxValue) * CHART_HEIGHT;
                        const isCurrentMonth = index === 11;

                        return (
                            <View key={month.month} style={styles.barContainer}>
                                <View style={styles.barWrapper}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: Math.max(height, 4),
                                                backgroundColor: isCurrentMonth
                                                    ? Colors.primary.DEFAULT
                                                    : Colors.primary.DEFAULT + '40',
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={[styles.barLabel, isCurrentMonth && styles.barLabelActive]}>
                                    {month.month}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderStatCards = () => (
        <View style={styles.statsGrid}>
            <View style={styles.statCard}>
                <Text style={styles.statLabel}>Cette semaine</Text>
                <Text style={styles.statValue}>{formatPrice(revenueDetails?.totalThisWeek || 0)}</Text>
                <Text style={styles.statCount}>{revenueDetails?.countThisWeek || 0} réservations</Text>
            </View>
            <View style={styles.statCard}>
                <Text style={styles.statLabel}>Ce mois</Text>
                <Text style={styles.statValue}>{formatPrice(revenueDetails?.totalThisMonth || 0)}</Text>
                <Text style={styles.statCount}>{revenueDetails?.countThisMonth || 0} réservations</Text>
            </View>
            <View style={styles.statCard}>
                <Text style={styles.statLabel}>Cette année</Text>
                <Text style={styles.statValue}>{formatPrice(revenueDetails?.totalThisYear || 0)}</Text>
                <Text style={styles.statCount}>{revenueDetails?.countThisYear || 0} réservations</Text>
            </View>
            <View style={styles.statCard}>
                <Text style={styles.statLabel}>Tout le temps</Text>
                <Text style={styles.statValue}>{formatPrice(revenueDetails?.totalAllTime || 0)}</Text>
                <Text style={styles.statCount}>{revenueDetails?.countAllTime || 0} réservations</Text>
            </View>
        </View>
    );

    type RecentBooking = {
        id: string;
        booking_date: string;
        total_price: number;
        status: string;
        client_name: string;
        service_name: string;
    };

    const renderRecentBooking = ({ item }: { item: RecentBooking }) => (
        <View style={styles.bookingItem}>
            <View style={styles.bookingInfo}>
                <Text style={styles.bookingClient}>{item.client_name}</Text>
                <Text style={styles.bookingService}>{item.service_name}</Text>
                <Text style={styles.bookingDate}>{formatDate(item.booking_date)}</Text>
            </View>
            <Text style={styles.bookingPrice}>{formatPrice(item.total_price)}</Text>
        </View>
    );

    const renderHeader = () => (
        <View>
            {/* Main total card */}
            <View style={styles.totalCard}>
                <View style={styles.totalHeader}>
                    <View style={styles.totalIconContainer}>
                        <DollarSign size={24} color={Colors.success.DEFAULT} />
                    </View>
                    <TouchableOpacity
                        style={styles.periodButton}
                        onPress={() => setShowPeriodModal(true)}
                    >
                        <Text style={styles.periodButtonText}>{getCurrentPeriodLabel()}</Text>
                        <Calendar size={16} color={Colors.primary.DEFAULT} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.totalValue}>{formatPrice(getCurrentPeriodTotal())}</Text>
                <Text style={styles.totalSubtext}>
                    {getCurrentPeriodCount()} réservation{getCurrentPeriodCount() > 1 ? 's' : ''} terminée{getCurrentPeriodCount() > 1 ? 's' : ''}
                </Text>
            </View>

            {/* Chart */}
            {renderChart()}

            {/* Stats grid */}
            {renderStatCards()}

            {/* Recent bookings header */}
            <Text style={styles.sectionTitle}>Dernières prestations</Text>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <TrendingUp size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>Aucun revenu</Text>
            <Text style={styles.emptySubtitle}>
                Vos revenus apparaîtront ici après vos premières réservations terminées
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Revenus</Text>
                <View style={styles.placeholder} />
            </View>

            {isLoading || !isLoaded ? (
                <View style={styles.loadingContainer}>
                    <LoadingSpinner />
                </View>
            ) : (
                <FlatList
                    data={revenueDetails?.recentBookings || []}
                    renderItem={renderRecentBooking}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={revenueDetails ? null : renderEmpty}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={() => refetch()}
                            tintColor={Colors.primary.DEFAULT}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Period selection modal */}
            <Modal
                visible={showPeriodModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPeriodModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowPeriodModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Afficher sur le dashboard</Text>
                        <Text style={styles.modalSubtitle}>
                            Choisissez la période à afficher dans la carte Revenus du dashboard
                        </Text>
                        {PERIOD_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.periodOption,
                                    period === option.value && styles.periodOptionActive,
                                ]}
                                onPress={() => handlePeriodSelect(option.value)}
                            >
                                <Text
                                    style={[
                                        styles.periodOptionText,
                                        period === option.value && styles.periodOptionTextActive,
                                    ]}
                                >
                                    {option.label}
                                </Text>
                                {period === option.value && (
                                    <Check size={20} color={Colors.primary.DEFAULT} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    totalCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    totalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    totalIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.success.DEFAULT + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    periodButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: Colors.primary.DEFAULT + '10',
        borderRadius: 20,
    },
    periodButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.primary.DEFAULT,
    },
    totalValue: {
        fontSize: 36,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    totalSubtext: {
        fontSize: 14,
        color: Colors.text.secondary,
    },
    chartContainer: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 16,
    },
    chart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: CHART_HEIGHT + 24,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
    },
    barWrapper: {
        height: CHART_HEIGHT,
        justifyContent: 'flex-end',
    },
    bar: {
        width: '80%',
        minWidth: 8,
        borderRadius: 4,
    },
    barLabel: {
        fontSize: 10,
        color: Colors.text.tertiary,
        marginTop: 4,
    },
    barLabelActive: {
        color: Colors.primary.DEFAULT,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: (SCREEN_WIDTH - 44) / 2,
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.text.secondary,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    statCount: {
        fontSize: 12,
        color: Colors.text.tertiary,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 12,
    },
    bookingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
    },
    bookingInfo: {
        flex: 1,
    },
    bookingClient: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    bookingService: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    bookingDate: {
        fontSize: 12,
        color: Colors.text.tertiary,
        marginTop: 4,
    },
    bookingPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.success.DEFAULT,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
        marginBottom: 20,
        lineHeight: 20,
    },
    periodOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: Colors.gray[50],
    },
    periodOptionActive: {
        backgroundColor: Colors.primary.DEFAULT + '10',
        borderWidth: 1,
        borderColor: Colors.primary.DEFAULT,
    },
    periodOptionText: {
        fontSize: 15,
        color: Colors.text.primary,
    },
    periodOptionTextActive: {
        fontWeight: '600',
        color: Colors.primary.DEFAULT,
    },
});
