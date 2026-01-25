import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { Provider } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Briefcase, Clock, MapPin, MessageCircle, Star } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProviderProfile();
  }, [id]);

  const fetchProviderProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setProvider(data);
    } catch (err: any) {
      console.error('Error fetching provider:', err);
      setError(err.message || 'Impossible de charger le profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContact = () => {
    // TODO: Créer une conversation et naviguer vers le chat
    router.push(`/chat/placeholder-conversation-id`);
  };

  const handleBooking = () => {
    // TODO: Implémenter le système de réservation
    console.log('Réservation pour le prestataire:', id);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !provider) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Prestataire non trouvé'}</Text>
          <Button
            title="Retour"
            onPress={() => router.back()}
            variant="outline"
            size="md"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Briefcase size={48} color={Colors.primary.DEFAULT} />
          </View>
          <Text style={styles.businessName}>{provider.business_name}</Text>
          <Text style={styles.category}>Prestataire événementiel</Text>

          {/* Rating */}
          {provider.average_rating && (
            <View style={styles.ratingContainer}>
              <Star size={20} color={Colors.warning.DEFAULT} fill={Colors.warning.DEFAULT} />
              <Text style={styles.rating}>
                {provider.average_rating.toFixed(1)}
              </Text>
              <Text style={styles.reviewCount}>
                ({provider.review_count || 0} avis)
              </Text>
            </View>
          )}
        </View>

        {/* Info Cards */}
        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <MapPin size={20} color={Colors.primary.DEFAULT} />
            <View style={styles.infoCardContent}>
              <Text style={styles.infoCardLabel}>Localisation</Text>
              <Text style={styles.infoCardValue}>
                {provider.city || 'Paris'}, France
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {provider.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>À propos</Text>
            <Text style={styles.description}>{provider.description}</Text>
          </View>
        )}

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services proposés</Text>
          <View style={styles.servicesContainer}>
            <View style={styles.serviceTag}>
              <Text style={styles.serviceTagText}>Organisation complète</Text>
            </View>
            <View style={styles.serviceTag}>
              <Text style={styles.serviceTagText}>Conseil personnalisé</Text>
            </View>
            <View style={styles.serviceTag}>
              <Text style={styles.serviceTagText}>Coordination le jour J</Text>
            </View>
          </View>
        </View>

        {/* Photos Gallery Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Galerie</Text>
          <Text style={styles.comingSoon}>Photos à venir</Text>
        </View>

        {/* Reviews Section Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avis clients</Text>
          <View style={styles.emptyState}>
            <Star size={40} color={Colors.gray[300]} />
            <Text style={styles.emptyStateText}>Aucun avis pour le moment</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title="Contacter"
          onPress={handleContact}
          variant="outline"
          size="lg"
          icon={<MessageCircle size={20} color={Colors.primary.DEFAULT} />}
          style={styles.contactButton}
        />
        <Button
          title="Réserver"
          onPress={handleBooking}
          variant="primary"
          size="lg"
          style={styles.bookButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  errorText: {
    fontSize: Layout.fontSize.md,
    color: Colors.error.DEFAULT,
    marginBottom: Layout.spacing.lg,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.radius.md,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  scrollContent: {
    paddingBottom: Layout.spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${Colors.primary.DEFAULT}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  businessName: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  category: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.secondary,
    marginBottom: Layout.spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  rating: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  reviewCount: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
  },
  infoCards: {
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    gap: Layout.spacing.md,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Layout.spacing.xs / 2,
  },
  infoCardValue: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  section: {
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.xl,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Layout.spacing.md,
  },
  description: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  serviceTag: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.md,
  },
  serviceTagText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary.DEFAULT,
    fontWeight: '500',
  },
  comingSoon: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  emptyStateText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Layout.spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    gap: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  contactButton: {
    flex: 1,
  },
  bookButton: {
    flex: 1,
  },
});
