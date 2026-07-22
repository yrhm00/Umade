/**
 * Suppression de compte : l'app envoie seulement la demande.
 * La suppression réelle n'a lieu qu'après clic sur le lien reçu par email
 * (Edge Function confirm-account-deletion).
 */

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { supabase } from '@/lib/supabase';
import { goBackOrFallback } from '@/lib/navigation';
import { toast } from '@/lib/toast';
import { useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, MailCheck } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const LOSSES = [
  'Vos événements, réservations et devis',
  'Vos conversations et messages',
  'Vos photos, inspirations et favoris',
  'Vos avis publiés et votre historique',
];

export default function DeleteAccountScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const { profile, isProvider } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const sendRequest = async () => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-account-deletion', {
        body: {},
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      setSent(true);
      toast.success('Email de confirmation envoyé');
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Impossible d'envoyer la demande. Réessayez."
      );
    } finally {
      setIsSending(false);
    }
  };

  const confirmFirst = () => {
    Alert.alert(
      'Supprimer votre compte ?',
      'Nous vous enverrons un email de confirmation. La suppression sera définitive et irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Envoyer la demande', style: 'destructive', onPress: sendRequest },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: isDark ? colors.backgroundTertiary : Colors.gray[100] },
          ]}
          onPress={() => goBackOrFallback(router)}
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Supprimer mon compte</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {sent ? (
          <Animated.View entering={FadeInDown.duration(260)} style={styles.sentBox}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}18` }]}>
              <MailCheck size={34} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Vérifiez votre email</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Un lien de confirmation a été envoyé à{' '}
              <Text style={{ color: colors.text, fontWeight: '600' }}>{profile?.email}</Text>.
              Votre compte ne sera supprimé qu'après avoir cliqué dessus. Le lien expire dans
              1 heure.
            </Text>
            <Text style={[styles.hint, { color: colors.textTertiary }]}>
              Vous avez changé d'avis ? Ignorez simplement l'email — rien ne sera supprimé.
            </Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(260)}>
            <View
              style={[
                styles.warnBox,
                {
                  backgroundColor: isDark ? 'rgba(180,35,24,0.12)' : '#FEF3F2',
                  borderColor: isDark ? 'rgba(180,35,24,0.3)' : '#FECDCA',
                },
              ]}
            >
              <AlertTriangle size={20} color="#B42318" />
              <Text style={[styles.warnText, { color: isDark ? '#F5A9A2' : '#912018' }]}>
                Cette action est définitive. Vos données ne pourront pas être récupérées.
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Ce qui sera supprimé
            </Text>
            <View style={styles.list}>
              {LOSSES.map((item) => (
                <View key={item} style={styles.listRow}>
                  <View style={[styles.bullet, { backgroundColor: colors.textTertiary }]} />
                  <Text style={[styles.listText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}
              {isProvider && (
                <View style={styles.listRow}>
                  <View style={[styles.bullet, { backgroundColor: colors.textTertiary }]} />
                  <Text style={[styles.listText, { color: colors.textSecondary }]}>
                    Votre fiche prestataire, vos services et votre portfolio
                  </Text>
                </View>
              )}
            </View>

            <View
              style={[
                styles.infoBox,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Si vous avez des réservations en cours, nous vous conseillons de prévenir les
                personnes concernées avant de supprimer votre compte.
              </Text>
            </View>

            <Button
              title="Demander la suppression"
              onPress={confirmFirst}
              loading={isSending}
              size="lg"
              fullWidth
              style={styles.deleteBtn}
            />
            <Text style={[styles.hint, { color: colors.textTertiary }]}>
              Un email de confirmation vous sera envoyé. Rien n'est supprimé avant que vous
              cliquiez sur le lien.
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Layout.fontSize.lg, fontWeight: '700' },
  scroll: { padding: Layout.spacing.lg, paddingBottom: Layout.spacing.xxl },
  warnBox: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  warnText: { flex: 1, fontSize: Layout.fontSize.sm, lineHeight: 20, fontWeight: '500' },
  sectionTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '700',
    marginBottom: Layout.spacing.sm,
  },
  list: { gap: Layout.spacing.sm, marginBottom: Layout.spacing.lg },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Layout.spacing.sm },
  bullet: { width: 5, height: 5, borderRadius: 3, marginTop: 8 },
  listText: { flex: 1, fontSize: Layout.fontSize.sm, lineHeight: 21 },
  infoBox: {
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  infoText: { fontSize: Layout.fontSize.sm, lineHeight: 20 },
  deleteBtn: { backgroundColor: '#B42318' },
  hint: {
    fontSize: Layout.fontSize.xs,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: Layout.spacing.md,
  },
  sentBox: { alignItems: 'center', paddingTop: Layout.spacing.xl },
  iconWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.lg,
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    marginBottom: Layout.spacing.md,
    textAlign: 'center',
  },
  body: { fontSize: Layout.fontSize.md, lineHeight: 24, textAlign: 'center' },
});
