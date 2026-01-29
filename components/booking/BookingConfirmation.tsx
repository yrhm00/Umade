import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, Clock, MapPin, FileText } from 'lucide-react-native';
import { Service } from '@/types';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { formatDate, formatPrice } from '@/lib/utils';

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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Récapitulatif</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Prestataire</Text>
        <Text style={styles.sectionValue}>{providerName}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Service</Text>
        <Text style={styles.sectionValue}>{service.name}</Text>
        {service.duration_minutes != null && (
          <View style={styles.row}>
            <Clock size={14} color={Colors.text.tertiary} />
            <Text style={styles.meta}>{service.duration_minutes} min</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Date et heure</Text>
        <View style={styles.row}>
          <Calendar size={16} color={Colors.text.secondary} />
          <Text style={styles.sectionValue}>{formatDate(date)}</Text>
        </View>
        {time && (
          <View style={styles.row}>
            <Clock size={16} color={Colors.text.secondary} />
            <Text style={styles.sectionValue}>{time.slice(0, 5)}</Text>
          </View>
        )}
      </View>

      {eventTitle && (
        <>
          <View style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Événement lié</Text>
            <Text style={styles.sectionValue}>{eventTitle}</Text>
          </View>
        </>
      )}

      {notes && (
        <>
          <View style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <View style={styles.row}>
              <FileText size={16} color={Colors.text.secondary} />
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          </View>
        </>
      )}

      <View style={styles.divider} />

      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalPrice}>{formatPrice(service.price)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Layout.spacing.lg,
  },
  section: {
    gap: Layout.spacing.xs,
  },
  sectionLabel: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionValue: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  meta: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.tertiary,
  },
  notesText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[100],
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
    color: Colors.text.primary,
  },
  totalPrice: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
});
