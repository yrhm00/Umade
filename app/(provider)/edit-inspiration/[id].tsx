/**
 * Ecran d'edition d'une inspiration (Phase 9)
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { toast } from '@/lib/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, Plus, X, Camera, Check, Eye, Trash2 } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Shadows } from '@/constants/Shadows';
import { PressableScale } from '@/components/ui/PressableScale';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  useUpdateInspiration,
  useDeleteInspiration,
  useAddInspirationImages,
  useDeleteInspirationImage,
} from '@/hooks/useCreateInspiration';
import { useInspiration } from '@/hooks/useInspirations';
import {
  EventType,
  InspirationStyle,
  EVENT_TYPES,
  INSPIRATION_STYLES,
  InspirationImageInput,
} from '@/types/inspiration';
import { useColors } from '@/hooks/useColors';
import { goBackOrFallback } from '@/lib/navigation';

export default function EditInspirationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();

  const { data: inspiration, isLoading: isLoadingDetail } = useInspiration(id);
  const { mutateAsync: updateInspiration, isPending: isUpdating } = useUpdateInspiration();
  const { mutateAsync: deleteInspiration, isPending: isDeleting } = useDeleteInspiration();
  const { mutateAsync: addImages, isPending: isAddingImages } = useAddInspirationImages();
  const { mutateAsync: deleteImage, isPending: isDeletingImage } = useDeleteInspirationImage();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [style, setStyle] = useState<InspirationStyle | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [newImages, setNewImages] = useState<InspirationImageInput[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Charger les donnees initiales
  useEffect(() => {
    if (inspiration) {
      setTitle(inspiration.title || '');
      setDescription(inspiration.description || '');
      setEventType(inspiration.event_type as EventType);
      setStyle((inspiration.style as InspirationStyle) || null);
      setTags(inspiration.tags || []);
    }
  }, [inspiration]);

  const handleBack = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Modifications non sauvegardees',
        'Voulez-vous quitter sans sauvegarder ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Quitter', style: 'destructive', onPress: () => goBackOrFallback(router) },
        ]
      );
    } else {
      goBackOrFallback(router);
    }
  }, [hasChanges]);

  const handlePickImages = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      toast.warning("L'acces a la galerie est necessaire pour ajouter des photos.");
      return;
    }

    const currentCount = (inspiration?.inspiration_images?.length || 0) + newImages.length;
    const remaining = 10 - currentCount;

    if (remaining <= 0) {
      toast.warning('Vous ne pouvez pas ajouter plus de 10 photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: remaining,
    });

    if (!result.canceled) {
      const images: InspirationImageInput[] = result.assets.map((asset) => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      }));
      setNewImages([...newImages, ...images]);
      setHasChanges(true);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleDeleteExistingImage = async (imageId: string, imageUrl: string) => {
    const imageCount = (inspiration?.inspiration_images?.length || 0) + newImages.length;

    if (imageCount <= 1) {
      Alert.alert('Impossible', 'Vous devez garder au moins une photo.');
      return;
    }

    Alert.alert(
      'Supprimer cette photo ?',
      'Cette action est irreversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteImage({ imageId, imageUrl });
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer cette photo.');
            }
          },
        },
      ]
    );
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
      setHasChanges(true);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Titre requis', 'Veuillez ajouter un titre a votre inspiration.');
      return;
    }
    if (!eventType) {
      Alert.alert("Type d'événement requis", "Veuillez sélectionner un type d'événement.");
      return;
    }

    try {
      // Mettre a jour l'inspiration
      await updateInspiration({
        inspirationId: id,
        updates: {
          title: title.trim(),
          description: description.trim() || undefined,
          event_type: eventType,
          style: style || undefined,
          tags: tags.length > 0 ? tags : undefined,
        },
      });

      // Ajouter les nouvelles images si necessaire
      if (newImages.length > 0) {
        await addImages({
          inspirationId: id,
          images: newImages,
        });
      }

      Alert.alert('Modifications enregistrees', '', [
        { text: 'OK', onPress: () => goBackOrFallback(router) },
      ]);
    } catch (error) {
      console.error('Error updating inspiration:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer cette inspiration ?',
      'Cette action est irreversible. Toutes les photos seront supprimees.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInspiration(id);
              goBackOrFallback(router);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer cette inspiration.');
            }
          },
        },
      ]
    );
  };

  const handlePreview = () => {
    router.push(`/inspiration/${id}` as any);
  };

  const isLoading = isUpdating || isAddingImages;
  const isValid = title.trim() && eventType;

  if (isLoadingDetail) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner fullScreen message="Chargement..." />
      </SafeAreaView>
    );
  }

  if (!inspiration) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Inspiration introuvable
          </Text>
          <AnimatedButton
            title="Retour"
            variant="outline"
            onPress={() => goBackOrFallback(router)}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <PressableScale onPress={handleBack} haptic="light">
              <View style={[styles.backButton, { backgroundColor: colors.card }]}>
                <ChevronLeft size={24} color={colors.text} />
              </View>
            </PressableScale>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Modifier</Text>
            <View style={styles.headerActions}>
              <PressableScale onPress={handlePreview} haptic="light">
                <View style={[styles.iconButton, { backgroundColor: colors.card }]}>
                  <Eye size={20} color={colors.primary} />
                </View>
              </PressableScale>
          <PressableScale onPress={handleDelete} haptic="light">
            <View style={[styles.iconButton, { backgroundColor: `${colors.error}15` }]}>
              <Trash2 size={20} color={colors.error} />
            </View>
          </PressableScale>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Images existantes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Photos</Text>
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
            {(inspiration.inspiration_images?.length || 0) + newImages.length}/10 photos
          </Text>

          <View style={styles.imagesGrid}>
            {/* Images existantes */}
            {inspiration.inspiration_images?.map((image, index) => (
              <Animated.View
                key={image.id}
                entering={FadeInDown.delay(index * 50)}
                style={styles.imageContainer}
              >
                <Image
                  source={{ uri: image.thumbnail_url || image.image_url }}
                  style={styles.imagePreview}
                />
                <Pressable
                  onPress={() => handleDeleteExistingImage(image.id, image.image_url)}
                  style={styles.removeImageButton}
                  disabled={isDeletingImage}
                >
                  <X size={16} color="#FFFFFF" />
                </Pressable>
              </Animated.View>
            ))}

            {/* Nouvelles images */}
            {newImages.map((image, index) => (
              <Animated.View
                key={`new-${index}`}
                entering={FadeInDown.delay((inspiration.inspiration_images?.length || 0 + index) * 50)}
                style={styles.imageContainer}
              >
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>Nouveau</Text>
                </View>
                <Pressable
                  onPress={() => handleRemoveNewImage(index)}
                  style={styles.removeImageButton}
                >
                  <X size={16} color="#FFFFFF" />
                </Pressable>
              </Animated.View>
            ))}

            {/* Bouton ajouter */}
            {(inspiration.inspiration_images?.length || 0) + newImages.length < 10 && (
              <Pressable
                onPress={handlePickImages}
                style={[styles.addImageButton, { borderColor: colors.border, backgroundColor: colors.card }]}
              >
                <Camera size={24} color={colors.primary} />
                <Text style={[styles.addImageText, { color: colors.primary }]}>Ajouter</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Titre */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Titre <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={title}
            onChangeText={(text) => { setTitle(text); setHasChanges(true); }}
            placeholder="Ex : Mariage champêtre au Château"
            placeholderTextColor={colors.textTertiary}
            maxLength={200}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={description}
            onChangeText={(text) => { setDescription(text); setHasChanges(true); }}
            placeholder="Décrivez votre réalisation..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Type d'événement */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Type d'événement <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.chipsContainer}>
            {Object.entries(EVENT_TYPES).map(([value, label]) => (
              <SelectChip
                key={value}
                label={label}
                selected={eventType === value}
                onPress={() => { setEventType(value as EventType); setHasChanges(true); }}
                colors={colors}
              />
            ))}
          </View>
        </View>

        {/* Style */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Style</Text>
          <View style={styles.chipsContainer}>
            {Object.entries(INSPIRATION_STYLES).map(([value, label]) => (
              <SelectChip
                key={value}
                label={label}
                selected={style === value}
                onPress={() => {
                  setStyle(style === value ? null : (value as InspirationStyle));
                  setHasChanges(true);
                }}
                colors={colors}
              />
            ))}
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tags</Text>

          <View style={styles.tagInputContainer}>
            <TextInput
              style={[styles.tagInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Ajouter un tag"
              placeholderTextColor={colors.textTertiary}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
            />
            <PressableScale
              onPress={handleAddTag}
              haptic="light"
              style={[styles.addTagButton, { backgroundColor: `${colors.primary}20` }]}
            >
              <Plus size={20} color={colors.primary} />
            </PressableScale>
          </View>

          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.card }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>#{tag}</Text>
                  <Pressable onPress={() => handleRemoveTag(tag)} hitSlop={8}>
                    <X size={14} color={colors.textSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>Statistiques</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{inspiration.view_count || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Vues</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{inspiration.favorite_count || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Favoris</Text>
            </View>
          </View>
        </View>

        {/* Save button */}
        <AnimatedButton
          title="Enregistrer les modifications"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSave}
          loading={isLoading}
          disabled={!isValid || isLoading}
          style={styles.submitButton}
        />

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// Composant Chip de selection
// ============================================

interface SelectChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
}

function SelectChip({ label, selected, onPress, colors }: SelectChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: colors.card, borderColor: colors.border },
        selected && { backgroundColor: colors.primary, borderColor: colors.primary },
      ]}
    >
      {selected && <Check size={14} color="#FFFFFF" style={styles.chipCheck} />}
      <Text style={[styles.chipText, { color: colors.text }, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Layout.spacing.lg,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.xl,
    gap: Layout.spacing.lg,
  },
  errorText: {
    fontSize: Layout.fontSize.lg,
  },
  section: {
    marginBottom: Layout.spacing.xl,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    marginBottom: Layout.spacing.xs,
  },
  sectionHint: {
    fontSize: Layout.fontSize.sm,
    marginBottom: Layout.spacing.md,
  },
  required: {
    color: Colors.error.DEFAULT,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  imageContainer: {
    width: (Layout.window.width - Layout.spacing.lg * 2 - Layout.spacing.sm * 2) / 3,
    aspectRatio: 1,
    borderRadius: Layout.radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: Colors.success.DEFAULT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  newBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addImageButton: {
    width: (Layout.window.width - Layout.spacing.lg * 2 - Layout.spacing.sm * 2) / 3,
    aspectRatio: 1,
    borderRadius: Layout.radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: Layout.fontSize.sm,
    marginTop: Layout.spacing.xs,
    fontWeight: '500',
  },
  input: {
    borderRadius: Layout.radius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  textArea: {
    height: 100,
    paddingTop: Layout.spacing.md,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    ...Shadows.sm,
  },
  chipCheck: {
    marginRight: 4,
  },
  chipText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  tagInput: {
    flex: 1,
    borderRadius: Layout.radius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    fontSize: Layout.fontSize.md,
    borderWidth: 1,
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: Layout.radius.sm,
  },
  tagText: {
    fontSize: Layout.fontSize.sm,
  },
  statsSection: {
    padding: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.xl,
    ...Shadows.sm,
  },
  statsTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    marginBottom: Layout.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
  },
  statLabel: {
    fontSize: Layout.fontSize.sm,
  },
  submitButton: {
    marginTop: Layout.spacing.md,
  },
  bottomPadding: {
    height: Layout.spacing.xxl,
  },
});
