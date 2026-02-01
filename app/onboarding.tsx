/**
 * Onboarding Screen
 * Dark Mode Support
 */

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import {
  useSharedValue
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  emoji: string;
  title: string;
  description: string;
  backgroundColorLight: string;
  backgroundColorDark: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    emoji: '🔍',
    title: 'Trouvez les meilleurs prestataires',
    description:
      'Parcourez notre catalogue de professionnels de l\'événementiel triés sur le volet.',
    backgroundColorLight: Colors.primary[50],
    backgroundColorDark: '#1A1A2E',
  },
  {
    id: '2',
    emoji: '📅',
    title: 'Réservez en quelques clics',
    description:
      'Consultez les disponibilités et réservez directement le prestataire de votre choix.',
    backgroundColorLight: Colors.secondary.DEFAULT,
    backgroundColorDark: '#16213E',
  },
  {
    id: '3',
    emoji: '💬',
    title: 'Communiquez facilement',
    description:
      'Échangez avec vos prestataires via notre messagerie intégrée.',
    backgroundColorLight: Colors.primary[100],
    backgroundColorDark: '#1A1A3E',
  },
  {
    id: '4',
    emoji: '⭐',
    title: 'Partagez votre expérience',
    description:
      'Laissez des avis pour aider la communauté à faire les meilleurs choix.',
    backgroundColorLight: Colors.success.light,
    backgroundColorDark: '#1E3A2E',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const { updateProfile, profile } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const handleGetStarted = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await updateProfile({ is_onboarded: true });

      if (profile?.role === 'provider') {
        router.replace('/(provider)/dashboard');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const bgColor = isDark ? item.backgroundColorDark : item.backgroundColorLight;
    return (
      <View style={[styles.slide, { backgroundColor: bgColor }]}>
        <View style={styles.slideContent}>
          <Text style={styles.emoji}>{item.emoji}</Text>
          <Text style={[styles.slideTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.slideDescription, { color: colors.textSecondary }]}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        {!isLastSlide && (
          <Button
            title="Passer"
            onPress={handleSkip}
            variant="ghost"
            size="sm"
          />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={(event) => {
          scrollX.value = event.nativeEvent.contentOffset.x;
        }}
      />

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: colors.border },
              currentIndex === index && { backgroundColor: colors.primary, width: 24 },
            ]}
          />
        ))}
      </View>

      {/* Footer buttons */}
      <View style={styles.footer}>
        {isLastSlide ? (
          <Button
            title="Commencer"
            onPress={handleGetStarted}
            size="lg"
            fullWidth
          />
        ) : (
          <Button
            title="Suivant"
            onPress={handleNext}
            size="lg"
            fullWidth
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
  },
  slideContent: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
    marginBottom: Layout.spacing.xl,
  },
  slideTitle: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Layout.spacing.md,
  },
  slideDescription: {
    fontSize: Layout.fontSize.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.lg,
  },
});