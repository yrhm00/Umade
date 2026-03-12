/**
 * Contract Viewer & Signature Screen
 * Accessible par les deux parties. Affiche le contrat, signatures, download PDF.
 */

import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import {
  useBookingContract,
  useBookingFinance,
  useMyBookingRole,
  useSignBookingContract,
} from '@/hooks/useBookingAdvanced';
import { useBooking } from '@/hooks/useBookings';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { generateContractHtml, shareContractPdf } from '@/lib/contractPdf';
import { goBackOrFallback } from '@/lib/navigation';
import { formatDate } from '@/lib/utils';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  ShieldCheck,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { toast } from '@/lib/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

function formatSignatureDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSignaturePlace(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : 'Non renseigné';
}

export default function ContractSignScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();

  const { data: booking, isLoading: isLoadingBooking } = useBooking(id);
  const { data: finance } = useBookingFinance(id);
  const { data: contract, isLoading: isLoadingContract } = useBookingContract(id);
  const { isClient, isProvider } = useMyBookingRole(finance);

  const { mutate: signContract, isPending: isSigning } = useSignBookingContract();

  const [isDownloading, setIsDownloading] = useState(false);

  const providerSigned = !!contract?.provider_signature_name && !!contract?.provider_signed_at;
  const clientSigned = !!contract?.client_signature_name && !!contract?.client_signed_at;
  const bothSigned = providerSigned && clientSigned;

  const currentUserNeedsSigning =
    (isProvider && !providerSigned) || (isClient && !clientSigned);
  const signerAccountName = profile?.full_name?.trim() || profile?.email || 'Compte vérifié';
  const contractPreviewHtml = useMemo(() => {
    if (!contract || !booking) return '';
    return generateContractHtml(contract, booking, finance || null, { preview: true });
  }, [contract, booking, finance]);

  const handleSign = () => {
    if (!id) {
      return;
    }

    if (!isProvider && !isClient) {
      toast.error('Vous devez être participant à cette réservation pour signer.');
      return;
    }

    Alert.alert(
      'Confirmer la signature',
      `Vous allez signer électroniquement ce contrat avec le compte "${signerAccountName}". Le nom, la date, l'heure et le lieu seront enregistrés automatiquement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Signer',
          onPress: () => {
            signContract(
              { bookingId: id },
              {
                onSuccess: () => {
                  toast.success('Votre signature électronique a été enregistrée.');
                },
                onError: (error) => toast.error(error.message),
              }
            );
          },
        },
      ]
    );
  };

  const handleDownloadPdf = async () => {
    if (!contract || !booking) return;
    if (!finance) {
      toast.warning('Le devis n\'est pas encore disponible pour cette reservation.');
      return;
    }
    setIsDownloading(true);
    try {
      await shareContractPdf(contract, booking, finance);
    } catch {
      toast.error('Impossible de générer le PDF. Réessayez.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoadingBooking || isLoadingContract) {
    return <LoadingSpinner fullScreen message="Chargement du contrat..." />;
  }

  if (!booking) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Réservation non trouvée
          </Text>
          <Button title="Retour" onPress={() => goBackOrFallback(router)} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  if (!contract) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Contrat',
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.backgroundSecondary },
          }}
        />
        <View style={styles.errorContainer}>
          <FileText size={48} color={colors.textTertiary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Aucun contrat n'a été créé pour cette réservation.
          </Text>
          {isProvider && (
            <Button
              title="Finaliser le devis"
              onPress={() => router.replace(`/booking/${id}/quote`)}
            />
          )}
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
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Signed banner */}
          {bothSigned && (
            <View style={[styles.signedBanner, { backgroundColor: '#ECFDF5' }]}>
              <ShieldCheck size={20} color="#059669" />
              <Text style={styles.signedBannerText}>
                Contrat signé par les deux parties ✓
              </Text>
            </View>
          )}

          {/* Contract header */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionTitleRow}>
              <FileText size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{contract.title}</Text>
            </View>

            <View style={styles.metaRow}>
              <View style={[styles.versionBadge, { backgroundColor: isDark ? colors.backgroundTertiary : '#EDE9FE' }]}>
                <Text style={[styles.versionBadgeText, { color: colors.primary }]}>
                  v{contract.version}
                </Text>
              </View>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                Mis à jour le {formatDate(contract.updated_at)}
              </Text>
            </View>
          </View>

          {/* Contract preview (same rendering as PDF) */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Aperçu du contrat (format PDF)</Text>
            <View style={[styles.previewFrame, { borderColor: colors.border }]}>
              <WebView
                originWhitelist={['*']}
                source={{ html: contractPreviewHtml }}
                style={styles.previewWebView}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                bounces={false}
                setSupportMultipleWindows={false}
              />
            </View>
          </View>

          {/* Signatures section */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Signatures</Text>

            {/* Provider signature */}
            <View
              style={[
                styles.signatureBlock,
                {
                  backgroundColor: providerSigned
                    ? isDark ? '#064E3B' : '#ECFDF5'
                    : isDark ? '#78350F33' : '#FFFBEB',
                  borderColor: providerSigned ? '#059669' : '#F59E0B',
                },
              ]}
            >
              <View style={styles.signatureHeader}>
                {providerSigned ? (
                  <CheckCircle2 size={18} color="#059669" />
                ) : (
                  <Clock size={18} color="#F59E0B" />
                )}
                <Text
                  style={[
                    styles.signatureRole,
                    { color: providerSigned ? '#059669' : '#F59E0B' },
                  ]}
                >
                  Prestataire
                </Text>
              </View>
              {providerSigned ? (
                <View style={styles.signatureDetails}>
                  <Text style={[styles.signatureName, { color: colors.text }]}>
                    {contract.provider_signature_name}
                  </Text>
                  <Text style={[styles.signatureDate, { color: colors.textSecondary }]}>
                    Signé électroniquement le {formatSignatureDateTime(contract.provider_signed_at)}
                  </Text>
                  <Text style={[styles.signatureDate, { color: colors.textSecondary }]}>
                    Lieu: {formatSignaturePlace(contract.provider_signature_place)}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.signaturePending, { color: colors.textSecondary }]}>
                  Signature électronique en attente
                </Text>
              )}
            </View>

            {/* Client signature */}
            <View
              style={[
                styles.signatureBlock,
                {
                  backgroundColor: clientSigned
                    ? isDark ? '#064E3B' : '#ECFDF5'
                    : isDark ? '#78350F33' : '#FFFBEB',
                  borderColor: clientSigned ? '#059669' : '#F59E0B',
                },
              ]}
            >
              <View style={styles.signatureHeader}>
                {clientSigned ? (
                  <CheckCircle2 size={18} color="#059669" />
                ) : (
                  <Clock size={18} color="#F59E0B" />
                )}
                <Text
                  style={[
                    styles.signatureRole,
                    { color: clientSigned ? '#059669' : '#F59E0B' },
                  ]}
                >
                  Client
                </Text>
              </View>
              {clientSigned ? (
                <View style={styles.signatureDetails}>
                  <Text style={[styles.signatureName, { color: colors.text }]}>
                    {contract.client_signature_name}
                  </Text>
                  <Text style={[styles.signatureDate, { color: colors.textSecondary }]}>
                    Signé électroniquement le {formatSignatureDateTime(contract.client_signed_at)}
                  </Text>
                  <Text style={[styles.signatureDate, { color: colors.textSecondary }]}>
                    Lieu: {formatSignaturePlace(contract.client_signature_place)}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.signaturePending, { color: colors.textSecondary }]}>
                  Signature électronique en attente
                </Text>
              )}
            </View>

            {/* Electronic signature */}
            {currentUserNeedsSigning && (
              <View style={styles.signForm}>
                <Text style={[styles.signatureHintTitle, { color: colors.text }]}>
                  Signature électronique liée au compte
                </Text>
                <Text style={[styles.signatureHintText, { color: colors.textSecondary }]}>
                  Signataire: {signerAccountName}
                </Text>
                <Text style={[styles.signatureHintText, { color: colors.textSecondary }]}>
                  Le nom, la date, l'heure et le lieu sont enregistrés automatiquement.
                </Text>
                <Button
                  title="Signer électroniquement"
                  onPress={handleSign}
                  loading={isSigning}
                  disabled={isSigning}
                  fullWidth
                />
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Button
              title="Télécharger le PDF (contrat + devis)"
              onPress={handleDownloadPdf}
              loading={isDownloading}
              disabled={isDownloading}
              variant="outline"
              fullWidth
              icon={<Download size={16} color={colors.primary} />}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
    gap: Layout.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
    gap: Layout.spacing.lg,
  },
  errorText: {
    fontSize: Layout.fontSize.lg,
    textAlign: 'center',
  },
  signedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    gap: Layout.spacing.sm,
  },
  signedBannerText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
    color: '#059669',
  },
  card: {
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: Layout.spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  metaText: {
    fontSize: Layout.fontSize.xs,
  },
  versionBadge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.radius.sm,
  },
  versionBadgeText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '700',
  },
  previewFrame: {
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    overflow: 'hidden',
  },
  previewWebView: {
    height: 640,
    backgroundColor: '#FFFFFF',
  },
  signatureBlock: {
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    borderWidth: 1,
    gap: Layout.spacing.xs,
  },
  signatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  signatureRole: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  signatureDetails: {
    marginLeft: Layout.spacing.lg + Layout.spacing.xs,
  },
  signatureName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  signatureDate: {
    fontSize: Layout.fontSize.xs,
    marginTop: 2,
  },
  signaturePending: {
    fontSize: Layout.fontSize.sm,
    fontStyle: 'italic',
    marginLeft: Layout.spacing.lg + Layout.spacing.xs,
  },
  signForm: {
    marginTop: Layout.spacing.sm,
    gap: Layout.spacing.md,
  },
  signatureHintTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  signatureHintText: {
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
  },
  actionsContainer: {
    gap: Layout.spacing.sm,
  },
});
