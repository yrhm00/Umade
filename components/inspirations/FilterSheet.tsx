/**
 * Bottom sheet pour les filtres d'inspirations (Phase 9)
 */

import React, { forwardRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { X, Check } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { PressableScale } from '@/components/ui/PressableScale';
import {
  InspirationFilters,
  EventType,
  InspirationStyle,
  EVENT_TYPES,
  INSPIRATION_STYLES,
} from '@/types/inspiration';

interface FilterSheetProps {
  filters: InspirationFilters;
  onFiltersChange: (filters: InspirationFilters) => void;
  onClose: () => void;
}

export const FilterSheet = forwardRef<BottomSheet, FilterSheetProps>(
  function FilterSheet({ filters, onFiltersChange, onClose }, ref) {
    const snapPoints = useMemo(() => ['70%'], []);

    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    const handleEventTypeSelect = (type: EventType | null) => {
      onFiltersChange({
        ...filters,
        event_type: filters.event_type === type ? null : type,
      });
    };

    const handleStyleSelect = (style: InspirationStyle | null) => {
      onFiltersChange({
        ...filters,
        style: filters.style === style ? null : style,
      });
    };

    const handleReset = () => {
      onFiltersChange({
        event_type: null,
        style: null,
        searchQuery: filters.searchQuery,
      });
    };

    const handleApply = () => {
      onClose();
    };

    const hasFilters = filters.event_type || filters.style;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filtres</Text>
            <PressableScale onPress={onClose} haptic="light">
              <View style={styles.closeButton}>
                <X size={20} color={Colors.text.primary} />
              </View>
            </PressableScale>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Type d'evenement */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Type d'evenement</Text>
              <View style={styles.chipsContainer}>
                {Object.entries(EVENT_TYPES).map(([value, label]) => (
                  <FilterChip
                    key={value}
                    label={label}
                    selected={filters.event_type === value}
                    onPress={() => handleEventTypeSelect(value as EventType)}
                  />
                ))}
              </View>
            </View>

            {/* Style */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Style</Text>
              <View style={styles.chipsContainer}>
                {Object.entries(INSPIRATION_STYLES).map(([value, label]) => (
                  <FilterChip
                    key={value}
                    label={label}
                    selected={filters.style === value}
                    onPress={() => handleStyleSelect(value as InspirationStyle)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {hasFilters && (
              <AnimatedButton
                title="Effacer"
                variant="outline"
                size="md"
                onPress={handleReset}
                style={styles.resetButton}
              />
            )}
            <AnimatedButton
              title="Appliquer"
              variant="primary"
              size="md"
              onPress={handleApply}
              style={styles.applyButton}
            />
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

// ============================================
// Composant Chip pour les filtres
// ============================================

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      {selected && (
        <Check size={14} color={Colors.white} style={styles.chipCheck} />
      )}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
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
    paddingHorizontal: Layout.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingTop: Layout.spacing.lg,
  },
  section: {
    marginBottom: Layout.spacing.xl,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Layout.spacing.md,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    backgroundColor: Colors.gray[100],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  chipSelected: {
    backgroundColor: Colors.primary.DEFAULT,
    borderColor: Colors.primary.DEFAULT,
  },
  chipCheck: {
    marginRight: 4,
  },
  chipText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: Colors.white,
  },
  actions: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    paddingVertical: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  resetButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
});
