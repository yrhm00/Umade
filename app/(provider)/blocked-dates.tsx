import { IOSRangeCalendar } from '@/components/ui/IOSRangeCalendar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import {
    BlockedPeriod,
    useAddBlockedPeriod,
    useBlockedDates,
    useDeleteBlockedPeriod,
} from '@/hooks/useBlockedDates';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Plus, Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BlockedDatesScreen() {
    const router = useRouter();
    const { data: blockedPeriods, isLoading } = useBlockedDates();
    const addMutation = useAddBlockedPeriod();
    const deleteMutation = useDeleteBlockedPeriod();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [reason, setReason] = useState('');

    const handleRangeSelect = (start: string, end: string | null) => {
        setStartDate(start);
        setEndDate(end);
    };

    const handleAddPeriod = async () => {
        if (!startDate) {
            Alert.alert('Erreur', 'Veuillez sélectionner au moins une date');
            return;
        }

        const newPeriod: BlockedPeriod = {
            start: startDate,
            end: endDate || startDate,
            reason: reason.trim() || undefined,
        };

        try {
            await addMutation.mutateAsync(newPeriod);
            setIsModalVisible(false);
            resetForm();
        } catch (error) {
            console.error('Error adding blocked period:', error);
            Alert.alert('Erreur', "Impossible d'ajouter la période");
        }
    };

    const handleDeletePeriod = (index: number, period: BlockedPeriod) => {
        const dateRange =
            period.start === period.end
                ? formatDate(period.start)
                : `${formatDate(period.start)} - ${formatDate(period.end)}`;

        Alert.alert(
            'Supprimer cette période ?',
            `${dateRange}${period.reason ? `\n${period.reason}` : ''}`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMutation.mutateAsync(index);
                        } catch (error) {
                            console.error('Error deleting blocked period:', error);
                            Alert.alert('Erreur', 'Impossible de supprimer la période');
                        }
                    },
                },
            ]
        );
    };

    const resetForm = () => {
        setStartDate(null);
        setEndDate(null);
        setReason('');
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const renderPeriod = ({ item, index }: { item: BlockedPeriod; index: number }) => {
        const isSingleDay = item.start === item.end;

        return (
            <View style={styles.periodCard}>
                <View style={styles.periodInfo}>
                    <View style={styles.periodIconContainer}>
                        <Calendar size={20} color={Colors.primary.DEFAULT} />
                    </View>
                    <View style={styles.periodDetails}>
                        <Text style={styles.periodDates}>
                            {isSingleDay
                                ? formatDate(item.start)
                                : `${formatDate(item.start)} - ${formatDate(item.end)}`}
                        </Text>
                        {item.reason && <Text style={styles.periodReason}>{item.reason}</Text>}
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePeriod(index, item)}
                    disabled={deleteMutation.isPending}
                >
                    <Trash2 size={20} color={Colors.error.DEFAULT} />
                </TouchableOpacity>
            </View>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Calendar size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyText}>Aucune période bloquée</Text>
            <Text style={styles.emptySubtext}>
                Ajoutez vos vacances, congés ou autres indisponibilités
            </Text>
        </View>
    );

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
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Indisponibilités</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setIsModalVisible(true)}
                >
                    <Plus size={24} color={Colors.primary.DEFAULT} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={blockedPeriods || []}
                renderItem={renderPeriod}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmpty}
            />

            {/* Modal pour ajouter une période */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => {
                    setIsModalVisible(false);
                    resetForm();
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Ajouter une période</Text>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => {
                                    setIsModalVisible(false);
                                    resetForm();
                                }}
                            >
                                <X size={24} color={Colors.text.secondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.selectionHint}>
                            {!startDate
                                ? 'Sélectionnez la date de début'
                                : !endDate
                                    ? 'Sélectionnez la date de fin (ou celle de début si 1 jour)'
                                    : 'Période sélectionnée'}
                        </Text>

                        <IOSRangeCalendar
                            startDate={startDate}
                            endDate={endDate}
                            onRangeSelect={handleRangeSelect}
                        />

                        {startDate && (
                            <View style={styles.selectedDates}>
                                <Text style={styles.selectedDatesLabel}>
                                    {endDate
                                        ? `${formatDate(startDate)} → ${formatDate(endDate)}`
                                        : formatDate(startDate)}
                                </Text>
                            </View>
                        )}

                        <TextInput
                            style={styles.reasonInput}
                            placeholder="Raison (optionnel) : Vacances, Formation..."
                            placeholderTextColor={Colors.text.tertiary}
                            value={reason}
                            onChangeText={setReason}
                        />

                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                (!startDate || addMutation.isPending) && styles.confirmButtonDisabled,
                            ]}
                            onPress={handleAddPeriod}
                            disabled={!startDate || addMutation.isPending}
                        >
                            {addMutation.isPending ? (
                                <LoadingSpinner size="small" color={Colors.white} />
                            ) : (
                                <Text style={styles.confirmButtonText}>Confirmer</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
        backgroundColor: Colors.white,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    addButton: {
        padding: 8,
    },
    listContent: {
        padding: 16,
        flexGrow: 1,
    },
    periodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    periodInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    periodIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary.light + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    periodDetails: {
        flex: 1,
    },
    periodDates: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    periodReason: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    deleteButton: {
        padding: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.text.primary,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.text.secondary,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        paddingTop: 10,
        paddingHorizontal: 16,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    modalCloseButton: {
        padding: 4,
    },
    selectionHint: {
        fontSize: 14,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginBottom: 16,
    },
    selectedDates: {
        backgroundColor: Colors.primary.light + '20',
        padding: 12,
        borderRadius: 12,
        marginTop: 24,
        alignItems: 'center',
    },
    selectedDatesLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary.DEFAULT,
        textAlign: 'center',
    },
    reasonInput: {
        backgroundColor: Colors.gray[50],
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        fontSize: 16,
        color: Colors.text.primary,
    },
    confirmButton: {
        backgroundColor: Colors.primary.DEFAULT,
        borderRadius: 16,
        padding: 18,
        marginTop: 24,
        alignItems: 'center',
        marginBottom: 10,
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmButtonText: {
        color: Colors.white,
        fontSize: 17,
        fontWeight: '600',
    },
});
