import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Wallet } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import {
  useBookingFinance,
  useBookingPayments,
  useUpsertBookingContract,
  useUpdateBookingFinanceSettings,
} from '@/hooks/useBookingAdvanced';
import { useBooking } from '@/hooks/useBookings';
import { generateDefaultContractBody } from '@/lib/bookingContractTemplate';
import { useColors } from '@/hooks/useColors';
import { goBackOrFallback } from '@/lib/navigation';
import { formatDate, formatPrice } from '@/lib/utils';

type DateFieldKey = 'deposit' | 'balance';

function parseAmountInput(value: string): number {
  const sanitized = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(sanitized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmountInput(value: number | null | undefined): string {
  if (!value || value <= 0) return '';
  return String(Math.round(value * 100) / 100);
}

function normalizeDateInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

function parseIsoDateToDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTodayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDateTimeLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BookingQuoteScreen() {
  const router = useRouter();
  const colors = useColors();
  const { profile } = useAuth();
  const isProvider = profile?.role === 'provider';
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: booking, isLoading: isLoadingBooking, refetch: refetchBooking } = useBooking(id);
  const { data: finance, isLoading: isLoadingFinance, refetch: refetchFinance } = useBookingFinance(id);
  const { data: payments = [] } = useBookingPayments(id);

  const { mutateAsync: updateFinanceSettingsAsync, isPending: isSavingFinance } =
    useUpdateBookingFinanceSettings();
  const { mutateAsync: upsertContractAsync, isPending: isSavingContract } =
    useUpsertBookingContract();

  const [quoteInput, setQuoteInput] = useState('');
  const [depositInput, setDepositInput] = useState('');
  const [depositDueDateInput, setDepositDueDateInput] = useState('');
  const [balanceDueDateInput, setBalanceDueDateInput] = useState('');
  const [autoConfirmOnDeposit, setAutoConfirmOnDeposit] = useState(true);
  const [activeDateField, setActiveDateField] = useState<DateFieldKey | null>(null);
  const [pickerDateDraft, setPickerDateDraft] = useState<Date>(new Date());

  const minimumSelectableDate = useMemo(() => getTodayStart(), []);
  const isSavingQuote = isSavingFinance || isSavingContract;

  const hasConfiguredQuote = useMemo(() => {
    if (!finance) return false;
    return Boolean(
      (finance.quote_amount || 0) > 0 ||
        (finance.deposit_amount || 0) > 0 ||
        finance.deposit_due_date ||
        finance.balance_due_date
    );
  }, [finance]);

  const displayedQuote = useMemo(() => {
    if (finance && finance.quote_amount > 0) {
      return finance.quote_amount;
    }
    return booking?.total_price || 0;
  }, [finance, booking?.total_price]);

  const remainingAmount = useMemo(() => {
    if (!finance) return 0;
    return Math.max(displayedQuote - (finance.deposit_paid_amount || 0) - (finance.balance_paid_amount || 0), 0);
  }, [displayedQuote, finance]);

  const isQuoteLocked = useMemo(() => {
    const status = booking?.status;
    return status === 'confirmed' || status === 'completed' || status === 'cancelled';
  }, [booking?.status]);

  const canEditQuote = isProvider && !isQuoteLocked;

  useEffect(() => {
    if (!finance) return;

    setQuoteInput(formatAmountInput(finance.quote_amount || finance.total_price));
    setDepositInput(formatAmountInput(finance.deposit_amount));
    setDepositDueDateInput(finance.deposit_due_date || '');
    setBalanceDueDateInput(finance.balance_due_date || '');
    setAutoConfirmOnDeposit(finance.auto_confirm_on_deposit);
  }, [finance]);

  const applyPickedDate = (field: DateFieldKey, date: Date) => {
    const formatted = formatDateToIso(date);
    if (field === 'deposit') {
      setDepositDueDateInput(formatted);
      return;
    }
    setBalanceDueDateInput(formatted);
  };

  const openDatePicker = (field: DateFieldKey, currentValue: string) => {
    const parsed = parseIsoDateToDate(currentValue);
    const safeDate = parsed && parsed >= minimumSelectableDate ? parsed : minimumSelectableDate;
    setPickerDateDraft(safeDate);
    setActiveDateField(field);
  };

  const handleAndroidDateChange = (_event: any, selectedDate?: Date) => {
    if (!activeDateField) return;
    if (selectedDate) {
      applyPickedDate(activeDateField, selectedDate);
    }
    setActiveDateField(null);
  };

  const handleIosDateChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setPickerDateDraft(selectedDate);
    }
  };

  const confirmIosDate = () => {
    if (!activeDateField) return;
    applyPickedDate(activeDateField, pickerDateDraft);
    setActiveDateField(null);
  };

  const activeDateFieldLabel = useMemo(() => {
    if (activeDateField === 'deposit') return "Échéance d'acompte";
    if (activeDateField === 'balance') return 'Échéance du solde';
    return '';
  }, [activeDateField]);

  const getValidatedQuoteValues = () => {
    const quoteAmount = parseAmountInput(quoteInput);
    const depositAmount = parseAmountInput(depositInput);
    const depositDueDate = normalizeDateInput(depositDueDateInput);
    const balanceDueDate = normalizeDateInput(balanceDueDateInput);

    if (quoteAmount <= 0) {
      Alert.alert('Montant invalide', 'Le devis doit être supérieur à 0.');
      return null;
    }

    if (depositAmount < 0 || depositAmount > quoteAmount) {
      Alert.alert('Acompte invalide', "L'acompte doit être entre 0 et le montant du devis.");
      return null;
    }

    if (depositDueDateInput.trim() && !depositDueDate) {
      Alert.alert('Date invalide', 'Utilise le format AAAA-MM-JJ pour la date acompte.');
      return null;
    }

    if (balanceDueDateInput.trim() && !balanceDueDate) {
      Alert.alert('Date invalide', 'Utilise le format AAAA-MM-JJ pour la date solde.');
      return null;
    }

    if (depositDueDate) {
      const parsed = parseIsoDateToDate(depositDueDate);
      if (!parsed || parsed < minimumSelectableDate) {
        Alert.alert('Date invalide', "L'échéance acompte ne peut pas être dans le passé.");
        return null;
      }
    }

    if (balanceDueDate) {
      const parsed = parseIsoDateToDate(balanceDueDate);
      if (!parsed || parsed < minimumSelectableDate) {
        Alert.alert('Date invalide', "L'échéance solde ne peut pas être dans le passé.");
        return null;
      }
    }

    return {
      quoteAmount,
      depositAmount,
      depositDueDate,
      balanceDueDate,
    };
  };

  const saveQuoteDraft = async (values: {
    quoteAmount: number;
    depositAmount: number;
    depositDueDate: string | null;
    balanceDueDate: string | null;
  }) => {
    if (!id) return;
    await updateFinanceSettingsAsync({
      bookingId: id,
      updates: {
        quote_amount: values.quoteAmount,
        total_price: values.quoteAmount,
        deposit_amount: values.depositAmount,
        deposit_due_date: values.depositDueDate,
        balance_due_date: values.balanceDueDate,
        auto_confirm_on_deposit: autoConfirmOnDeposit,
        contract_required: true,
      },
    });
    await Promise.all([refetchFinance(), refetchBooking()]);
  };

  const handleSaveQuote = () => {
    if (!id || !isProvider) return;
    if (isQuoteLocked) {
      Alert.alert(
        'Devis verrouillé',
        'La réservation est déjà confirmée. Le devis ne peut plus être modifié.'
      );
      return;
    }

    const validated = getValidatedQuoteValues();
    if (!validated) return;

    (async () => {
      try {
        await saveQuoteDraft(validated);
        Alert.alert('Devis enregistré', 'Le devis a bien été enregistré en brouillon.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Impossible d’enregistrer le devis.';
        Alert.alert('Erreur', message);
      }
    })();
  };

  const handleConfirmQuote = () => {
    if (!id || !isProvider || !booking || !finance) return;
    if (isQuoteLocked) {
      Alert.alert(
        'Devis verrouillé',
        'La réservation est déjà confirmée. Le devis ne peut plus être modifié.'
      );
      return;
    }

    const validated = getValidatedQuoteValues();
    if (!validated) return;

    Alert.alert(
      'Confirmer le devis',
      'As-tu bien terminé le devis ? Après confirmation, le contrat est généré et les signatures des 2 parties sont requises avant paiement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, confirmer',
          onPress: () => {
            (async () => {
              try {
                await saveQuoteDraft(validated);

                const financeSnapshot = {
                  ...finance,
                  quote_amount: validated.quoteAmount,
                  total_price: validated.quoteAmount,
                  deposit_amount: validated.depositAmount,
                  deposit_due_date: validated.depositDueDate,
                  balance_due_date: validated.balanceDueDate,
                };
                await upsertContractAsync({
                  bookingId: id,
                  title: 'Contrat de prestation',
                  body: generateDefaultContractBody(booking, financeSnapshot),
                });

                Alert.alert(
                  'Devis confirmé',
                  'Contrat prêt. Les signatures des 2 parties sont nécessaires avant tout paiement.',
                  [
                    {
                      text: 'Voir le contrat',
                      onPress: () => router.push(`/booking/${id}/contract-sign`),
                    },
                    { text: 'OK' },
                  ]
                );
              } catch (error) {
                const message = error instanceof Error ? error.message : 'Impossible de confirmer le devis.';
                Alert.alert('Erreur', message);
              }
            })();
          },
        },
      ]
    );
  };

  if (isLoadingBooking || isLoadingFinance) {
    return <LoadingSpinner fullScreen message="Chargement du devis..." />;
  }

  if (!booking || !finance) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Réservation non trouvée</Text>
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
          headerTitle: hasConfiguredQuote ? 'Modifier le devis' : 'Faire un devis',
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
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionTitleRow}>
              <Wallet size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Résumé devis</Text>
            </View>

            <View style={styles.providerRow}>
              <Avatar
                source={(booking as any).providers?.profiles?.avatar_url ?? undefined}
                name={(booking as any).providers?.business_name || '?'}
                size="md"
              />
              <View style={styles.providerInfo}>
                <Text style={[styles.providerName, { color: colors.text }]}>
                  {(booking as any).services?.name || 'Prestation'}
                </Text>
                <Text style={[styles.providerMeta, { color: colors.textSecondary }]}>
                  {formatDate(booking.booking_date)} · {(booking as any).providers?.business_name || 'Prestataire'}
                </Text>
              </View>
            </View>

            <View style={styles.financeRow}>
              <Text style={[styles.financeLabel, { color: colors.textSecondary }]}>Devis actuel</Text>
              <Text style={[styles.financeValueStrong, { color: colors.primary }]}>{formatPrice(displayedQuote)}</Text>
            </View>
            <View style={styles.financeRow}>
              <Text style={[styles.financeLabel, { color: colors.textSecondary }]}>Acompte payé</Text>
              <Text style={[styles.financeValue, { color: colors.text }]}>{formatPrice(finance.deposit_paid_amount || 0)}</Text>
            </View>
            <View style={styles.financeRow}>
              <Text style={[styles.financeLabel, { color: colors.textSecondary }]}>Solde payé</Text>
              <Text style={[styles.financeValue, { color: colors.text }]}>{formatPrice(finance.balance_paid_amount || 0)}</Text>
            </View>
            <View style={styles.financeRow}>
              <Text style={[styles.financeLabel, { color: colors.textSecondary }]}>Restant à encaisser</Text>
              <Text style={[styles.financeValue, { color: colors.text }]}>{formatPrice(remainingAmount)}</Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Paramètres du devis</Text>

            {!isProvider && (
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Seul le prestataire peut modifier le devis.
              </Text>
            )}
            {isProvider && isQuoteLocked && (
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Réservation confirmée: le devis est maintenant verrouillé.
              </Text>
            )}

            <Input
              label="Devis (€)"
              value={quoteInput}
              onChangeText={setQuoteInput}
              keyboardType="decimal-pad"
              placeholder="2500"
              editable={canEditQuote}
            />
            <Input
              label="Acompte (€)"
              value={depositInput}
              onChangeText={setDepositInput}
              keyboardType="decimal-pad"
              placeholder="750"
              editable={canEditQuote}
            />

            <View style={styles.dateFieldContainer}>
              <Text style={[styles.dateFieldLabel, { color: colors.text }]}>Échéance acompte</Text>
              <Pressable
                onPress={() => canEditQuote && openDatePicker('deposit', depositDueDateInput)}
                disabled={!canEditQuote}
                style={[
                  styles.dateFieldPressable,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    opacity: canEditQuote ? 1 : 0.7,
                  },
                ]}
              >
                <Calendar size={16} color={colors.primary} />
                <Text
                  style={[
                    styles.dateFieldValue,
                    { color: depositDueDateInput ? colors.text : colors.textTertiary },
                  ]}
                >
                  {depositDueDateInput ? formatDate(depositDueDateInput) : 'Choisir une date'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.dateFieldContainer}>
              <Text style={[styles.dateFieldLabel, { color: colors.text }]}>Échéance solde</Text>
              <Pressable
                onPress={() => canEditQuote && openDatePicker('balance', balanceDueDateInput)}
                disabled={!canEditQuote}
                style={[
                  styles.dateFieldPressable,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    opacity: canEditQuote ? 1 : 0.7,
                  },
                ]}
              >
                <Calendar size={16} color={colors.primary} />
                <Text
                  style={[
                    styles.dateFieldValue,
                    { color: balanceDueDateInput ? colors.text : colors.textTertiary },
                  ]}
                >
                  {balanceDueDateInput ? formatDate(balanceDueDateInput) : 'Choisir une date'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Auto-confirmer après acompte</Text>
              <Switch
                value={autoConfirmOnDeposit}
                onValueChange={setAutoConfirmOnDeposit}
                disabled={!canEditQuote}
                trackColor={{ false: colors.border, true: `${colors.primary}66` }}
                thumbColor={autoConfirmOnDeposit ? colors.primary : colors.textTertiary}
              />
            </View>

            {isProvider && (
              <View style={styles.duoButtonsRow}>
                <Button
                  title="Enregistrer brouillon"
                  onPress={handleSaveQuote}
                  loading={isSavingQuote}
                  disabled={isSavingQuote || isQuoteLocked}
                  variant="outline"
                  style={styles.halfButton}
                />
                <Button
                  title="Confirmer le devis"
                  onPress={handleConfirmQuote}
                  loading={isSavingQuote}
                  disabled={isSavingQuote || isQuoteLocked}
                  style={styles.halfButton}
                />
              </View>
            )}
          </View>

          {payments.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Historique des paiements</Text>
              {payments.slice(0, 8).map((payment) => (
                <View key={payment.id} style={styles.paymentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.paymentTitle, { color: colors.text }]}> 
                      {payment.payment_type} · {payment.status}
                    </Text>
                    <Text style={[styles.paymentMeta, { color: colors.textSecondary }]}> 
                      {payment.paid_at
                        ? `Payé le ${formatDateTimeLabel(payment.paid_at)}`
                        : payment.due_date
                          ? `Échéance ${formatDate(payment.due_date)}`
                          : 'Sans échéance'}
                    </Text>
                  </View>
                  <Text style={[styles.paymentAmount, { color: colors.primary }]}>{formatPrice(payment.amount)}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {Platform.OS === 'android' && activeDateField && (
        <DateTimePicker
          value={pickerDateDraft}
          mode="date"
          display="default"
          onChange={handleAndroidDateChange}
          minimumDate={minimumSelectableDate}
          locale="fr-FR"
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={!!activeDateField}
          transparent
          animationType="slide"
          onRequestClose={() => setActiveDateField(null)}
        >
          <View style={styles.datePickerModalOverlay}>
            <View style={[styles.datePickerModalCard, { backgroundColor: colors.card }]}> 
              <Text style={[styles.datePickerModalTitle, { color: colors.text }]}>
                {activeDateFieldLabel || 'Choisir une date'}
              </Text>

              <DateTimePicker
                value={pickerDateDraft}
                mode="date"
                display="spinner"
                onChange={handleIosDateChange}
                minimumDate={minimumSelectableDate}
                locale="fr-FR"
              />

              <View style={styles.datePickerModalActions}>
                <Button
                  title="Annuler"
                  onPress={() => setActiveDateField(null)}
                  variant="outline"
                  style={styles.datePickerModalActionButton}
                />
                <Button title="Valider" onPress={confirmIosDate} style={styles.datePickerModalActionButton} />
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    gap: Layout.spacing.md,
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
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '700',
  },
  providerMeta: {
    fontSize: Layout.fontSize.sm,
  },
  financeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Layout.spacing.md,
  },
  financeLabel: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  financeValue: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  financeValueStrong: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '800',
  },
  dateFieldContainer: {
    marginBottom: Layout.spacing.md,
    gap: Layout.spacing.xs,
  },
  dateFieldLabel: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  dateFieldPressable: {
    minHeight: Layout.inputHeight,
    borderRadius: Layout.radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Layout.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  dateFieldValue: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Layout.spacing.md,
  },
  switchLabel: {
    flex: 1,
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  duoButtonsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
  infoText: {
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
  },
  paymentTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  paymentMeta: {
    fontSize: Layout.fontSize.xs,
  },
  paymentAmount: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  datePickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  datePickerModalCard: {
    borderTopLeftRadius: Layout.radius.xl,
    borderTopRightRadius: Layout.radius.xl,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  datePickerModalTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '700',
    textAlign: 'center',
  },
  datePickerModalActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  datePickerModalActionButton: {
    flex: 1,
  },
});
