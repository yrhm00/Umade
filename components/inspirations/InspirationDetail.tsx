/**
 * Vue detail d'une inspiration avec carousel (Phase 9)
 */

import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { Avatar } from '@/components/ui/Avatar';
import { PressableScale } from '@/components/ui/PressableScale';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useFindOrCreateConversation } from '@/hooks/useConversations';
import { useInspirationFavoriteActions } from '@/hooks/useInspirationFavorites';
import {
  InspirationDetail as InspirationDetailType,
  InspirationImage,
  getEventTypeLabel,
  getStyleLabel,
} from '@/types/inspiration';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ChevronLeft,
  ExternalLink,
  Heart,
  Share2
} from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { toast } from '@/lib/toast';
import {
  GestureDetector,
  type PanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedScrollHandler,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';
import { getHeroHeight } from './heroLayout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * `GestureDetector` exige un geste : sans transition d'origine (lien profond),
 * il n'y a rien a rattacher, on rend donc les enfants tels quels.
 */
function CarouselGestureWrapper({
  gesture,
  children,
}: {
  gesture?: PanGesture;
  children: React.ReactNode;
}) {
  if (!gesture) return <>{children}</>;
  return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
}

interface InspirationDetailProps {
  inspiration: InspirationDetailType;
  onClose?: () => void;
  /** Geste « tirer vers le bas pour fermer », rattache a toute la page. */
  dismissGesture?: PanGesture;
  /**
   * Ref du ScrollView, pour que le geste de fermeture puisse cohabiter avec le
   * defilement au lieu de l'emporter sur lui.
   */
  scrollRef?: React.Ref<Animated.ScrollView>;
  /** Position de defilement : le geste ne part que si le contenu est en haut. */
  contentScrollY?: SharedValue<number>;
}

export function InspirationDetail({
  inspiration,
  onClose,
  dismissGesture,
  scrollRef,
  contentScrollY,
}: InspirationDetailProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const insets = useSafeAreaInsets();

  // Remonte la position de defilement : le geste de fermeture ne doit partir que
  // si le contenu est deja en haut, sinon lire les infos fermerait l'ecran.
  const handleContentScroll = useAnimatedScrollHandler((event) => {
    if (contentScrollY) contentScrollY.value = event.contentOffset.y;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isContacting, setIsContacting] = useState(false);
  const { isFavorite, toggleFavorite, isLoading } = useInspirationFavoriteActions();
  const isInspFavorite = isFavorite(inspiration.id);
  const flatListRef = useRef<FlatList>(null);

  const { userId, isAuthenticated } = useAuth();
  const { mutateAsync: findOrCreateConversation } = useFindOrCreateConversation();

  const images = inspiration.inspiration_images || [];

  // Pinterest dimensionne le visuel sur le ratio naturel de la photo : une
  // image portrait remplit presque l'ecran, une image carree ou paysage laisse
  // voir le contenu en dessous. Une hauteur fixe donnait le meme cadrage a
  // toutes les photos, en rognant les portraits et en etirant les paysages.
  const heroHeight = React.useMemo(() => {
    const cover = images[0];
    return getHeroHeight(
      cover?.width && cover?.height ? cover.width / cover.height : null
    );
  }, [images]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleFavoritePress = () => {
    if (!isLoading) {
      toggleFavorite(inspiration.id);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Decouvrez cette inspiration: ${inspiration.title || 'Inspiration evenementielle'}`,
        // url: `https://umade.app/inspiration/${inspiration.id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleProviderPress = () => {
    if (inspiration.providers?.id) {
      router.push(`/provider/${inspiration.providers.id}` as any);
    }
  };

  const handleContactProvider = async () => {
    if (!isAuthenticated || !userId) {
      toast.warning('Veuillez vous connecter pour contacter ce prestataire.');
      return;
    }

    if (!inspiration.providers?.id) {
      toast.error('Impossible de contacter ce prestataire.');
      return;
    }

    setIsContacting(true);

    try {
      // 1. Find or create conversation with provider
      const conversation = await findOrCreateConversation(inspiration.providers!.id);

      // 2. Prepare inspiration context to pass as query param (not sent yet)
      const inspirationContext = {
        type: 'inspiration_context',
        inspiration_id: inspiration.id,
        title: inspiration.title || 'Inspiration',
        image_url: images[0]?.image_url || '',
      };

      // 3. Navigate to chat with inspiration attached (not sent)
      router.push({
        pathname: `/chat/${conversation.id}`,
        params: {
          pendingInspiration: JSON.stringify(inspirationContext),
        },
      } as any);
    } catch (error) {
      console.error('Error contacting provider:', error);
      toast.error('Impossible de démarrer la conversation. Veuillez réessayer.');
    } finally {
      setIsContacting(false);
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      goBackOrFallback(router);
    }
  };


  const renderImage = ({ item }: { item: InspirationImage }) => (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: item.image_url }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
    </View>
  );

  return (
    <CarouselGestureWrapper gesture={dismissGesture}>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Carousel d'images */}
      <View style={[styles.carouselContainer, { height: heroHeight }]}>
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderImage}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />

        {/* Header overlay */}
        {/* Deux vues : Reanimated avertit qu'une animation `entering` et un
            style anime peuvent tous deux piloter `opacity` sur le meme noeud. */}
        <Animated.View
          style={styles.headerOverlay}
          pointerEvents="box-none"
        >
        <Animated.View entering={FadeIn.delay(200)}>
          <View style={[styles.headerBar, { paddingTop: insets.top + Layout.spacing.sm }]}>
            <PressableScale onPress={handleBack} haptic="light">
              <View style={styles.iconButton}>
                <ChevronLeft size={24} color={Colors.white} />
              </View>
            </PressableScale>

            <View style={styles.headerActions}>
              <PressableScale onPress={handleShare} haptic="light">
                <View style={styles.iconButton}>
                  <Share2 size={20} color={Colors.white} />
                </View>
              </PressableScale>
              <PressableScale onPress={handleFavoritePress} haptic="light">
                <View style={styles.iconButton}>
                  <Heart
                    size={20}
                    color={isInspFavorite ? Colors.error.DEFAULT : Colors.white}
                    fill={isInspFavorite ? Colors.error.DEFAULT : 'transparent'}
                  />
                </View>
              </PressableScale>
            </View>
          </View>
        </Animated.View>
        </Animated.View>

        {/* Pagination dots */}
        {images.length > 1 && (
          <Animated.View style={styles.pagination}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </Animated.View>
        )}
      </View>

      {/* Contenu */}
      <Animated.ScrollView
        ref={scrollRef}
        entering={FadeInUp.delay(300).duration(260)}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleContentScroll}
        scrollEventThrottle={16}
      >
        {/* Badges */}
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>
              {getEventTypeLabel(inspiration.event_type)}
            </Text>
          </View>
          {inspiration.style && (
            <View style={[styles.badge, styles.badgeOutline, { borderColor: colors.primary }]}>
              <Text style={[styles.badgeTextOutline, { color: colors.primary }]}>
                {getStyleLabel(inspiration.style)}
              </Text>
            </View>
          )}
        </View>

        {/* Titre */}
        {inspiration.title && (
          <Text style={[styles.title, { color: colors.text }]}>{inspiration.title}</Text>
        )}

        {/* Description */}
        {inspiration.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>{inspiration.description}</Text>
        )}

        {/* Tags */}
        {inspiration.tags && inspiration.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {inspiration.tags.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: isDark ? colors.backgroundTertiary : Colors.gray[100] }]}>
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Stats */}
        <View style={[styles.stats, { borderBottomColor: colors.border }]}>
          <View style={styles.stat}>
            <Heart size={16} color={colors.textTertiary} />
            <Text style={[styles.statText, { color: colors.textTertiary }]}>
              {/* 0 et 1 restent au singulier en francais. */}
              {inspiration.favorite_count} favori{inspiration.favorite_count > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statText, { color: colors.textTertiary }]}>
              {inspiration.view_count} vue{inspiration.view_count > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Prestataire */}
        {inspiration.providers && (
          <Pressable
            onPress={handleProviderPress}
            style={[styles.providerCard, { backgroundColor: isDark ? colors.card : Colors.gray[50] }]}
          >
            <Avatar
              source={inspiration.providers.profiles?.avatar_url}
              name={inspiration.providers.business_name}
              size="lg"
            />
            <View style={styles.providerInfo}>
              <Text style={[styles.providerName, { color: colors.text }]}>
                {inspiration.providers.business_name}
              </Text>
              {inspiration.providers.categories && (
                <Text style={[styles.providerCategory, { color: colors.textSecondary }]}>
                  {inspiration.providers.categories.name}
                </Text>
              )}
            </View>
            <ExternalLink size={20} color={colors.primary} />
          </Pressable>
        )}

        {/* CTA */}
        <AnimatedButton
          title={isContacting ? "Chargement..." : "Contacter le prestataire"}
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleContactProvider}
          disabled={isContacting}
          style={styles.ctaButton}
        />

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
    </View>
    </CarouselGestureWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carouselContainer: {
    // Hauteur fournie a l'execution : elle depend du ratio de la photo.
    position: 'relative',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagination: {
    position: 'absolute',
    bottom: Layout.spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Layout.spacing.xs,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  paginationDotActive: {
    backgroundColor: Colors.white,
    width: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Layout.spacing.lg,
  },
  badges: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  badge: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.radius.full,
  },
  badgeOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  badgeTextOutline: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    marginBottom: Layout.spacing.sm,
  },
  description: {
    fontSize: Layout.fontSize.md,
    lineHeight: 24,
    marginBottom: Layout.spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  tag: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: Layout.radius.sm,
  },
  tagText: {
    fontSize: Layout.fontSize.sm,
  },
  stats: {
    flexDirection: 'row',
    gap: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    paddingBottom: Layout.spacing.lg,
    borderBottomWidth: 1,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  statText: {
    fontSize: Layout.fontSize.sm,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.lg,
  },
  providerInfo: {
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
  providerName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  providerCategory: {
    fontSize: Layout.fontSize.sm,
    marginTop: 2,
  },
  ctaButton: {
    marginTop: Layout.spacing.sm,
  },
  bottomPadding: {
    height: Layout.spacing.xxl,
  },
});
