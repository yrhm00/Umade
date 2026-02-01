/**
 * Favorites screen - Provider favorites
 * Dark Mode Support
 */

import { ProviderCard } from '@/components/providers/ProviderCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { useFavorites } from '@/hooks/useFavorites';
import { ProviderListItem } from '@/types';
import { Stack, useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoritesScreen() {
    const router = useRouter();
    const colors = useColors();
    const { data: favorites, isLoading, refetch, isRefetching } = useFavorites();

    const renderItem = useCallback(({ item }: { item: any }) => {
        const providerData = item.providers;
        if (!providerData) return null;

        const providerListItem: ProviderListItem = {
            id: providerData.id,
            user_id: '',
            business_name: providerData.business_name,
            description: providerData.description,
            category_id: providerData.categories?.id || '',
            category_name: providerData.categories?.name || '',
            category_slug: providerData.categories?.slug || '',
            city: providerData.city,
            average_rating: providerData.average_rating,
            review_count: providerData.review_count,
            min_price: null,
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
                <Heart size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun favori</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    Vos prestataires favoris apparaîtront ici.
                </Text>
            </View>
        );
    }, [isLoading, colors]);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top', 'bottom']}>
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
        <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
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
                        tintColor={colors.primary}
                    />
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        marginTop: Layout.spacing.md,
        marginBottom: Layout.spacing.sm,
    },
    emptySubtitle: {
        fontSize: Layout.fontSize.md,
        textAlign: 'center',
    },
});
