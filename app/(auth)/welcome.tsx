import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PartyPopper } from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, {
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

function AnimatedCircles({ colors }: { colors: ReturnType<typeof useColors> }) {
  const outerScale = useSharedValue(1);
  const middleScale = useSharedValue(1);
  const innerScale = useSharedValue(1);

  useEffect(() => {
    outerScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
    middleScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(1.06, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
    innerScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(1.04, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }],
  }));
  const middleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: middleScale.value }],
  }));
  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));

  return (
    <View style={styles.illustrationContainer}>
      <Animated.View style={[styles.outerCircle, { backgroundColor: `${colors.primary}08` }, outerStyle]}>
        <Animated.View style={[styles.middleCircle, { backgroundColor: `${colors.primary}15` }, middleStyle]}>
          <Animated.View style={[styles.innerCircle, { backgroundColor: `${colors.primary}25` }, innerStyle]}>
            <PartyPopper size={48} color={colors.primary} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background avec gradient */}
      <LinearGradient
        colors={isDark ? [colors.backgroundSecondary, colors.background] : [Colors.primary[50], Colors.secondary.DEFAULT]}
        style={styles.gradient}
      />

      {/* Logo et illustration */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: colors.primary }]}>Umade</Text>
          <Text style={[styles.tagline, { color: colors.primaryLight }]}>L'événementiel simplifié</Text>
        </View>

        {/* Animated concentric circles illustration */}
        <AnimatedCircles colors={colors} />
      </View>

      {/* Contenu */}
      <Animated.View entering={FadeInUp.delay(300).duration(260)}>
        <SafeAreaView edges={['bottom']} style={[styles.content, { backgroundColor: colors.card }]}>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Organisez vos événements avec les meilleurs prestataires
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Photographes, traiteurs, DJs... Trouvez et réservez les professionnels
              qu'il vous faut en quelques clics.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Créer un compte"
              onPress={() => router.push('/(auth)/register')}
              size="lg"
              fullWidth
            />

            <Button
              title="J'ai déjà un compte"
              onPress={() => router.push('/(auth)/login')}
              variant="outline"
              size="lg"
              fullWidth
              style={styles.secondaryButton}
            />
          </View>

          <Text style={[styles.terms, { color: colors.textTertiary }]}>
            En continuant, vous acceptez nos{' '}
            <Text style={[styles.link, { color: colors.primary }]}>Conditions d'utilisation</Text>
            {' '}et notre{' '}
            <Text style={[styles.link, { color: colors.primary }]}>Politique de confidentialité</Text>
          </Text>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  tagline: {
    fontSize: Layout.fontSize.md,
    marginTop: Layout.spacing.xs,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleCircle: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    borderTopLeftRadius: Layout.radius.xl,
    borderTopRightRadius: Layout.radius.xl,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.md,
    shadowColor: '#000',
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
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
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
    textAlign: 'center',
    marginTop: Layout.spacing.lg,
    lineHeight: 18,
  },
  link: {
    fontWeight: '500',
  },
});
