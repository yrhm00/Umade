import { EmptyState } from '@/components/common/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useProviderBookings } from '@/hooks/useBookings';
import { BookingStatus } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STATUS_LABELS: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    completed: 'Terminée',
    cancelled: 'Annulée',
};

const STATUS_VARIANTS: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
    pending: 'warning',
    confirmed: 'info',
    completed: 'success',
    cancelled: 'error',
};

const FILTER_OPTIONS: { label: string; value: BookingStatus | 'upcoming' | undefined }[] = [
    { label: 'À venir', value: 'upcoming' },
    { label: 'En attente', value: 'pending' },
    { label: 'Confirmées', value: 'confirmed' },
    { label: 'Terminées', value: 'completed' },
    { label: 'Annulées', value: 'cancelled' },
    { label: 'Toutes', value: undefined },
];

export default function ProviderBookingsScreen() {
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState<BookingStatus | 'upcoming' | undefined>('upcoming');

    const { data: bookings, isLoading, refetch, isRefetching } =
        useProviderBookings(statusFilter);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();

        // Reset time parts for accurate day calculation
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const diffMs = dateOnly.getTime() - nowOnly.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        const formattedDate = date.toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

        let daysLabel = '';
        if (diffDays === 0) {
            daysLabel = "(Aujourd'hui)";
        } else if (diffDays === 1) {
            daysLabel = '(Demain)';
        } else if (diffDays === -1) {
            daysLabel = '(Hier)';
        } else if (diffDays > 1) {
            daysLabel = `(dans ${diffDays} jours)`;
        } else {
            daysLabel = `(il y a ${Math.abs(diffDays)} jours)`;
        }

        return `${formattedDate} ${daysLabel}`;
    };

    const formatTime = (timeString: string | null) => {
        if (!timeString) return '';
        return timeString.slice(0, 5);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
        }).format(price);
    };

    const renderBookingItem = useCallback(
        ({ item }: { item: any }) => (
            <TouchableOpacity
                style={styles.bookingCard}
                onPress={() => router.push(`/booking/${item.id}/details`)}
                activeOpacity={0.7}
            >
                <View style={styles.bookingHeader}>
                    <View style={styles.clientInfo}>
                        <Avatar
                            source={item.profiles?.avatar_url}
                            name={item.profiles?.full_name || '?'}
                            size="md"
                        />
                        <View style={styles.clientDetails}>
                            <Text style={styles.clientName}>
                                {item.profiles?.full_name || 'Client'}
                            </Text>
                            <Text style={styles.serviceName}>
                                {item.services?.name || 'Service'}
                            </Text>
                        </View>
                    </View>
                    <Badge
                        label={STATUS_LABELS[item.status] || item.status}
                        variant={STATUS_VARIANTS[item.status] || 'info'}
                        size="sm"
                    />
                </View>

                <View style={styles.bookingDetails}>
                    <View style={styles.detailRow}>
                        <Calendar size={16} color={Colors.text.secondary} />
                        <Text style={styles.detailText}>{formatDate(item.booking_date)}</Text>
                    </View>
                    {item.start_time && (
                        <View style={styles.detailRow}>
                            <Clock size={16} color={Colors.text.secondary} />
                            <Text style={styles.detailText}>
                                {formatTime(item.start_time)}
                                {item.end_time && ` - ${formatTime(item.end_time)}`}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.bookingFooter}>
                    <Text style={styles.price}>{formatPrice(item.total_price)}</Text>
                </View>
            </TouchableOpacity>
        ),
        [router]
    );

    const keyExtractor = useCallback((item: any) => item.id, []);

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
                <Text style={styles.title}>Réservations</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <FlatList
                    data={FILTER_OPTIONS}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterList}
                    keyExtractor={(item) => item.label}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterTab,
                                statusFilter === item.value && styles.filterTabActive,
                            ]}
                            onPress={() => setStatusFilter(item.value)}
                        >
                            <Text
                                style={[
                                    styles.filterTabText,
                                    statusFilter === item.value && styles.filterTabTextActive,
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Bookings List */}
            {isLoading ? (
                <LoadingSpinner fullScreen message="Chargement..." />
            ) : bookings && bookings.length > 0 ? (
                <FlatList
                    data={bookings}
                    keyExtractor={keyExtractor}
                    renderItem={renderBookingItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    onRefresh={refetch}
                    refreshing={isRefetching}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            ) : (
                <EmptyState
                    icon="📅"
                    title="Aucune réservation"
                    description={
                        statusFilter
                            ? `Aucune réservation ${STATUS_LABELS[statusFilter]?.toLowerCase() || ''}.`
                            : 'Vos réservations apparaîtront ici.'
                    }
                />
            )}
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
        paddingHorizontal: Layout.spacing.lg,
        paddingVertical: Layout.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: Layout.fontSize['xl'],
        fontWeight: '700',
        color: Colors.text.primary,
    },
    placeholder: {
        width: 40,
    },
    filterContainer: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    filterList: {
        paddingHorizontal: Layout.spacing.lg,
        paddingVertical: Layout.spacing.sm,
        gap: Layout.spacing.sm,
    },
    filterTab: {
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.sm,
        borderRadius: Layout.radius.full,
        backgroundColor: Colors.gray[100],
        marginRight: Layout.spacing.sm,
    },
    filterTabActive: {
        backgroundColor: Colors.primary.DEFAULT,
    },
    filterTabText: {
        fontSize: Layout.fontSize.sm,
        fontWeight: '500',
        color: Colors.text.secondary,
    },
    filterTabTextActive: {
        color: Colors.white,
    },
    list: {
        padding: Layout.spacing.lg,
    },
    separator: {
        height: Layout.spacing.md,
    },
    bookingCard: {
        backgroundColor: Colors.white,
        borderRadius: Layout.radius.lg,
        padding: Layout.spacing.md,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Layout.spacing.md,
    },
    clientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: Layout.spacing.md,
    },
    clientDetails: {
        flex: 1,
    },
    clientName: {
        fontSize: Layout.fontSize.md,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    serviceName: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    bookingDetails: {
        gap: Layout.spacing.xs,
        paddingTop: Layout.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.gray[100],
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Layout.spacing.sm,
    },
    detailText: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.secondary,
    },
    bookingFooter: {
        marginTop: Layout.spacing.md,
        paddingTop: Layout.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.gray[100],
        alignItems: 'flex-end',
    },
    price: {
        fontSize: Layout.fontSize.lg,
        fontWeight: '700',
        color: Colors.primary.DEFAULT,
    },
});
