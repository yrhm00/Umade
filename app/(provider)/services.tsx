
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Clock,
    DollarSign,
    Plus,
    Tag,
    Trash2,
    X
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Service {
    id: string;
    name: string;
    description: string | null;
    price: number;
    duration_minutes: number;
    is_active: boolean;
    provider_id: string;
}

export default function ServicesScreen() {
    const router = useRouter();
    const { userId } = useAuth();
    const queryClient = useQueryClient();

    // Modal state
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentService, setCurrentService] = useState<Partial<Service>>({});

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        duration: '',
        isActive: true,
    });

    // Fetch Services
    const { data: services, isLoading } = useQuery({
        queryKey: ['provider', 'services', userId],
        queryFn: async () => {
            if (!userId) throw new Error('User ID not found');

            const { data: provider } = await supabase
                .from('providers')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (!provider) throw new Error('Provider not found');

            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('provider_id', provider.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Service[];
        },
        enabled: !!userId,
    });

    // Mutations
    const createService = useMutation({
        mutationFn: async (newService: any) => {
            if (!userId) throw new Error('User ID not found');

            const { data: provider } = await supabase
                .from('providers')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (!provider) throw new Error('Provider not found');

            const { data, error } = await supabase
                .from('services')
                .insert([{ ...newService, provider_id: provider.id }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider', 'services'] });
            closeModal();
            Alert.alert('Succès', 'Service ajouté avec succès');
        },
        onError: (error) => {
            Alert.alert('Erreur', "Impossible d'ajouter le service");
            console.error(error);
        },
    });

    const updateService = useMutation({
        mutationFn: async (updatedService: any) => {
            const { error } = await supabase
                .from('services')
                .update(updatedService)
                .eq('id', currentService.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider', 'services'] });
            closeModal();
            Alert.alert('Succès', 'Service mis à jour avec succès');
        },
        onError: (error) => {
            Alert.alert('Erreur', "Impossible de mettre à jour le service");
            console.error(error);
        },
    });

    const deleteService = useMutation({
        mutationFn: async (serviceId: string) => {
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', serviceId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider', 'services'] });
            Alert.alert('Succès', 'Service supprimé');
        },
        onError: (error) => {
            Alert.alert('Erreur', "Impossible de supprimer le service");
            console.error(error);
        },
    });

    const handleSave = () => {
        if (!formData.name || !formData.price || !formData.duration) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
            return;
        }

        const serviceData = {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            duration_minutes: parseInt(formData.duration),
            is_active: formData.isActive,
        };

        if (isEditing) {
            updateService.mutate(serviceData);
        } else {
            createService.mutate(serviceData);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Supprimer le service',
            'Êtes-vous sûr de vouloir supprimer ce service ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => deleteService.mutate(id)
                },
            ]
        );
    };

    const openAddModal = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            duration: '',
            isActive: true,
        });
        setIsEditing(false);
        setIsModalVisible(true);
    };

    const openEditModal = (service: Service) => {
        setCurrentService(service);
        setFormData({
            name: service.name,
            description: service.description || '',
            price: service.price.toString(),
            duration: service.duration_minutes.toString(),
            isActive: service.is_active,
        });
        setIsEditing(true);
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setCurrentService({});
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
                <Text style={styles.title}>Mes services</Text>
                <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                    <Plus size={24} color={Colors.white} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {services?.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Tag size={48} color={Colors.gray[300]} />
                        <Text style={styles.emptyTitle}>Aucun service</Text>
                        <Text style={styles.emptyText}>
                            Commencez par ajouter les services que vous proposez à vos clients.
                        </Text>
                        <TouchableOpacity style={styles.ctaButton} onPress={openAddModal}>
                            <Text style={styles.ctaButtonText}>Ajouter un service</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    services?.map((service) => (
                        <TouchableOpacity
                            key={service.id}
                            style={styles.serviceCard}
                            onPress={() => openEditModal(service)}
                        >
                            <View style={styles.serviceInfo}>
                                <View style={styles.serviceHeader}>
                                    <Text style={styles.serviceName}>{service.name}</Text>
                                    {!service.is_active && (
                                        <View style={styles.inactiveBadge}>
                                            <Text style={styles.inactiveText}>Inactif</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.serviceDescription} numberOfLines={2}>
                                    {service.description || 'Pas de description'}
                                </Text>
                                <View style={styles.serviceMeta}>
                                    <View style={styles.metaItem}>
                                        <DollarSign size={14} color={Colors.primary.DEFAULT} />
                                        <Text style={styles.metaText}>{formatPrice(service.price)}</Text>
                                    </View>
                                    <View style={styles.metaDivider} />
                                    <View style={styles.metaItem}>
                                        <Clock size={14} color={Colors.text.tertiary} />
                                        <Text style={styles.metaText}>{service.duration_minutes} min</Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDelete(service.id)}
                            >
                                <Trash2 size={20} color={Colors.gray[400]} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Edit/Add Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {isEditing ? 'Modifier le service' : 'Nouveau service'}
                            </Text>
                            <TouchableOpacity onPress={closeModal}>
                                <X size={24} color={Colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formScroll}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Nom du service</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: Coupe homme"
                                    value={formData.name}
                                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                    <Text style={styles.label}>Prix (€)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        value={formData.price}
                                        onChangeText={(text) => setFormData({ ...formData, price: text })}
                                    />
                                </View>
                                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                                    <Text style={styles.label}>Durée (min)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="30"
                                        keyboardType="numeric"
                                        value={formData.duration}
                                        onChangeText={(text) => setFormData({ ...formData, duration: text })}
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Détails de la prestation..."
                                    multiline
                                    numberOfLines={4}
                                    value={formData.description}
                                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                                />
                            </View>

                            <View style={styles.switchRow}>
                                <Text style={styles.label}>Service actif</Text>
                                <Switch
                                    value={formData.isActive}
                                    onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                                    trackColor={{ false: Colors.gray[200], true: Colors.primary.DEFAULT }}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={closeModal}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    (createService.isPending || updateService.isPending) && styles.saveButtonDisabled
                                ]}
                                onPress={handleSave}
                                disabled={createService.isPending || updateService.isPending}
                            >
                                {createService.isPending || updateService.isPending ? (
                                    <LoadingSpinner size="small" color={Colors.white} />
                                ) : (
                                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
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
    addButton: {
        width: 40,
        height: 40,
        backgroundColor: Colors.primary.DEFAULT,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
        paddingHorizontal: 32,
    },
    ctaButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: Colors.primary.DEFAULT,
        borderRadius: 12,
    },
    ctaButtonText: {
        color: Colors.white,
        fontWeight: '600',
    },
    serviceCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
        marginRight: 8,
    },
    inactiveBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: Colors.gray[100],
        borderRadius: 4,
    },
    inactiveText: {
        fontSize: 10,
        color: Colors.text.secondary,
        fontWeight: '500',
    },
    serviceDescription: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginBottom: 12,
    },
    serviceMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    metaDivider: {
        width: 1,
        height: 12,
        backgroundColor: Colors.gray[300],
        marginHorizontal: 8,
    },
    deleteButton: {
        padding: 8,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    formScroll: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.gray[50],
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: Colors.text.primary,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: Colors.gray[100],
        gap: 12,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: Colors.gray[100],
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    saveButton: {
        flex: 2,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: Colors.primary.DEFAULT,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.white,
    },
});
