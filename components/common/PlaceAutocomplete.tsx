/**
 * Champ de saisie de lieu avec suggestions Mapbox.
 *
 * L'utilisateur reste libre de saisir un texte libre : les suggestions
 * n'apparaissent qu'en complément. Si le jeton Mapbox n'est pas configuré,
 * le composant se comporte comme un simple champ texte.
 */

import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import {
  isPlaceSearchEnabled,
  usePlaceSearch,
  type PlaceSuggestion,
} from '@/hooks/usePlaceSearch';
import { MapPin, Navigation } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface PlaceAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  /** Appelé quand une suggestion est retenue (nom + coordonnées). */
  onSelectPlace?: (place: PlaceSuggestion) => void;
  placeholder?: string;
  label?: string;
}

export function PlaceAutocomplete({
  value,
  onChangeText,
  onSelectPlace,
  placeholder = 'Ex. Château de Belle-Vue, Dinant',
  label,
}: PlaceAutocompleteProps) {
  const colors = useColors();
  const [isFocused, setIsFocused] = useState(false);
  // Masque la liste juste après un choix, sinon elle se rouvre aussitôt
  // puisque la valeur du champ vient de changer.
  const [justPicked, setJustPicked] = useState(false);

  const { suggestions, isLoading } = usePlaceSearch(justPicked ? '' : value);
  const showList = isFocused && !justPicked && suggestions.length > 0;

  const handlePick = (place: PlaceSuggestion) => {
    onChangeText(place.name);
    onSelectPlace?.(place);
    setJustPicked(true);
  };

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      ) : null}

      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.card,
            borderColor: isFocused ? colors.primary : colors.cardBorder,
          },
        ]}
      >
        <MapPin size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={(t) => {
            setJustPicked(false);
            onChangeText(t);
          }}
          onFocus={() => setIsFocused(true)}
          // Délai avant fermeture : sans lui, le blur annule le tap sur une
          // suggestion avant que son onPress ne se déclenche.
          onBlur={() => setTimeout(() => setIsFocused(false), 180)}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          autoCorrect={false}
        />
        {isLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      {showList ? (
        <View
          style={[
            styles.list,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          {suggestions.map((place, index) => (
            <TouchableOpacity
              key={place.id}
              onPress={() => handlePick(place)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${place.name}, ${place.address}`}
              style={[
                styles.row,
                index < suggestions.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Navigation size={15} color={colors.primary} />
              <View style={styles.rowCopy}>
                <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
                  {place.name}
                </Text>
                {place.address ? (
                  <Text
                    style={[styles.rowAddress, { color: colors.textTertiary }]}
                    numberOfLines={1}
                  >
                    {place.address}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {!isPlaceSearchEnabled ? (
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          Saisie libre — les suggestions de lieux ne sont pas activées.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', zIndex: 10 },
  label: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    marginBottom: Layout.spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    borderWidth: 1.5,
    borderRadius: Layout.radius.md,
    paddingHorizontal: Layout.spacing.md,
    minHeight: 52,
  },
  input: { flex: 1, fontSize: Layout.fontSize.md, paddingVertical: 0 },
  list: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    overflow: 'hidden',
    zIndex: 20,
    // Ombre : la liste flotte au-dessus du contenu suivant.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm + 2,
  },
  rowCopy: { flex: 1 },
  rowName: { fontSize: Layout.fontSize.sm, fontWeight: '600' },
  rowAddress: { fontSize: Layout.fontSize.xs, marginTop: 1 },
  hint: { fontSize: Layout.fontSize.xs, marginTop: Layout.spacing.xs },
});
