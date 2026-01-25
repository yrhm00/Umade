import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Dimensions,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Background avec gradient */}
      <LinearGradient
        colors={[Colors.primary[50], Colors.secondary.DEFAULT]}
        style={styles.gradient}
      />

      {/* Logo et illustration */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Umade</Text>
          <Text style={styles.tagline}>L'événementiel simplifié</Text>
        </View>
        
        {/* Placeholder pour l'illustration - à remplacer par une vraie image */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustrationPlaceholder}>
            <Text style={styles.illustrationEmoji}>🎉</Text>
          </View>
        </View>
      </View>

      {/* Contenu */}
      <SafeAreaView edges={['bottom']} style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Organisez vos événements avec les meilleurs prestataires
          </Text>
          <Text style={styles.subtitle}>
            Photographes, traiteurs, DJs... Trouvez et réservez les professionnels 
            qu'il vous faut en quelques clics.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Créer un compte"
            onPress={() => router.push('/auth/register')}
            size="lg"
            fullWidth
          />
          
          <Button
            title="J'ai déjà un compte"
            onPress={() => router.push('/auth/login')}
            variant="outline"
            size="lg"
            fullWidth
            style={styles.secondaryButton}
          />
        </View>

        <Text style={styles.terms}>
          En continuant, vous acceptez nos{' '}
          <Text style={styles.link}>Conditions d'utilisation</Text>
          {' '}et notre{' '}
          <Text style={styles.link}>Politique de confidentialité</Text>
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary.DEFAULT,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
  },
  header: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Layout.spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  tagline: {
    fontSize: Layout.fontSize.md,
    color: Colors.primary[400],
    marginTop: Layout.spacing.xs,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationPlaceholder: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  illustrationEmoji: {
    fontSize: 80,
  },
  content: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Layout.radius.xl,
    borderTopRightRadius: Layout.radius.xl,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  textContainer: {
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    gap: Layout.spacing.md,
  },
  secondaryButton: {
    marginTop: 0,
  },
  terms: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Layout.spacing.lg,
    lineHeight: 18,
  },
  link: {
    color: Colors.primary.DEFAULT,
    fontWeight: '500',
  },
});