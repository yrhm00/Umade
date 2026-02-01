/**
 * Ecran de gestion des inspirations pour les prestataires (Phase 9)
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Plus,
  ChevronLeft,
  Trash2,
  Eye,
  Heart,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Shadows } from '@/constants/Shadows';
import { PressableScale } from '@/components/ui/PressableScale';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useMyInspirations, useDeleteInspiration } from '@/hooks/useCreateInspiration';
import { InspirationWithProvider, getEventTypeLabel } from '@/types/inspiration';

export default function ProviderInspirationsScreen() {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: inspirations, isLoading, refetch, isRefetching } = useMyInspirations();
  const { mutateAsync: deleteInspiration, isPending: isDeleting } = useDeleteInspiration();

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleCreate = useCallback(() => {
    router.push('/(provider)/create-inspiration' as any);
  }, []);

  const handleDelete = useCallback(
    (inspiration: InspirationWithProvider) => {
      Alert.alert(
        'Supprimer cette inspiration ?',
        `"${inspiration.title || 'Sans titre'}" sera definitivement supprimee.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                setDeletingId(inspiration.id);
                await deleteInspiration(inspiration.id);
              } catch (error) {
                Alert.alert('Erreur', 'Impossible de supprimer cette inspiration.');
              } finally {
                setDeletingId(null);
              }
            },
          },
        ]
      );
    },
    [deleteInspiration]
  );

  const handleView = useCallback((inspiration: InspirationWithProvider) => {
    router.push(`/inspiration/${inspiration.id}` as any);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: InspirationWithProvider; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(index * 50).springify()}
        style={styles.card}
      >
        <Pressable onPress={() => handleView(item)} style={styles.cardContent}>
          {/* Image */}
          <View style={styles.imageContainer}>
            {item.inspiration_images?.[0] ? (
              <Image
                source={{ uri: item.inspiration_images[0].thumbnail_url || item.inspiration_images[0].image_url }}
                style={styles.image}
                contentFit="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>📷</Text>
              </View>
            )}
            <View style={styles.imageBadge}>
              <Text style={styles.imageBadgeText}>
                {item.inspiration_images?.length || 0} photos
              </Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title || 'Sans titre'}
            </Text>
            <Text style={styles.eventType}>
              {getEventTypeLabel(item.event_type)}
            </Text>

            {/* Stats */}
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Eye size={14} color={Colors.text.tertiary} />
                <Text style={styles.statText}>{item.view_count}</Text>
              </View>
              <View style={styles.stat}>
                <Heart size={14} color={Colors.text.tertiary} />
                <Text style={styles.statText}>{item.favorite_count}</Text>
              </View>
            </View>
          </View>

          {/* Delete button */}
          <PressableScale
            onPress={() => handleDelete(item)}
            haptic="light"
            style={styles.deleteButton}
          >
            {deletingId === item.id ? (
              <LoadingSpinner size="small" />
            ) : (
              <Trash2 size={18} color={Colors.error.DEFAULT} />
            )}
          </PressableScale>
        </Pressable>
      </Animated.View>
    ),
    [handleView, handleDelete, deletingId]
  );

  const inspirationsList = useMemo(() => inspirations ?? [], [inspirations]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullScreen message="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <PressableScale onPress={handleBack} haptic="light">
          <View style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.text.primary} />
          </View>
        </PressableScale>
        <Text style={styles.headerTitle}>Mes inspirations</Text>
        <PressableScale onPress={handleCreate} haptic="light">
          <View style={styles.addButton}>
            <Plus size={24} color={Colors.white} />
          </View>
        </PressableScale>
      </View>

      {/* List */}
      <FlatList
        data={inspirationsList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon="🎨"
            title="Aucune inspiration"
            description="Partagez vos plus belles realisations pour inspirer vos futurs clients."
            actionLabel="Creer une inspiration"
            onAction={handleCreate}
          />
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
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 32,
  },
  imageBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  imageBadgeText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    padding: Layout.spacing.md,
  },
  title: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  eventType: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Layout.spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.tertiary,
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.sm,
  },
});
