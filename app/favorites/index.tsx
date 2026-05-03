/**
 * Favorites screen - Provider favorites
 * Dark Mode Support
 */

import { ClientHeader } from '@/components/client/ClientHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ProviderCard } from '@/components/providers/ProviderCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useFavorites } from '@/hooks/useFavorites';
import { goBackOrFallback } from '@/lib/navigation';
import { ProviderListItem } from '@/types';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Heart, Search } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoritesScreen() {
    const router = useRouter();
    const colors = useColors();
    const isDark = useIsDarkTheme();
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
            <EmptyState
                icon={<Heart size={32} color={colors.primary} />}
                title="Aucun favori"
                description="Garde les prestataires que tu veux revoir dans cette liste."
                actionLabel="Trouver un prestataire"
                onAction={() => router.push('/(tabs)/search' as any)}
            />
        );
    }, [isLoading, colors.primary, router]);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top', 'bottom']}>
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />
                <ClientHeader
                    eyebrow="Favoris"
                    title="Prestataires suivis"
                    subtitle="Les contacts que tu veux garder sous la main."
                    colors={colors}
                    isDark={isDark}
                    leadingIcon={ArrowLeft}
                    leadingLabel="Retour"
                    onLeading={() => goBackOrFallback(router)}
                    actionIcon={Search}
                    actionLabel="Trouver un prestataire"
                    onAction={() => router.push('/(tabs)/search' as any)}
                />
                <LoadingSpinner fullScreen message="Chargement..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top', 'bottom']}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <ClientHeader
                eyebrow="Favoris"
                title="Prestataires suivis"
                subtitle={`${favorites?.length ?? 0} contact${favorites && favorites.length > 1 ? 's' : ''} à retrouver vite.`}
                colors={colors}
                isDark={isDark}
                leadingIcon={ArrowLeft}
                leadingLabel="Retour"
                onLeading={() => goBackOrFallback(router)}
                actionIcon={Search}
                actionLabel="Trouver un prestataire"
                onAction={() => router.push('/(tabs)/search' as any)}
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
});
