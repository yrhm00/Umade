/**
 * Écran affiché après inscription quand la confirmation d'email est activée.
 * signUp() n'ouvre pas de session tant que l'utilisateur n'a pas cliqué le lien.
 */

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MailCheck } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const RESEND_COOLDOWN = 45;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0 || isSending) return;
    setIsSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: 'umade://auth-callback' },
      });
      if (error) throw error;
      toast.success('Email renvoyé. Pensez à vérifier vos spams.');
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de renvoyer l'email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: isDark ? colors.backgroundTertiary : Colors.gray[100] },
          ]}
          onPress={() => router.replace('/(auth)/login')}
          accessibilityLabel="Retour à la connexion"
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Animated.View entering={FadeInDown.duration(280)} style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}18` }]}>
          <MailCheck size={38} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Vérifiez votre email</Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Nous avons envoyé un lien de confirmation à{' '}
          <Text style={{ color: colors.text, fontWeight: '600' }}>{email ?? 'votre adresse'}</Text>.
          Cliquez dessus pour activer votre compte, puis revenez vous connecter.
        </Text>

        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          L'email n'arrive pas ? Vérifiez vos spams avant de le renvoyer.
        </Text>

        <View style={styles.actions}>
          <Button
            title={
              cooldown > 0 ? `Renvoyer l'email (${cooldown}s)` : "Renvoyer l'email"
            }
            onPress={handleResend}
            disabled={cooldown > 0 || !email}
            loading={isSending}
            variant="outline"
            size="lg"
            fullWidth
          />
          <Button
            title="J'ai confirmé, me connecter"
            onPress={() => router.replace('/(auth)/login')}
            size="lg"
            fullWidth
            style={styles.loginBtn}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Layout.spacing.lg, paddingVertical: Layout.spacing.md },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
  },
  iconWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.lg,
  },
  title: {
    fontSize: Layout.fontSize['3xl'],
    fontWeight: '700',
    marginBottom: Layout.spacing.md,
  },
  body: { fontSize: Layout.fontSize.md, lineHeight: 24 },
  hint: { fontSize: Layout.fontSize.sm, lineHeight: 20, marginTop: Layout.spacing.md },
  actions: { marginTop: Layout.spacing.xl, gap: Layout.spacing.sm },
  loginBtn: { marginTop: Layout.spacing.xs },
});
