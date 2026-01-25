import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const router = useRouter();

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
      Alert.alert(
        'Email envoyé',
        'Un lien de réinitialisation a été envoyé à votre adresse email.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Erreur',
        err.message || 'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Mot de passe oublié ?</Text>
            <Text style={styles.subtitle}>
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
              leftIcon={<Mail size={20} color={Colors.gray[400]} />}
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
            <Text style={styles.footerText}>Vous vous souvenez ?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>Retour à la connexion</Text>
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
    backgroundColor: Colors.white,
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
    backgroundColor: Colors.gray[100],
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
    color: Colors.text.primary,
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.secondary,
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
    color: Colors.text.secondary,
  },
  footerLink: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary.DEFAULT,
    fontWeight: '600',
  },
});
