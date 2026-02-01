/**
 * Bottom sheet pour les filtres d'inspirations (Phase 9)
 */

import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import {
  EVENT_TYPES,
  EventType,
  INSPIRATION_STYLES,
  InspirationFilters,
  InspirationStyle,
} from '@/types/inspiration';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { Check, X } from 'lucide-react-native';
import React, { forwardRef, useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FilterSheetProps {
  filters: InspirationFilters;
  onFiltersChange: (filters: InspirationFilters) => void;
  onClose: () => void;
}

export const FilterSheet = forwardRef<BottomSheet, FilterSheetProps>(
  function FilterSheet({ filters, onFiltersChange, onClose }, ref) {
    const snapPoints = useMemo(() => ['75%'], []);
    const insets = useSafeAreaInsets();
    const colors = useColors();
    const isDark = useIsDarkTheme();

    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={isDark ? 0.7 : 0.5}
        />
      ),
      [isDark]
    );

    const handleEventTypeSelect = (type: EventType) => {
      const current = filters.event_types || [];
      const isSelected = current.includes(type);
      onFiltersChange({
        ...filters,
        event_types: isSelected
          ? current.filter((t) => t !== type)
          : [...current, type],
      });
    };

    const handleStyleSelect = (style: InspirationStyle) => {
      const current = filters.styles || [];
      const isSelected = current.includes(style);
      onFiltersChange({
        ...filters,
        styles: isSelected
          ? current.filter((s) => s !== style)
          : [...current, style],
      });
    };

    const handleReset = () => {
      onFiltersChange({
        event_types: [],
        styles: [],
        searchQuery: filters.searchQuery,
      });
    };

    const handleApply = () => {
      onClose();
    };

    const hasFilters = (filters.event_types?.length ?? 0) > 0 || (filters.styles?.length ?? 0) > 0;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={[styles.sheetBackground, { backgroundColor: colors.background }]}
        handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: colors.border }]}
      >
        <BottomSheetView style={styles.container}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Filtres</Text>
            <PressableScale onPress={onClose} haptic="light">
              <View style={[styles.closeButton, { backgroundColor: isDark ? colors.backgroundTertiary : Colors.gray[100] }]}>
                <X size={20} color={colors.text} />
              </View>
            </PressableScale>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Type d'evenement */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Type d'evenement</Text>
              <View style={styles.chipsContainer}>
                {Object.entries(EVENT_TYPES).map(([value, label]) => (
                  <FilterChip
                    key={value}
                    label={label}
                    selected={filters.event_types?.includes(value as EventType) ?? false}
                    onPress={() => handleEventTypeSelect(value as EventType)}
                  />
                ))}
              </View>
            </View>

            {/* Style */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Style</Text>
              <View style={styles.chipsContainer}>
                {Object.entries(INSPIRATION_STYLES).map(([value, label]) => (
                  <FilterChip
                    key={value}
                    label={label}
                    selected={filters.styles?.includes(value as InspirationStyle) ?? false}
                    onPress={() => handleStyleSelect(value as InspirationStyle)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={[styles.actions, {
            paddingBottom: Math.max(insets.bottom, Layout.spacing.xl) + Layout.spacing.md,
            borderTopColor: colors.border
          }]}>
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
  const colors = useColors();
  const isDark = useIsDarkTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: isDark ? colors.backgroundTertiary : Colors.gray[100],
          borderColor: isDark ? 'transparent' : Colors.gray[200]
        },
        selected && {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        }
      ]}
    >
      {selected && (
        <Check size={14} color={Colors.white} style={styles.chipCheck} />
      )}
      <Text style={[
        styles.chipText,
        { color: colors.text },
        selected && { color: Colors.white }
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: Layout.radius.xl,
    borderTopRightRadius: Layout.radius.xl,
  },
  handleIndicator: {
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
  },
  headerTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    borderRadius: 20,
    borderWidth: 1,
  },
  chipCheck: {
    marginRight: 4,
  },
  chipText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    paddingVertical: Layout.spacing.lg,
    borderTopWidth: 1,
  },
  resetButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
});
