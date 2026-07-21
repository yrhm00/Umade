/**
 * Vue carte des prestataires (résultats de recherche).
 * Les prestataires sont positionnés par ville (coordonnées statiques des
 * principales villes belges + léger décalage pour éviter la superposition).
 * ⚠️ Nécessite un build natif (react-native-maps) — pas de rendu en Expo Go.
 */

import { ProviderCard } from '@/components/providers/ProviderCard';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { useColors } from '@/hooks/useColors';
import { useSearchProviders } from '@/hooks/useProviders';
import { ProviderListItem } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { PressableScale } from '@/components/ui/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';

// Coordonnées des villes proposées dans les filtres de recherche
const CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  bruxelles: { latitude: 50.8503, longitude: 4.3517 },
  anvers: { latitude: 51.2194, longitude: 4.4025 },
  gand: { latitude: 51.0543, longitude: 3.7174 },
  charleroi: { latitude: 50.4108, longitude: 4.4446 },
  liège: { latitude: 50.6326, longitude: 5.5797 },
  liege: { latitude: 50.6326, longitude: 5.5797 },
  bruges: { latitude: 51.2093, longitude: 3.2247 },
  namur: { latitude: 50.4674, longitude: 4.8718 },
  louvain: { latitude: 50.8798, longitude: 4.7005 },
  mons: { latitude: 50.4542, longitude: 3.9523 },
  malines: { latitude: 51.0259, longitude: 4.4776 },
};

// Centre de la Belgique
const BELGIUM_REGION = {
  latitude: 50.65,
  longitude: 4.45,
  latitudeDelta: 2.4,
  longitudeDelta: 2.6,
};

interface PositionedProvider extends ProviderListItem {
  latitude: number;
  longitude: number;
}

function positionProviders(providers: ProviderListItem[]): PositionedProvider[] {
  const perCityCount: Record<string, number> = {};
  const positioned: PositionedProvider[] = [];

  for (const provider of providers) {
    const cityKey = provider.city?.trim().toLowerCase() ?? '';
    const coords = CITY_COORDS[cityKey];
    if (!coords) continue; // ville inconnue → pas affichable sur la carte

    // Décale chaque prestataire de la même ville en spirale pour éviter
    // que les marqueurs se superposent exactement.
    const index = perCityCount[cityKey] ?? 0;
    perCityCount[cityKey] = index + 1;
    const angle = index * 2.4; // radians, ~137° golden angle
    const radius = 0.006 * Math.sqrt(index);

    positioned.push({
      ...provider,
      latitude: coords.latitude + radius * Math.cos(angle),
      longitude: coords.longitude + radius * Math.sin(angle),
    });
  }

  return positioned;
}

export default function ProvidersMapScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ categorySlug?: string; city?: string }>();
  const [selected, setSelected] = useState<PositionedProvider | null>(null);

  const { data } = useSearchProviders({
    categorySlug: params.categorySlug || undefined,
    city: params.city || undefined,
  });

  const positioned = useMemo(
    () => positionProviders(data?.pages.flat() ?? []),
    [data]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <PressableScale
          onPress={() => router.back()}
          haptic="light"
          accessibilityLabel="Retour"
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        >
          <ArrowLeft size={22} color={colors.text} />
        </PressableScale>
        <Text style={[styles.title, { color: colors.text }]}>Carte des prestataires</Text>
        <View style={styles.backButton} />
      </View>

      <MapView
        style={styles.map}
        initialRegion={BELGIUM_REGION}
        showsPointsOfInterest={false}
        onPress={() => setSelected(null)}
      >
        {positioned.map((provider) => (
          <Marker
            key={provider.id}
            coordinate={{ latitude: provider.latitude, longitude: provider.longitude }}
            onPress={() => setSelected(provider)}
          >
            <View
              style={[
                styles.marker,
                {
                  backgroundColor:
                    selected?.id === provider.id ? colors.primary : '#FFFFFF',
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.markerText,
                  { color: selected?.id === provider.id ? '#FFFFFF' : colors.primary },
                ]}
                numberOfLines={1}
              >
                {provider.min_price ? `${Math.round(provider.min_price)}€` : '•'}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {selected ? (
        <View style={styles.selectedCard}>
          <ProviderCard provider={selected} variant="list" />
        </View>
      ) : (
        <View style={[styles.hintChip, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            {positioned.length} prestataire{positioned.length > 1 ? 's' : ''} sur la carte
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: Layout.fontSize.lg,
    fontFamily: fontFamily.bold,
  },
  map: {
    flex: 1,
  },
  marker: {
    borderWidth: 1.5,
    borderRadius: Layout.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  markerText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
  },
  selectedCard: {
    position: 'absolute',
    left: Layout.spacing.md,
    right: Layout.spacing.md,
    bottom: Layout.spacing.lg,
  },
  hintChip: {
    position: 'absolute',
    bottom: Layout.spacing.lg,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: Layout.radius.full,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: 8,
  },
  hintText: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.medium,
  },
});
