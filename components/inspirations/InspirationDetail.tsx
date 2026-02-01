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
import { useSendMessage } from '@/hooks/useMessages';
import {
  InspirationDetail as InspirationDetailType,
  InspirationImage,
  getEventTypeLabel,
  getStyleLabel,
} from '@/types/inspiration';
import { BlurView } from 'expo-blur';
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
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface InspirationDetailProps {
  inspiration: InspirationDetailType;
  onClose?: () => void;
}

export function InspirationDetail({
  inspiration,
  onClose,
}: InspirationDetailProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isContacting, setIsContacting] = useState(false);
  const { isFavorite, toggleFavorite, isLoading } = useInspirationFavoriteActions();
  const isInspFavorite = isFavorite(inspiration.id);
  const flatListRef = useRef<FlatList>(null);

  const { userId, isAuthenticated } = useAuth();
  const { mutateAsync: findOrCreateConversation } = useFindOrCreateConversation();
  const { mutateAsync: sendMessage } = useSendMessage();

  const images = inspiration.inspiration_images || [];

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
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour contacter ce prestataire.');
      return;
    }

    if (!inspiration.providers?.id) {
      Alert.alert('Erreur', 'Impossible de contacter ce prestataire.');
      return;
    }

    setIsContacting(true);

    try {
      // 1. Find or create conversation with provider
      const conversation = await findOrCreateConversation(inspiration.providers!.id);

      // 2. Send inspiration context message
      const contextMessage = JSON.stringify({
        type: 'inspiration_context',
        inspiration_id: inspiration.id,
        title: inspiration.title || 'Inspiration',
        image_url: images[0]?.image_url || '',
      });

      await sendMessage({
        conversation_id: conversation.id,
        content: contextMessage,
      });

      // 3. Navigate to chat
      router.push(`/chat/${conversation.id}` as any);
    } catch (error) {
      console.error('Error contacting provider:', error);
      Alert.alert('Erreur', 'Impossible de démarrer la conversation. Veuillez réessayer.');
    } finally {
      setIsContacting(false);
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Carousel d'images */}
      <View style={styles.carouselContainer}>
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
        <Animated.View
          entering={FadeIn.delay(200)}
          style={styles.headerOverlay}
        >
          <BlurView intensity={40} tint="dark" style={styles.headerBlur}>
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
          </BlurView>
        </Animated.View>

        {/* Pagination dots */}
        {images.length > 1 && (
          <View style={styles.pagination}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Contenu */}
      <Animated.ScrollView
        entering={FadeInUp.delay(300).springify()}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
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
              {inspiration.favorite_count} favoris
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statText, { color: colors.textTertiary }]}>
              {inspiration.view_count} vues
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carouselContainer: {
    height: SCREEN_HEIGHT * 0.5,
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
  headerBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
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
    borderRadius: 4,
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
