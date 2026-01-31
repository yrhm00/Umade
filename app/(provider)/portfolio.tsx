import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, GripVertical, Plus, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PortfolioImage {
    id: string;
    image_url: string;
    created_at: string;
    display_order: number;
}

export default function ProviderPortfolioScreen() {
    const router = useRouter();
    const { profile } = useAuthStore();
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);

    // Fetch images
    const { data: images, isLoading } = useQuery({
        queryKey: ['portfolio', profile?.id],
        queryFn: async () => {
            if (!profile?.id) return [];

            const { data: provider } = await supabase
                .from('providers')
                .select('id')
                .eq('user_id', profile.id)
                .single();

            if (!provider) throw new Error('Provider not found');

            const { data, error } = await supabase
                .from('portfolio_images')
                .select('*')
                .eq('provider_id', provider.id)
                .order('display_order', { ascending: true })
                .order('created_at', { ascending: false }); // Fallback

            if (error) throw error;
            return data as PortfolioImage[];
        },
        enabled: !!profile?.id,
    });

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: async (base64: string) => {
            if (!profile?.id) throw new Error('Not authenticated');

            const { data: provider } = await supabase
                .from('providers')
                .select('id')
                .eq('user_id', profile.id)
                .single();

            if (!provider) throw new Error('Provider not found');

            const fileName = `portfolio-${provider.id}-${Date.now()}.jpg`;

            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const { error: uploadError } = await supabase.storage
                .from('portfolio')
                .upload(fileName, bytes.buffer, {
                    contentType: 'image/jpeg',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('portfolio')
                .getPublicUrl(fileName);

            // Get max order to append at end
            const { data: maxOrderData } = await supabase
                .from('portfolio_images')
                .select('display_order')
                .eq('provider_id', provider.id)
                .order('display_order', { ascending: false })
                .limit(1)
                .single();

            const nextOrder = (maxOrderData?.display_order || 0) + 1;

            const { error: dbError } = await supabase
                .from('portfolio_images')
                .insert({
                    provider_id: provider.id,
                    image_url: publicUrl,
                    display_order: nextOrder,
                });

            if (dbError) throw dbError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
            Alert.alert('Succès', 'Photo ajoutée au portfolio');
        },
        onError: (error) => {
            console.error('Upload error:', error);
            Alert.alert('Erreur', "Impossible de télécharger l'image (Vérifiez les permissions RLS)");
        },
        onSettled: () => {
            setIsUploading(false);
        }
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (imageId: string) => {
            const { error } = await supabase
                .from('portfolio_images')
                .delete()
                .eq('id', imageId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        },
        onError: () => {
            Alert.alert('Erreur', 'Impossible de supprimer la photo');
        },
    });

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            // @ts-ignore - Supress deprecation warning for compatibility
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0]?.base64) {
            setIsUploading(true);
            uploadMutation.mutate(result.assets[0].base64);
        }
    };

    const handleDelete = (imageId: string) => {
        Alert.alert(
            'Supprimer',
            'Voulez-vous vraiment supprimer cette photo ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => deleteMutation.mutate(imageId)
                }
            ]
        );
    };

    const handleDragEnd = async ({ data }: { data: PortfolioImage[] }) => {
        // Optimistic update
        queryClient.setQueryData(['portfolio', profile?.id], data);

        try {
            const updates = data.map((img, idx) => ({
                id: img.id,
                display_order: idx + 1,
            }));

            // Sequential update for simplicity
            for (const update of updates) {
                await supabase
                    .from('portfolio_images')
                    .update({ display_order: update.display_order })
                    .eq('id', update.id);
            }
        } catch (error) {
            console.error("Reorder failed", error);
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
            Alert.alert("Erreur", "Impossible de sauvegarder l'ordre");
        }
    };

    const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<PortfolioImage>) => {
        const index = getIndex();
        return (
            <ScaleDecorator>
                <TouchableOpacity
                    onLongPress={drag}
                    disabled={isActive}
                    activeOpacity={1}
                    style={[
                        styles.imageContainer,
                        { opacity: isActive ? 0.7 : 1 }
                    ]}
                >
                    {/* Drag Handle Indicator */}
                    <View style={styles.dragHandle}>
                        <GripVertical size={20} color={Colors.gray[400]} />
                    </View>

                    {/* Image Thumbnail */}
                    <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />

                    {/* Content Info */}
                    <View style={styles.rowContent}>
                        <Text style={styles.rowTitle}>Photo {index !== undefined ? index + 1 : ''}</Text>
                    </View>

                    {/* Delete Action */}
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(item.id)}
                    >
                        <Trash2 size={20} color={Colors.error} />
                    </TouchableOpacity>
                </TouchableOpacity>
            </ScaleDecorator>
        );
    };

    if (isLoading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Mon Portfolio</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handlePickImage}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                        <Plus size={24} color={Colors.white} />
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.infoBar}>
                <Text style={styles.infoText}>Maintenez une photo appuyée pour la déplacer</Text>
            </View>

            <DraggableFlatList
                data={images || []}
                onDragEnd={handleDragEnd}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                containerStyle={{ flex: 1 }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Aucune photo dans votre portfolio</Text>
                        <Text style={styles.emptySubtext}>Ajoutez des photos pour mettre en valeur votre travail</Text>
                    </View>
                }
            />
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
        borderBottomColor: Colors.gray[200],
    },
    backButton: {
        padding: Layout.spacing.xs,
    },
    title: {
        fontSize: Layout.fontSize.lg,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    addButton: {
        backgroundColor: Colors.primary.DEFAULT,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoBar: {
        backgroundColor: Colors.primary.light,
        padding: Layout.spacing.sm,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    infoText: {
        color: Colors.primary.DEFAULT,
        fontSize: Layout.fontSize.sm,
        fontWeight: '500',
    },
    listContent: {
        padding: Layout.spacing.md,
        gap: Layout.spacing.md,
    },
    imageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: Layout.radius.md,
        padding: Layout.spacing.sm,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: Layout.spacing.xs,
    },
    gridImageContainer: { // Legacy or alternative grid style if needed, kept for reference but unused
        flex: 1,
        margin: Layout.spacing.xs,
        borderRadius: Layout.radius.md,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: Colors.gray[100],
    },
    dragHandle: {
        paddingRight: Layout.spacing.sm,
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: Layout.radius.sm,
        backgroundColor: Colors.gray[100],
    },
    rowContent: {
        flex: 1,
        marginLeft: Layout.spacing.md,
        justifyContent: 'center',
    },
    rowTitle: {
        fontSize: Layout.fontSize.md,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    rowSubtitle: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.secondary,
    },
    deleteButton: {
        padding: Layout.spacing.sm,
        // backgroundColor: Colors.gray[100], // Optional hover effect
        borderRadius: Layout.radius.full,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Layout.spacing.xl * 2,
    },
    emptyText: {
        fontSize: Layout.fontSize.md,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: Layout.spacing.sm,
    },
    emptySubtext: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.secondary,
    },
});
