/**
 * Barre flottante de comparaison prestataires
 */

import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { supabase } from '@/lib/supabase';
import { useCompareStore } from '@/stores/compareStore';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../ui/Avatar';

interface CompareProviderMini {
  id: string;
  business_name: string;
  profiles?: {
    avatar_url: string | null;
    full_name: string | null;
  };
}

export function CompareBar() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const insets = useSafeAreaInsets();

  const compareIds = useCompareStore((state) => state.compareIds);
  const clearCompare = useCompareStore((state) => state.clearCompare);

  const queryKey = useMemo(() => ['compare-providers-mini', compareIds.join(',')], [compareIds]);

  const { data: providers = [] } = useQuery({
    queryKey,
    queryFn: async (): Promise<CompareProviderMini[]> => {
      if (compareIds.length === 0) return [];

      const { data, error } = await (supabase as any)
        .from('providers')
        .select('id, business_name, profiles:user_id(avatar_url, full_name)')
        .in('id', compareIds);

      if (error) throw error;
      const rows = (data || []) as CompareProviderMini[];

      const byId = new Map(rows.map((row) => [row.id, row]));
      return compareIds.map((id) => byId.get(id)).filter(Boolean) as CompareProviderMini[];
    },
    enabled: compareIds.length > 0,
    staleTime: 60_000,
  });

  if (compareIds.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      exiting={FadeOutDown.duration(180)}
      style={[
        styles.wrapper,
        {
          bottom: insets.bottom + 72,
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.card : '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.avatarsRow}>
          {providers.map((provider) => (
            <View key={provider.id} style={styles.avatarOverlap}>
              <Avatar
                source={provider.profiles?.avatar_url ?? undefined}
                name={provider.business_name}
                size="sm"
              />
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => router.push('/compare')}
          style={({ pressed }) => [
            styles.compareButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Text style={styles.compareText}>Comparer ({compareIds.length})</Text>
        </Pressable>

        <Pressable
          onPress={clearCompare}
          style={({ pressed }) => [
            styles.clearButton,
            {
              borderColor: colors.border,
              backgroundColor: pressed ? `${colors.primary}12` : 'transparent',
            },
          ]}
          hitSlop={8}
        >
          <X size={16} color={colors.textSecondary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: Layout.spacing.lg,
    right: Layout.spacing.lg,
    zIndex: 40,
  },
  card: {
    borderWidth: 1,
    borderRadius: Layout.radius.xl,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 2,
  },
  avatarOverlap: {
    marginRight: -8,
  },
  compareButton: {
    flex: 1,
    borderRadius: Layout.radius.full,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
  },
  compareText: {
    color: '#FFFFFF',
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  clearButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
