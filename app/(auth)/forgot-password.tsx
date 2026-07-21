import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { Layout } from '@/constants/Layout';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';
import { toast } from '@/lib/toast';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'umade://reset-password',
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('Un lien de réinitialisation a été envoyé à votre adresse email.');
      goBackOrFallback(router);
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: isDark ? colors.backgroundTertiary : Colors.gray[100] }]}
              onPress={() => goBackOrFallback(router)}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Mot de passe oublié ?</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              leftIcon={<Mail size={20} color={colors.textTertiary} />}
              editable={!emailSent}
            />

            <Button
              title="Envoyer le lien"
              onPress={handleResetPassword}
              loading={isLoading}
              size="lg"
              fullWidth
              style={styles.submitButton}
              disabled={emailSent}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Vous vous souvenez ?</Text>
            <TouchableOpacity onPress={() => goBackOrFallback(router)}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.spacing.lg,
  },
  header: {
    paddingVertical: Layout.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: Layout.fontSize['3xl'],
    fontWeight: '700',
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  submitButton: {
    marginTop: Layout.spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.lg,
    gap: Layout.spacing.xs,
  },
  footerText: {
    fontSize: Layout.fontSize.sm,
  },
  footerLink: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
});
