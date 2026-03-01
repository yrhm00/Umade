/**
 * Indicateur de mode hors-ligne
 * Affiche une bannière quand l'utilisateur n'est pas connecté
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';
import { WifiOff } from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { useIsOnline } from '@/hooks/useNetworkStatus';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OfflineIndicatorProps {
  floating?: boolean;
}

export function OfflineIndicator({ floating = false }: OfflineIndicatorProps) {
  const colors = useColors();
  const isOnline = useIsOnline();
  const insets = useSafeAreaInsets();

  if (isOnline) {
    return null;
  }

  if (floating) {
    return (
      <Animated.View
        entering={FadeInDown.duration(260)}
        exiting={FadeOutUp.duration(260)}
        style={[
          styles.floatingContainer,
          {
            bottom: insets.bottom + Layout.tabBarHeight + Layout.spacing.md,
          },
        ]}
      >
        <View style={[styles.floatingContent, { backgroundColor: colors.warning }]}>
          <WifiOff size={16} color="#FFFFFF" />
          <Text style={styles.floatingText}>Mode hors-ligne</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutUp.duration(200)}
      style={[styles.banner, { backgroundColor: colors.warning }]}
    >
      <WifiOff size={16} color="#FFFFFF" />
      <Text style={styles.bannerText}>
        Vous êtes hors-ligne. Certaines fonctionnalités peuvent être limitées.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  bannerText: {
    fontSize: Layout.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  floatingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  floatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.radius.full,
    gap: Layout.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingText: {
    fontSize: Layout.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
