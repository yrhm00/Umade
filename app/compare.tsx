/**
 * Écran de comparaison prestataires
 */

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useProviderPublicStats } from '@/hooks/useProviderPublicStats';
import { useProviderDetail } from '@/hooks/useProviders';
import { goBackOrFallback } from '@/lib/navigation';
import { formatPrice } from '@/lib/utils';
import { useCompareStore } from '@/stores/compareStore';
import { Stack, useRouter } from 'expo-router';
import { MessageCircle, Trash2 } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CompareMetric = {
  key: string;
  label: string;
  better: 'higher' | 'lower' | 'none';
  getValue: (entry: ProviderCompareEntry) => string | number | null;
};

type ProviderCompareEntry = {
  providerId: string;
  businessName: string;
  avatarUrl?: string | null;
  category: string;
  rating: number | null;
  reviewCount: number;
  minPrice: number | null;
  city: string;
  avgResponseTime: number | null;
  responseRate: number | null;
  bookingsThisMonth: number | null;
};

function toNumber(value: string | number | null): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

export default function CompareScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();

  const compareIds = useCompareStore((state) => state.compareIds);
  const removeFromCompare = useCompareStore((state) => state.removeFromCompare);
  const clearCompare = useCompareStore((state) => state.clearCompare);

  const detailA = useProviderDetail(compareIds[0]);
  const detailB = useProviderDetail(compareIds[1]);
  const detailC = useProviderDetail(compareIds[2]);

  const statsA = useProviderPublicStats(compareIds[0]);
  const statsB = useProviderPublicStats(compareIds[1]);
  const statsC = useProviderPublicStats(compareIds[2]);

  const details = [detailA.data, detailB.data, detailC.data];
  const stats = [statsA.data, statsB.data, statsC.data];

  const entries = useMemo<ProviderCompareEntry[]>(() => {
    const result: ProviderCompareEntry[] = [];

    compareIds.forEach((providerId, index) => {
      const provider = details[index];
      if (!provider) return;

      const services = provider.services || [];
      const minPrice = services.length > 0 ? Math.min(...services.map((item) => item.price)) : null;

      result.push({
        providerId,
        businessName: provider.business_name,
        avatarUrl: provider.profiles?.avatar_url,
        category: provider.category?.name || '—',
        rating: provider.average_rating,
        reviewCount: provider.review_count || 0,
        minPrice,
        city: provider.city || '—',
        avgResponseTime: stats[index]?.avg_response_time ?? null,
        responseRate: stats[index]?.response_rate ?? null,
        bookingsThisMonth: stats[index]?.bookings_this_month ?? null,
      });
    });

    return result;
  }, [compareIds, details, stats]);

  const metrics = useMemo<CompareMetric[]>(() => {
    return [
      {
        key: 'category',
        label: 'Catégorie',
        better: 'none',
        getValue: (entry) => entry.category,
      },
      {
        key: 'rating',
        label: 'Note moyenne',
        better: 'higher',
        getValue: (entry) => (entry.rating != null ? Number(entry.rating.toFixed(1)) : null),
      },
      {
        key: 'reviews',
        label: "Nombre d'avis",
        better: 'higher',
        getValue: (entry) => entry.reviewCount,
      },
      {
        key: 'min_price',
        label: 'Prix min',
        better: 'lower',
        getValue: (entry) => entry.minPrice,
      },
      {
        key: 'city',
        label: 'Ville',
        better: 'none',
        getValue: (entry) => entry.city,
      },
      {
        key: 'response_time',
        label: 'Temps de réponse',
        better: 'lower',
        getValue: (entry) => entry.avgResponseTime,
      },
      {
        key: 'response_rate',
        label: 'Taux de réponse',
        better: 'higher',
        getValue: (entry) => entry.responseRate,
      },
      {
        key: 'bookings_month',
        label: 'Réservations ce mois',
        better: 'higher',
        getValue: (entry) => entry.bookingsThisMonth,
      },
    ];
  }, []);

  const loading =
    compareIds.length > 0 &&
    [detailA, detailB, detailC].some((item, idx) => compareIds[idx] && item.isLoading);

  if (loading && entries.length === 0) {
    return <LoadingSpinner fullScreen message="Chargement de la comparaison..." />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Comparer prestataires',
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.backgroundSecondary },
        }}
      />

      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun prestataire à comparer</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Ajoute jusqu'à 3 prestataires depuis la recherche.
            </Text>
            <Button title="Retour recherche" onPress={() => goBackOrFallback(router)} />
          </View>
        ) : (
          <>
            <View style={styles.headerActions}>
              <Pressable
                onPress={clearCompare}
                style={({ pressed }) => [
                  styles.clearAllButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: pressed ? `${colors.error}16` : 'transparent',
                  },
                ]}
              >
                <Trash2 size={15} color={colors.error} />
                <Text style={[styles.clearAllText, { color: colors.error }]}>Vider la comparaison</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableWrap}>
              <View>
                <View style={[styles.row, styles.headerRow]}>
                  <View style={[styles.labelCell, { borderColor: colors.border }]}>
                    <Text style={[styles.labelCellText, { color: colors.textSecondary }]}>Prestataires</Text>
                  </View>

                  {entries.map((entry) => (
                    <View
                      key={entry.providerId}
                      style={[
                        styles.providerHeaderCell,
                        {
                          borderColor: colors.border,
                          backgroundColor: isDark ? colors.card : '#FFFFFF',
                        },
                      ]}
                    >
                      <Avatar source={entry.avatarUrl ?? undefined} name={entry.businessName} size="lg" />
                      <Text style={[styles.providerName, { color: colors.text }]} numberOfLines={2}>
                        {entry.businessName}
                      </Text>

                      <View style={styles.providerHeaderActions}>
                        <Pressable
                          onPress={() => router.push(`/chat/new?providerId=${entry.providerId}`)}
                          style={({ pressed }) => [
                            styles.contactIconButton,
                            {
                              borderColor: colors.border,
                              backgroundColor: pressed ? `${colors.primary}16` : 'transparent',
                            },
                          ]}
                        >
                          <MessageCircle size={16} color={colors.primary} />
                        </Pressable>

                        <Pressable
                          onPress={() => removeFromCompare(entry.providerId)}
                          style={({ pressed }) => [
                            styles.contactIconButton,
                            {
                              borderColor: colors.border,
                              backgroundColor: pressed ? `${colors.error}18` : 'transparent',
                            },
                          ]}
                        >
                          <Trash2 size={16} color={colors.error} />
                        </Pressable>
                      </View>

                      <Button
                        title="Contacter"
                        size="sm"
                        onPress={() => router.push(`/chat/new?providerId=${entry.providerId}`)}
                        fullWidth
                      />
                    </View>
                  ))}
                </View>

                {metrics.map((metric) => {
                  const numericValues = entries
                    .map((entry) => toNumber(metric.getValue(entry)))
                    .filter((value): value is number => value != null);

                  const best =
                    metric.better === 'none' || numericValues.length < 2
                      ? null
                      : metric.better === 'higher'
                      ? Math.max(...numericValues)
                      : Math.min(...numericValues);

                  const worst =
                    metric.better === 'none' || numericValues.length < 2
                      ? null
                      : metric.better === 'higher'
                      ? Math.min(...numericValues)
                      : Math.max(...numericValues);

                  return (
                    <View key={metric.key} style={styles.row}>
                      <View
                        style={[
                          styles.labelCell,
                          {
                            borderColor: colors.border,
                            backgroundColor: isDark ? colors.card : '#FFFFFF',
                          },
                        ]}
                      >
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{metric.label}</Text>
                      </View>

                      {entries.map((entry) => {
                        const rawValue = metric.getValue(entry);
                        const numeric = toNumber(rawValue);

                        let valueText = '—';
                        if (metric.key === 'min_price') {
                          valueText = numeric != null ? formatPrice(numeric) : '—';
                        } else if (metric.key === 'response_time') {
                          valueText = numeric != null ? `${Math.round(numeric)} min` : '—';
                        } else if (metric.key === 'response_rate') {
                          valueText = numeric != null ? `${Math.round(numeric)}%` : '—';
                        } else if (rawValue != null) {
                          valueText = String(rawValue);
                        }

                        const isBest = best != null && numeric != null && numeric === best && best !== worst;
                        const isWorst = worst != null && numeric != null && numeric === worst && best !== worst;

                        return (
                          <View
                            key={`${metric.key}-${entry.providerId}`}
                            style={[
                              styles.valueCell,
                              {
                                borderColor: colors.border,
                                backgroundColor: isDark ? colors.backgroundSecondary : '#FFFFFF',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.valueText,
                                {
                                  color: isBest
                                    ? colors.success
                                    : isWorst
                                    ? colors.error
                                    : colors.text,
                                },
                              ]}
                            >
                              {valueText}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </>
  );
}

const COLUMN_LABEL_WIDTH = 142;
const COLUMN_WIDTH = 220;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.xl,
    gap: Layout.spacing.md,
  },
  emptyTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: Layout.fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  headerActions: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.sm,
  },
  clearAllButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Layout.radius.full,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearAllText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  tableWrap: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  headerRow: {
    marginBottom: Layout.spacing.xs,
  },
  labelCell: {
    width: COLUMN_LABEL_WIDTH,
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    marginRight: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.sm,
    justifyContent: 'center',
  },
  labelCellText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  providerHeaderCell: {
    width: COLUMN_WIDTH,
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.sm,
    marginRight: Layout.spacing.sm,
    gap: Layout.spacing.sm,
    alignItems: 'flex-start',
  },
  providerName: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
    lineHeight: 18,
    minHeight: 36,
  },
  providerHeaderActions: {
    flexDirection: 'row',
    gap: Layout.spacing.xs,
  },
  contactIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueCell: {
    width: COLUMN_WIDTH,
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.md,
    marginRight: Layout.spacing.sm,
    marginBottom: Layout.spacing.xs,
    justifyContent: 'center',
  },
  valueText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
});
