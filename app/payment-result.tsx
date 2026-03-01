import { Button } from '@/components/ui/Button';
import { Layout } from '@/constants/Layout';
import { useBooking } from '@/hooks/useBookings';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PaymentStatus = 'success' | 'cancelled';
type PaymentType = 'deposit' | 'balance' | 'unknown';

function getFirstParam(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function normalizePaymentStatus(value: string | null): PaymentStatus {
  return value === 'cancelled' ? 'cancelled' : 'success';
}

function normalizePaymentType(value: string | null): PaymentType {
  if (value === 'deposit' || value === 'balance') return value;
  return 'unknown';
}

function buildDefaultAppReturnUrl(params: {
  bookingId: string | null;
  payment: PaymentStatus;
  type: PaymentType;
}): string {
  const query: string[] = [`payment=${encodeURIComponent(params.payment)}`];
  if (params.bookingId) query.push(`booking_id=${encodeURIComponent(params.bookingId)}`);
  if (params.type !== 'unknown') query.push(`type=${encodeURIComponent(params.type)}`);
  return `umade://payment-result?${query.join('&')}`;
}

function isAllowedAppReturnUrl(url: string | null): boolean {
  if (!url) return false;
  return /^(umade|exp|exps):\/\//i.test(url);
}

export default function PaymentResultScreen() {
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    booking_id?: string;
    payment?: string;
    type?: string;
    app_return?: string;
  }>();

  const bookingId = getFirstParam(params.booking_id);
  const payment = normalizePaymentStatus(getFirstParam(params.payment));
  const paymentType = normalizePaymentType(getFirstParam(params.type));
  const incomingAppReturn = getFirstParam(params.app_return);
  const { data: booking } = useBooking(bookingId || undefined);
  const [showSuccessDetails, setShowSuccessDetails] = useState(payment !== 'success');

  const appReturnUrl = useMemo(() => {
    if (isAllowedAppReturnUrl(incomingAppReturn)) {
      return incomingAppReturn as string;
    }
    return buildDefaultAppReturnUrl({
      bookingId,
      payment,
      type: paymentType,
    });
  }, [incomingAppReturn, bookingId, payment, paymentType]);

  const isSuccess = payment === 'success';
  const providerName = booking?.providers?.business_name || booking?.providers?.profiles?.full_name || null;

  const title = isSuccess
    ? showSuccessDetails
      ? 'Paiement confirmé'
      : 'Validation du paiement...'
    : 'Paiement annulé';
  const message = isSuccess
    ? showSuccessDetails
      ? providerName
        ? `Merci, votre paiement a bien été transmis à ${providerName}.`
        : 'Merci, votre paiement a bien été pris en compte.'
      : 'Confirmation en cours. Vous allez être redirigé automatiquement.'
    : 'Le paiement n’a pas été finalisé. Vous pouvez réessayer quand vous voulez.';

  useEffect(() => {
    if (!isSuccess) return;
    setShowSuccessDetails(false);
    const timer = setTimeout(() => {
      setShowSuccessDetails(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [isSuccess, bookingId]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      WebBrowser.dismissBrowser();
      return;
    }

    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.assign(appReturnUrl);
      }
    }, 1400);

    return () => clearTimeout(timer);
  }, [appReturnUrl]);

  const handleOpenApp = () => {
    Linking.openURL(appReturnUrl);
  };

  const handleGoToBooking = () => {
    if (!bookingId) {
      router.replace('/(tabs)/events');
      return;
    }
    router.replace(`/booking/${bookingId}/details`);
  };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.webContent}>
          <View
            style={[
              styles.webIconWrap,
              {
                backgroundColor: isSuccess
                  ? isDark
                    ? '#064E3B44'
                    : '#ECFDF5'
                  : isDark
                    ? '#7F1D1D44'
                    : '#FEF2F2',
              },
            ]}
          >
            {isSuccess ? (
              <LoaderCircle size={28} color={colors.primary} />
            ) : (
              <XCircle size={28} color={colors.error} />
            )}
          </View>
          <Text style={[styles.webTitle, { color: colors.text }]}>
            {isSuccess ? 'Validation du paiement...' : 'Paiement annulé'}
          </Text>
          <Text style={[styles.webSubtitle, { color: colors.textSecondary }]}>
            {isSuccess
              ? "Redirection vers l'application Umade en cours."
              : "Retour vers l'application Umade."}
          </Text>
          <View style={styles.webLoaderRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.webLoaderText, { color: colors.textSecondary }]}>
              Chargement...
            </Text>
          </View>
          <Button title="Ouvrir l'application" onPress={handleOpenApp} fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.nativeContent}>
        <View
          style={[
            styles.nativeIconWrap,
            {
              backgroundColor: isSuccess
                ? isDark
                  ? '#064E3B44'
                  : '#ECFDF5'
                : isDark
                  ? '#7F1D1D44'
                  : '#FEF2F2',
            },
          ]}
        >
          {isSuccess ? (
            showSuccessDetails ? (
            <CheckCircle2 size={38} color="#10B981" />
            ) : (
              <LoaderCircle size={38} color={colors.primary} />
            )
          ) : (
            <XCircle size={38} color={colors.error} />
          )}
        </View>

        <Text style={[styles.nativeTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.nativeMessage, { color: colors.textSecondary }]}>{message}</Text>

        <View style={styles.actions}>
          <Button
            title={isSuccess ? 'Voir ma réservation' : 'Retour à la réservation'}
            onPress={handleGoToBooking}
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webContent: {
    flex: 1,
    paddingHorizontal: Layout.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  webIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  webSubtitle: {
    fontSize: Layout.fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  webLoaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    marginBottom: Layout.spacing.sm,
  },
  webLoaderText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  nativeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
    gap: Layout.spacing.lg,
  },
  nativeIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeTitle: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    textAlign: 'center',
  },
  nativeMessage: {
    fontSize: Layout.fontSize.md,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    marginTop: Layout.spacing.md,
  },
});
