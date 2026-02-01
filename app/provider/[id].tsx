/**
 * Provider Detail Screen
 * Dark Mode Support
 */

import { RatingStars } from '@/components/common/RatingStars';
import { InspirationCard } from '@/components/inspirations/InspirationCard';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { useProviderInspirations } from '@/hooks/useInspirations';
import { useProviderDetail } from '@/hooks/useProviders';
import { formatPrice } from '@/lib/utils';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Globe,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Sparkles,
  Star,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const GALLERY_IMAGE_HEIGHT = 300;

export default function ProviderDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: provider, isLoading, error } = useProviderDetail(id);
  const { data: inspirationsData } = useProviderInspirations(id);
  const { data: favoriteIds = [] } = useFavoriteIds();
  const { mutate: toggleFavorite, isPending: isFavoriteLoading } = useToggleFavorite();

  const inspirations = inspirationsData?.pages.flatMap((page) => page) ?? [];

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const isFavorite = favoriteIds.includes(id || '');

  const handleBack = () => router.back();

  const handleFavoritePress = () => {
    if (!isFavoriteLoading && id) {
      toggleFavorite(id);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvrez ${provider?.business_name} sur Umade !`,
        url: `https://umade.be/provider/${id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleContact = () => {
    router.push(`/chat/new?providerId=${id}`);
  };

  const handleBook = () => {
    router.push(`/booking/${id}` as any);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement..." />;
  }

  if (error || !provider) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Prestataire non trouvé</Text>
          <Button title="Retour" onPress={handleBack} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const images = provider.portfolio_images || [];
  const services = provider.services || [];
  const reviews = provider.reviews || [];
  const minPrice =
    services.length > 0 ? Math.min(...services.map((s) => s.price)) : null;

  const categoryBadgeBg = isDark ? colors.backgroundTertiary : `${colors.primary}10`;
  const serviceCardBg = isDark ? colors.card : '#F9FAFB';
  const reviewCardBg = isDark ? colors.card : '#F9FAFB';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerLeft: () => (
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <ArrowLeft size={24} color={Colors.white} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRightButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleShare}
              >
                <Share2 size={22} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleFavoritePress}
              >
                <Heart
                  size={22}
                  color={isFavorite ? colors.error : Colors.white}
                  fill={isFavorite ? colors.error : 'transparent'}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Gallery */}
        <View style={[styles.galleryContainer, { backgroundColor: colors.backgroundTertiary }]}>
          {images.length > 0 ? (
            <>
              <FlatList
                data={images}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / width
                  );
                  setActiveImageIndex(index);
                }}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                )}
              />
              {images.length > 1 && (
                <View style={styles.paginationDots}>
                  {images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        activeImageIndex === index && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderEmoji}>📸</Text>
              <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>Pas de photos</Text>
            </View>
          )}
        </View>

        {/* Main Info */}
        <View style={styles.content}>
          <View style={styles.mainInfo}>
            <Text style={[styles.businessName, { color: colors.text }]}>{provider.business_name}</Text>

            <View style={[styles.categoryBadge, { backgroundColor: categoryBadgeBg }]}>
              <Text style={[styles.categoryText, { color: colors.primary }]}>
                {provider.category?.name || 'Prestataire'}
              </Text>
            </View>

            {/* Rating & Location */}
            <View style={styles.metaRow}>
              {provider.average_rating ? (
                <RatingStars
                  rating={provider.average_rating}
                  reviewCount={provider.review_count || 0}
                />
              ) : (
                <Text style={[styles.newBadge, { color: colors.primary }]}>Nouveau</Text>
              )}
            </View>

            {provider.city && (
              <View style={styles.locationRow}>
                <MapPin size={16} color={colors.textSecondary} />
                <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                  {provider.address || provider.city}
                </Text>
              </View>
            )}

            {/* Contact info */}
            <View style={styles.contactInfo}>
              {provider.business_phone && (
                <View style={styles.contactItem}>
                  <Phone size={16} color={colors.textSecondary} />
                  <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                    {provider.business_phone}
                  </Text>
                </View>
              )}
              {provider.website && (
                <View style={styles.contactItem}>
                  <Globe size={16} color={colors.textSecondary} />
                  <Text style={[styles.contactText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {provider.website}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {provider.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>À propos</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>{provider.description}</Text>
            </View>
          )}

          {/* Services */}
          {services.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Services</Text>
              {services.map((service) => (
                <View key={service.id} style={[styles.serviceCard, { backgroundColor: serviceCardBg }]}>
                  <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceName, { color: colors.text }]}>{service.name}</Text>
                    {service.description && (
                      <Text style={[styles.serviceDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                        {service.description}
                      </Text>
                    )}
                    {service.duration_minutes && (
                      <View style={styles.durationRow}>
                        <Clock size={14} color={colors.textTertiary} />
                        <Text style={[styles.durationText, { color: colors.textTertiary }]}>
                          {service.duration_minutes} min
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.servicePrice, { color: colors.primary }]}>
                    {formatPrice(service.price)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Avis</Text>
                {reviews.length > 3 && (
                  <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={() => router.push(`/reviews/provider/${id}`)}
                  >
                    <Text style={[styles.seeAllText, { color: colors.primary }]}>Voir tous</Text>
                    <ChevronRight size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {reviews.slice(0, 3).map((review) => (
                <View key={review.id} style={[styles.reviewCard, { backgroundColor: reviewCardBg }]}>
                  <View style={styles.reviewHeader}>
                    <Avatar
                      source={review.client?.avatar_url ?? undefined}
                      name={review.client?.full_name ?? undefined}
                      size="sm"
                    />
                    <View style={styles.reviewerInfo}>
                      <Text style={[styles.reviewerName, { color: colors.text }]}>
                        {review.client?.full_name || 'Anonyme'}
                      </Text>
                      <RatingStars
                        rating={review.rating}
                        size={12}
                        showValue={false}
                      />
                    </View>
                    <Text style={[styles.reviewDate, { color: colors.textTertiary }]}>
                      {new Date(review.created_at!).toLocaleDateString('fr-BE', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  {review.comment && (
                    <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>{review.comment}</Text>
                  )}
                  {review.provider_response && (
                    <View style={[styles.providerResponse, { borderTopColor: colors.border }]}>
                      <Text style={[styles.providerResponseLabel, { color: colors.primary }]}>
                        Réponse du prestataire
                      </Text>
                      <Text style={[styles.providerResponseText, { color: colors.textSecondary }]}>
                        {review.provider_response}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Empty reviews state */}
          {reviews.length === 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Avis</Text>
              <View style={styles.emptyReviews}>
                <Star size={40} color={colors.border} />
                <Text style={[styles.emptyReviewsText, { color: colors.textSecondary }]}>
                  Aucun avis pour le moment
                </Text>
              </View>
            </View>
          )}

          {/* Inspirations */}
          {inspirations.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Sparkles size={20} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8, color: colors.text }]}>
                    Inspirations
                  </Text>
                </View>
                {inspirations.length > 4 && (
                  <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={() => router.push(`/(tabs)` as any)}
                  >
                    <Text style={[styles.seeAllText, { color: colors.primary }]}>Voir tous</Text>
                    <ChevronRight size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.inspirationsGrid}>
                {inspirations.slice(0, 4).map((inspiration, index) => (
                  <View key={inspiration.id} style={styles.inspirationItem}>
                    <InspirationCard
                      inspiration={inspiration}
                      index={index}
                      showProvider={false}
                      onPress={() => router.push(`/inspiration/${inspiration.id}` as any)}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Spacer for bottom buttons */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <SafeAreaView edges={['bottom']} style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.bottomContent}>
          {minPrice && (
            <View style={styles.priceContainer}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>À partir de</Text>
              <Text style={[styles.priceValue, { color: colors.text }]}>{formatPrice(minPrice)}</Text>
            </View>
          )}
          <View style={styles.bottomButtons}>
            <TouchableOpacity
              style={[styles.contactButton, { borderColor: colors.primary }]}
              onPress={handleContact}
            >
              <MessageCircle size={20} color={colors.primary} />
            </TouchableOpacity>
            <Button
              title="Réserver"
              onPress={handleBook}
              size="lg"
              style={styles.bookButton}
            />
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
    gap: Layout.spacing.lg,
  },
  errorText: {
    fontSize: Layout.fontSize.lg,
  },

  // Header buttons
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },

  // Gallery
  galleryContainer: {
    height: GALLERY_IMAGE_HEIGHT,
  },
  galleryImage: {
    width,
    height: GALLERY_IMAGE_HEIGHT,
  },
  paginationDots: {
    position: 'absolute',
    bottom: Layout.spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Layout.spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 20,
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  placeholderText: {
    marginTop: Layout.spacing.sm,
    fontSize: Layout.fontSize.md,
  },

  // Content
  content: {
    padding: Layout.spacing.lg,
  },
  mainInfo: {
    marginBottom: Layout.spacing.lg,
  },
  businessName: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    marginBottom: Layout.spacing.sm,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingVertical: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.radius.full,
    marginBottom: Layout.spacing.md,
  },
  categoryText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  newBadge: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    marginBottom: Layout.spacing.sm,
  },
  locationText: {
    fontSize: Layout.fontSize.sm,
  },
  contactInfo: {
    marginTop: Layout.spacing.sm,
    gap: Layout.spacing.xs,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  contactText: {
    fontSize: Layout.fontSize.sm,
    flex: 1,
  },

  // Sections
  section: {
    marginBottom: Layout.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    marginBottom: Layout.spacing.md,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  description: {
    fontSize: Layout.fontSize.md,
    lineHeight: 24,
  },

  // Services
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    marginBottom: Layout.spacing.sm,
  },
  serviceInfo: {
    flex: 1,
    marginRight: Layout.spacing.md,
  },
  serviceName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    marginBottom: Layout.spacing.xs,
  },
  serviceDescription: {
    fontSize: Layout.fontSize.sm,
    marginBottom: Layout.spacing.xs,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  durationText: {
    fontSize: Layout.fontSize.xs,
  },
  servicePrice: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
  },

  // Reviews
  reviewCard: {
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    marginBottom: Layout.spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: Layout.spacing.sm,
  },
  reviewerName: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: Layout.fontSize.xs,
  },
  reviewComment: {
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
  },
  providerResponse: {
    marginTop: Layout.spacing.sm,
    paddingTop: Layout.spacing.sm,
    borderTopWidth: 1,
  },
  providerResponseLabel: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    marginBottom: Layout.spacing.xs,
  },
  providerResponseText: {
    fontSize: Layout.fontSize.sm,
    fontStyle: 'italic',
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  emptyReviewsText: {
    marginTop: Layout.spacing.sm,
    fontSize: Layout.fontSize.sm,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  bottomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.lg,
  },
  priceContainer: {},
  priceLabel: {
    fontSize: Layout.fontSize.xs,
  },
  priceValue: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
  },
  bottomButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  contactButton: {
    width: 48,
    height: 48,
    borderRadius: Layout.radius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButton: {
    minWidth: 140,
  },

  // Inspirations
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inspirationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Layout.spacing.xs,
  },
  inspirationItem: {
    width: '50%',
    paddingHorizontal: Layout.spacing.xs,
  },
});
