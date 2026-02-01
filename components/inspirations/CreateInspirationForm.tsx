/**
 * Formulaire de creation d'une inspiration (prestataire) - Phase 9
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, X, Camera, Check } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Shadows } from '@/constants/Shadows';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { PressableScale } from '@/components/ui/PressableScale';
import {
  EventType,
  InspirationStyle,
  EVENT_TYPES,
  INSPIRATION_STYLES,
  CreateInspirationInput,
  InspirationImageInput,
} from '@/types/inspiration';

interface CreateInspirationFormProps {
  onSubmit: (
    inspiration: CreateInspirationInput,
    images: InspirationImageInput[]
  ) => Promise<void>;
  isLoading?: boolean;
}

export function CreateInspirationForm({
  onSubmit,
  isLoading = false,
}: CreateInspirationFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [style, setStyle] = useState<InspirationStyle | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<InspirationImageInput[]>([]);

  const handlePickImages = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission requise',
        "L'acces a la galerie est necessaire pour ajouter des photos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - images.length,
    });

    if (!result.canceled) {
      const newImages: InspirationImageInput[] = result.assets.map((asset) => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      }));
      setImages([...images, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Titre requis', 'Veuillez ajouter un titre a votre inspiration.');
      return;
    }
    if (!eventType) {
      Alert.alert(
        "Type d'evenement requis",
        "Veuillez selectionner un type d'evenement."
      );
      return;
    }
    if (images.length === 0) {
      Alert.alert(
        'Photos requises',
        'Veuillez ajouter au moins une photo a votre inspiration.'
      );
      return;
    }

    const inspiration: CreateInspirationInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      event_type: eventType,
      style: style || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    await onSubmit(inspiration, images);
  };

  const isValid = title.trim() && eventType && images.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Images */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Photos <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.sectionHint}>
          Ajoutez jusqu'a 10 photos de votre realisation
        </Text>

        <View style={styles.imagesGrid}>
          {images.map((image, index) => (
            <Animated.View
              key={image.uri}
              entering={FadeInDown.delay(index * 50)}
              style={styles.imageContainer}
            >
              <Image source={{ uri: image.uri }} style={styles.imagePreview} />
              <Pressable
                onPress={() => handleRemoveImage(index)}
                style={styles.removeImageButton}
              >
                <X size={16} color={Colors.white} />
              </Pressable>
            </Animated.View>
          ))}

          {images.length < 10 && (
            <Pressable onPress={handlePickImages} style={styles.addImageButton}>
              <Camera size={24} color={Colors.primary.DEFAULT} />
              <Text style={styles.addImageText}>Ajouter</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Titre */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Titre <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Mariage champetre au Chateau"
          placeholderTextColor={Colors.text.muted}
          maxLength={200}
        />
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Decrivez votre realisation..."
          placeholderTextColor={Colors.text.muted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Type d'evenement */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Type d'evenement <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.chipsContainer}>
          {Object.entries(EVENT_TYPES).map(([value, label]) => (
            <SelectChip
              key={value}
              label={label}
              selected={eventType === value}
              onPress={() => setEventType(value as EventType)}
            />
          ))}
        </View>
      </View>

      {/* Style */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Style</Text>
        <View style={styles.chipsContainer}>
          {Object.entries(INSPIRATION_STYLES).map(([value, label]) => (
            <SelectChip
              key={value}
              label={label}
              selected={style === value}
              onPress={() =>
                setStyle(style === value ? null : (value as InspirationStyle))
              }
            />
          ))}
        </View>
      </View>

      {/* Tags */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tags</Text>
        <Text style={styles.sectionHint}>
          Ajoutez des mots-cles pour ameliorer la decouverte
        </Text>

        <View style={styles.tagInputContainer}>
          <TextInput
            style={styles.tagInput}
            value={tagInput}
            onChangeText={setTagInput}
            placeholder="Ajouter un tag"
            placeholderTextColor={Colors.text.muted}
            onSubmitEditing={handleAddTag}
            returnKeyType="done"
          />
          <PressableScale
            onPress={handleAddTag}
            haptic="light"
            style={styles.addTagButton}
          >
            <Plus size={20} color={Colors.primary.DEFAULT} />
          </PressableScale>
        </View>

        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
                <Pressable
                  onPress={() => handleRemoveTag(tag)}
                  hitSlop={8}
                >
                  <X size={14} color={Colors.text.secondary} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Submit button */}
      <AnimatedButton
        title="Publier l'inspiration"
        variant="primary"
        size="lg"
        fullWidth
        onPress={handleSubmit}
        loading={isLoading}
        disabled={!isValid || isLoading}
        style={styles.submitButton}
      />

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// ============================================
// Composant Chip de selection
// ============================================

interface SelectChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function SelectChip({ label, selected, onPress }: SelectChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      {selected && (
        <Check size={14} color={Colors.white} style={styles.chipCheck} />
      )}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  contentContainer: {
    padding: Layout.spacing.lg,
  },
  section: {
    marginBottom: Layout.spacing.xl,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Layout.spacing.xs,
  },
  sectionHint: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
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
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: (Layout.window.width - Layout.spacing.lg * 2 - Layout.spacing.sm * 2) / 3,
    aspectRatio: 1,
    borderRadius: Layout.radius.md,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray[50],
  },
  addImageText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary.DEFAULT,
    marginTop: Layout.spacing.xs,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.gray[200],
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
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    ...Shadows.sm,
  },
  chipSelected: {
    backgroundColor: Colors.primary.DEFAULT,
    borderColor: Colors.primary.DEFAULT,
  },
  chipCheck: {
    marginRight: 4,
  },
  chipText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: Colors.white,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  tagInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    fontSize: Layout.fontSize.md,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary[100],
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
    backgroundColor: Colors.gray[100],
    borderRadius: Layout.radius.sm,
  },
  tagText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
  },
  submitButton: {
    marginTop: Layout.spacing.md,
  },
  bottomPadding: {
    height: Layout.spacing.xxl,
  },
});
