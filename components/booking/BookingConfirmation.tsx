/**
 * Booking Confirmation Component
 * Dark Mode Support
 */

import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { formatDate, formatPrice } from '@/lib/utils';
import { Service } from '@/types';
import { Calendar, Clock, FileText } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BookingConfirmationProps {
  providerName: string;
  service: Service;
  date: string;
  time: string | null;
  eventTitle?: string;
  notes?: string;
}

export function BookingConfirmation({
  providerName,
  service,
  date,
  time,
  eventTitle,
  notes,
}: BookingConfirmationProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          shadowColor: isDark ? colors.primary : '#000000',
          shadowOpacity: isDark ? 0.3 : 0.05,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Récapitulatif</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          Prestataire
        </Text>
        <Text style={[styles.sectionValue, { color: colors.text }]}>
          {providerName}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          Service
        </Text>
        <Text style={[styles.sectionValue, { color: colors.text }]}>
          {service.name}
        </Text>
        {service.duration_minutes != null && (
          <View style={styles.row}>
            <Clock size={14} color={colors.textTertiary} />
            <Text style={[styles.meta, { color: colors.textTertiary }]}>
              {service.duration_minutes} min
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          Date et heure
        </Text>
        <View style={styles.row}>
          <Calendar size={16} color={colors.textSecondary} />
          <Text style={[styles.sectionValue, { color: colors.text }]}>
            {formatDate(date)}
          </Text>
        </View>
        {time && (
          <View style={styles.row}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={[styles.sectionValue, { color: colors.text }]}>
              {time.slice(0, 5)}
            </Text>
          </View>
        )}
      </View>

      {eventTitle && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
              Événement lié
            </Text>
            <Text style={[styles.sectionValue, { color: colors.text }]}>
              {eventTitle}
            </Text>
          </View>
        </>
      )}

      {notes && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
              Notes
            </Text>
            <View style={styles.row}>
              <FileText size={16} color={colors.textSecondary} />
              <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                {notes}
              </Text>
            </View>
          </View>
        </>
      )}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.totalSection}>
        <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
        <Text style={[styles.totalPrice, { color: colors.primary }]}>
          {formatPrice(service.price)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
    marginBottom: Layout.spacing.lg,
  },
  section: {
    gap: Layout.spacing.xs,
  },
  sectionLabel: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionValue: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  meta: {
    fontSize: Layout.fontSize.sm,
  },
  notesText: {
    fontSize: Layout.fontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: Layout.spacing.md,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
  },
});
