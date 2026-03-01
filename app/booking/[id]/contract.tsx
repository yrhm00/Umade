import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useBookingContract } from '@/hooks/useBookingAdvanced';
import { useBooking } from '@/hooks/useBookings';
import { useColors } from '@/hooks/useColors';
import { goBackOrFallback } from '@/lib/navigation';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FileLock2, FileText } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookingContractLockedScreen() {
  const router = useRouter();
  const colors = useColors();
  const { profile } = useAuth();
  const isProvider = profile?.role === 'provider';
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: booking, isLoading: isLoadingBooking } = useBooking(id);
  const { data: contract, isLoading: isLoadingContract } = useBookingContract(id);

  if (isLoadingBooking || isLoadingContract) {
    return <LoadingSpinner fullScreen message="Chargement du contrat..." />;
  }

  if (!booking) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.message, { color: colors.textSecondary }]}>Réservation non trouvée</Text>
          <Button title="Retour" onPress={() => goBackOrFallback(router)} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Contrat',
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.backgroundSecondary },
        }}
      />

      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <FileLock2 size={52} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Contrat verrouillé</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Le contrat est basé sur un modèle unique Umade. Il n’est pas modifiable manuellement:
            seules les informations de réservation et de devis sont injectées automatiquement.
          </Text>

          {contract ? (
            <Button
              title="Voir et signer le contrat"
              onPress={() => router.replace(`/booking/${id}/contract-sign`)}
              fullWidth
              icon={<FileText size={16} color="#FFFFFF" />}
            />
          ) : isProvider ? (
            <Button
              title="Finaliser le devis"
              onPress={() => router.replace(`/booking/${id}/quote`)}
              fullWidth
            />
          ) : (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Le prestataire doit d’abord confirmer le devis.
            </Text>
          )}

          <Button title="Retour" onPress={() => goBackOrFallback(router)} variant="outline" fullWidth />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
    gap: Layout.spacing.lg,
  },
  title: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: Layout.fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  hint: {
    fontSize: Layout.fontSize.sm,
    textAlign: 'center',
  },
});
