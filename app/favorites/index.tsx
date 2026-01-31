import { ProviderCard } from '@/components/providers/ProviderCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useFavorites } from '@/hooks/useFavorites';
import { ProviderListItem } from '@/types';
import { Stack, useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoritesScreen() {
    const router = useRouter();
    const { data: favorites, isLoading, refetch, isRefetching } = useFavorites();

    const renderItem = useCallback(({ item }: { item: any }) => {
        // Map FavoriteWithProvider to ProviderListItem if necessary
        // The hook returns FavoriteWithProvider, but ProviderCard expects ProviderListItem
        // We need to adapt the data structure.

        const providerData = item.providers;
        if (!providerData) return null;

        const providerListItem: ProviderListItem = {
            id: providerData.id,
            user_id: '', // Not always available in this join, but needed for type
            business_name: providerData.business_name,
            description: providerData.description,
            category_id: providerData.categories?.id || '',
            category_name: providerData.categories?.name || '',
            category_slug: providerData.categories?.slug || '',
            city: providerData.city,
            average_rating: providerData.average_rating,
            review_count: providerData.review_count,
            min_price: null,
            // User request: "pas sa photo de profil", only portfolio image
            portfolio_image: providerData.portfolio_images?.[0]?.image_url || null,
        };

        return (
            <ProviderCard
                provider={providerListItem}
                variant="list"
                onPress={() => router.push(`/provider/${providerData.id}`)}
            />
        );
    }, [router]);

    const ListEmpty = useCallback(() => {
        if (isLoading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Heart size={48} color={Colors.gray[300]} />
                <Text style={styles.emptyTitle}>Aucun favori</Text>
                <Text style={styles.emptySubtitle}>
                    Vos prestataires favoris apparaîtront ici.
                </Text>
            </View>
        );
    }, [isLoading]);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        title: 'Mes favoris',
                        headerBackTitle: 'Profil',
                    }}
                />
                <LoadingSpinner fullScreen message="Chargement..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Mes favoris',
                    headerBackTitle: 'Profil',
                }}
            />
            <FlatList
                data={favorites || []}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    (!favorites || favorites.length === 0) && styles.emptyList
                ]}
                ListEmptyComponent={ListEmpty}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={Colors.primary.DEFAULT}
                    />
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    listContent: {
        padding: Layout.spacing.md,
        gap: Layout.spacing.md,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.xl,
    },
    emptyTitle: {
        fontSize: Layout.fontSize.lg,
        fontWeight: '600',
        color: Colors.text.primary,
        marginTop: Layout.spacing.md,
        marginBottom: Layout.spacing.sm,
    },
    emptySubtitle: {
        fontSize: Layout.fontSize.md,
        color: Colors.text.secondary,
        textAlign: 'center',
    },
});
