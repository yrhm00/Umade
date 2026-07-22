import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { Layout } from '@/constants/Layout';
import { UserRole } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { ArrowLeft, Briefcase, Lock, Mail, User, Users } from 'lucide-react-native';
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

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  // Use individual selectors to prevent unnecessary re-renders
  const signUp = useAuthStore((state) => state.signUp);
  const isLoading = useAuthStore((state) => state.isLoading);
  const clearError = useAuthStore((state) => state.clearError);

  const [role, setRole] = useState<UserRole>('client');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Le nom est requis';
    }

    if (!email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email invalide';
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 8) {
      newErrors.password = 'Minimum 8 caractères';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    clearError();

    if (!validate()) return;

    try {
      const { needsEmailConfirmation } = await signUp(email, password, role, fullName);

      if (needsEmailConfirmation) {
        // Aucune session tant que le lien n'est pas cliqué : on explique l'étape.
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email },
        } as any);
        return;
      }
      // Sinon la redirection est gérée par les layouts -> onboarding
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue. Veuillez réessayer.');
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
            <Text style={[styles.title, { color: colors.text }]}>Créer un compte</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Rejoignez Umade et simplifiez vos événements
            </Text>
          </View>

          {/* Role Selector */}
          <View style={styles.roleContainer}>
            <Text style={[styles.roleLabel, { color: colors.text }]}>Je suis...</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  { backgroundColor: isDark ? colors.card : Colors.white, borderColor: isDark ? colors.cardBorder : Colors.primary[100] },
                  role === 'client' && styles.roleButtonActive,
                ]}
                onPress={() => setRole('client')}
              >
                <Users
                  size={24}
                  color={role === 'client' ? Colors.white : Colors.primary.DEFAULT}
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    role === 'client' && styles.roleButtonTextActive,
                  ]}
                >
                  Client
                </Text>
                <Text
                  style={[
                    styles.roleButtonSubtext,
                    { color: colors.textSecondary },
                    role === 'client' && styles.roleButtonSubtextActive,
                  ]}
                >
                  Je cherche des prestataires
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  { backgroundColor: isDark ? colors.card : Colors.white, borderColor: isDark ? colors.cardBorder : Colors.primary[100] },
                  role === 'provider' && styles.roleButtonActive,
                ]}
                onPress={() => setRole('provider')}
              >
                <Briefcase
                  size={24}
                  color={role === 'provider' ? Colors.white : Colors.primary.DEFAULT}
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    role === 'provider' && styles.roleButtonTextActive,
                  ]}
                >
                  Prestataire
                </Text>
                <Text
                  style={[
                    styles.roleButtonSubtext,
                    { color: colors.textSecondary },
                    role === 'provider' && styles.roleButtonSubtextActive,
                  ]}
                >
                  Je propose mes services
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Nom complet"
              placeholder="Jean Dupont"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoComplete="name"
              error={errors.fullName}
              leftIcon={<User size={20} color={colors.textTertiary} />}
            />

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
            />

            <Input
              label="Mot de passe"
              placeholder="Minimum 8 caractères"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              error={errors.password}
              leftIcon={<Lock size={20} color={colors.textTertiary} />}
            />

            <Input
              label="Confirmer le mot de passe"
              placeholder="Répétez votre mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
              error={errors.confirmPassword}
              leftIcon={<Lock size={20} color={colors.textTertiary} />}
            />

            <Button
              title="Créer mon compte"
              onPress={handleRegister}
              loading={isLoading}
              size="lg"
              fullWidth
              style={styles.submitButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Déjà un compte ?</Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Se connecter</Text>
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
    marginBottom: Layout.spacing.lg,
  },
  title: {
    fontSize: Layout.fontSize['3xl'],
    fontWeight: '700',
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
  },
  roleContainer: {
    marginBottom: Layout.spacing.lg,
  },
  roleLabel: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    marginBottom: Layout.spacing.sm,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  roleButton: {
    flex: 1,
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    borderWidth: 2,
    borderColor: Colors.primary[100],
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: Colors.primary.DEFAULT,
    backgroundColor: Colors.primary.DEFAULT,
  },
  roleButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
    marginTop: Layout.spacing.sm,
  },
  roleButtonTextActive: {
    color: Colors.white,
  },
  roleButtonSubtext: {
    fontSize: Layout.fontSize.xs,
    marginTop: Layout.spacing.xs,
    textAlign: 'center',
  },
  roleButtonSubtextActive: {
    color: Colors.primary[100],
  },
  form: {
    flex: 1,
  },
  submitButton: {
    marginTop: Layout.spacing.lg,
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
    color: Colors.primary.DEFAULT,
    fontWeight: '600',
  },
});
