import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { BookingStatus } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { Calendar, Check, Clock, X } from 'lucide-react-native';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BookingActionCardProps {
    booking: any;
    isProvider: boolean;
    onUpdateStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
    isUpdating: boolean;
}

export const BookingActionCard = ({
    booking,
    isProvider,
    onUpdateStatus,
    isUpdating
}: BookingActionCardProps) => {
    if (!booking) return null;

    const handleAccept = () => {
        Alert.alert(
            "Confirmer la réservation",
            "Voulez-vous vraiment accepter cette demande ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Accepter",
                    onPress: () => onUpdateStatus(booking.id, 'confirmed')
                }
            ]
        );
    };

    const handleDecline = () => {
        Alert.alert(
            "Refuser la demande",
            "Voulez-vous vraiment refuser cette demande ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Refuser",
                    style: "destructive",
                    onPress: () => onUpdateStatus(booking.id, 'cancelled')
                }
            ]
        );
    };

    const date = new Date(booking.booking_date);
    const dateStr = date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return (
        <View style={styles.container}>
            {/* Header Badge */}
            <View style={styles.headerBadge}>
                <Text style={styles.headerText}>
                    {isProvider ? "Nouvelle demande" : "En attente de confirmation"}
                </Text>
            </View>

            <View style={styles.content}>
                {/* Service Info */}
                <View style={styles.infoRow}>
                    <Text style={styles.serviceName}>{booking.services?.name}</Text>
                    <Text style={styles.price}>
                        {booking.services?.price ? formatPrice(booking.services.price) : 'Sur devis'}
                    </Text>
                </View>

                {/* Date & Time */}
                <View style={styles.detailsContainer}>
                    <View style={styles.detailItem}>
                        <Calendar size={14} color={Colors.text.secondary} />
                        <Text style={styles.detailText}>{dateStr}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Clock size={14} color={Colors.text.secondary} />
                        <Text style={styles.detailText}>
                            {booking.start_time?.slice(0, 5) || '--:--'}
                        </Text>
                    </View>
                </View>

                {/* Actions (Provider Only) */}
                {isProvider && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.declineButton]}
                            onPress={handleDecline}
                            disabled={isUpdating}
                        >
                            <X size={18} color={Colors.error.DEFAULT} />
                            <Text style={[styles.buttonText, styles.declineText]}>Refuser</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.acceptButton]}
                            onPress={handleAccept}
                            disabled={isUpdating}
                        >
                            <Check size={18} color={Colors.white} />
                            <Text style={[styles.buttonText, styles.acceptText]}>Accepter</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: Layout.spacing.md,
        marginTop: Layout.spacing.sm,
        backgroundColor: Colors.white,
        borderRadius: Layout.radius.lg,
        borderWidth: 1,
        borderColor: Colors.primary.DEFAULT, // Highlight border
        overflow: 'hidden',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerBadge: {
        backgroundColor: Colors.primary.light,
        paddingVertical: 6,
        paddingHorizontal: Layout.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.primary.DEFAULT + '20',
    },
    headerText: {
        fontSize: Layout.fontSize.xs,
        fontWeight: '700',
        color: Colors.primary.DEFAULT,
        textTransform: 'uppercase',
    },
    content: {
        padding: Layout.spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Layout.spacing.sm,
    },
    serviceName: {
        fontSize: Layout.fontSize.md,
        fontWeight: '700',
        color: Colors.text.primary,
        flex: 1,
    },
    price: {
        fontSize: Layout.fontSize.md,
        fontWeight: '600',
        color: Colors.primary.DEFAULT,
    },
    detailsContainer: {
        flexDirection: 'row',
        gap: Layout.spacing.lg,
        marginBottom: Layout.spacing.md,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.secondary,
        textTransform: 'capitalize',
    },
    actions: {
        flexDirection: 'row',
        gap: Layout.spacing.md,
        marginTop: Layout.spacing.xs,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: Layout.radius.md,
    },
    acceptButton: {
        backgroundColor: Colors.primary.DEFAULT,
    },
    declineButton: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    buttonText: {
        fontSize: Layout.fontSize.sm,
        fontWeight: '600',
    },
    acceptText: {
        color: Colors.white,
    },
    declineText: {
        color: Colors.error.DEFAULT,
    },
});
