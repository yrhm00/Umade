/**
 * Bottom sheet pour les filtres de recherche de prestataires
 */

import React, { useState, useEffect, forwardRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import Slider from '@react-native-community/slider';
import { Button } from '@/components/ui/Button';
import { CategoryPill } from '@/components/common/CategoryPill';
import { useCategories } from '@/hooks/useCategories';
import { ProviderFilters } from '@/types';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface FiltersBottomSheetProps {
  filters: ProviderFilters;
  onApply: (filters: ProviderFilters) => void;
  onReset: () => void;
}

// Villes belges principales
const CITIES = [
  'Bruxelles',
  'Anvers',
  'Gand',
  'Charleroi',
  'Liège',
  'Bruges',
  'Namur',
  'Louvain',
  'Mons',
  'Malines',
];

// Options de note minimum
const RATING_OPTIONS = [
  { label: 'Tous', value: undefined },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '4.5+', value: 4.5 },
];

export const FiltersBottomSheet = forwardRef<BottomSheet, FiltersBottomSheetProps>(
  ({ filters, onApply, onReset }, ref) => {
    const { data: categories } = useCategories();

    const [localFilters, setLocalFilters] = useState<ProviderFilters>(filters);

    // Synchroniser les filtres locaux avec les filtres props
    useEffect(() => {
      setLocalFilters(filters);
    }, [filters]);

    const snapPoints = ['75%'];

    const handleApply = () => {
      onApply(localFilters);
      (ref as any)?.current?.close();
    };

    const handleReset = () => {
      setLocalFilters({});
      onReset();
    };

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    // Compter le nombre de filtres actifs
    const activeFiltersCount = [
      localFilters.categorySlug,
      localFilters.city,
      localFilters.minRating,
      localFilters.maxPrice,
    ].filter(Boolean).length;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filtres</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>

          <BottomSheetScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Catégories */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Catégorie</Text>
              <View style={styles.optionsWrap}>
                <CategoryPill
                  label="Toutes"
                  isSelected={!localFilters.categorySlug}
                  onPress={() =>
                    setLocalFilters((f) => ({ ...f, categorySlug: undefined }))
                  }
                />
                {categories?.map((cat) => (
                  <CategoryPill
                    key={cat.id}
                    label={cat.name}
                    icon={cat.icon || undefined}
                    isSelected={localFilters.categorySlug === cat.slug}
                    onPress={() =>
                      setLocalFilters((f) => ({
                        ...f,
                        categorySlug:
                          f.categorySlug === cat.slug ? undefined : cat.slug,
                      }))
                    }
                  />
                ))}
              </View>
            </View>

            {/* Ville */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Ville</Text>
              <View style={styles.optionsWrap}>
                <CategoryPill
                  label="Toutes"
                  isSelected={!localFilters.city}
                  onPress={() =>
                    setLocalFilters((f) => ({ ...f, city: undefined }))
                  }
                />
                {CITIES.map((city) => (
                  <CategoryPill
                    key={city}
                    label={city}
                    isSelected={localFilters.city === city}
                    onPress={() =>
                      setLocalFilters((f) => ({
                        ...f,
                        city: f.city === city ? undefined : city,
                      }))
                    }
                  />
                ))}
              </View>
            </View>

            {/* Note minimum */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Note minimum</Text>
              <View style={styles.ratingOptions}>
                {RATING_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    style={[
                      styles.ratingOption,
                      localFilters.minRating === opt.value &&
                        styles.ratingOptionSelected,
                    ]}
                    onPress={() =>
                      setLocalFilters((f) => ({ ...f, minRating: opt.value }))
                    }
                  >
                    <Text
                      style={[
                        styles.ratingOptionText,
                        localFilters.minRating === opt.value &&
                          styles.ratingOptionTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Budget maximum */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Budget maximum</Text>
              <Text style={styles.budgetValue}>
                {localFilters.maxPrice
                  ? `${localFilters.maxPrice.toLocaleString('fr-BE')} €`
                  : 'Pas de limite'}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={5000}
                step={100}
                value={localFilters.maxPrice || 0}
                onValueChange={(value) =>
                  setLocalFilters((f) => ({
                    ...f,
                    maxPrice: value > 0 ? value : undefined,
                  }))
                }
                minimumTrackTintColor={Colors.primary.DEFAULT}
                maximumTrackTintColor={Colors.gray[200]}
                thumbTintColor={Colors.primary.DEFAULT}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>0 €</Text>
                <Text style={styles.sliderLabel}>5000 €</Text>
              </View>
            </View>
          </BottomSheetScrollView>

          {/* Footer avec bouton appliquer */}
          <View style={styles.footer}>
            <Button
              title={
                activeFiltersCount > 0
                  ? `Appliquer (${activeFiltersCount} filtre${activeFiltersCount > 1 ? 's' : ''})`
                  : 'Appliquer les filtres'
              }
              onPress={handleApply}
              size="lg"
              fullWidth
            />
          </View>
        </View>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Layout.radius.xl,
    borderTopRightRadius: Layout.radius.xl,
  },
  handleIndicator: {
    backgroundColor: Colors.gray[300],
    width: 40,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  title: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  resetText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary.DEFAULT,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl,
  },
  filterSection: {
    marginBottom: Layout.spacing.xl,
  },
  filterLabel: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Layout.spacing.md,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  ratingOptions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  ratingOption: {
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.radius.md,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    backgroundColor: Colors.white,
  },
  ratingOptionSelected: {
    borderColor: Colors.primary.DEFAULT,
    backgroundColor: Colors.primary.DEFAULT,
  },
  ratingOptionText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  ratingOptionTextSelected: {
    color: Colors.white,
  },
  budgetValue: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
    marginBottom: Layout.spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.tertiary,
  },
  footer: {
    padding: Layout.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    backgroundColor: Colors.white,
  },
});
