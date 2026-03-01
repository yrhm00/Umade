/**
 * Écran de création de story
 * Pour les prestataires uniquement
 */

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useColors } from '@/hooks/useColors';
import { useMyProviderId } from '@/hooks/useMyProviderId';
import { useCreateStory } from '@/hooks/useStories';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Camera, ChevronLeft, Image as ImageIcon, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { goBackOrFallback } from '@/lib/navigation';

export default function CreateStoryScreen() {
  const colors = useColors();
  const { userId, isProvider } = useAuth();
  const providerId = useMyProviderId();
  const { mutateAsync: createStory, isPending } = useCreateStory();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Redirect if not provider
  if (!isProvider) {
    goBackOrFallback(router);
    return null;
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l\'accès à la caméra pour prendre une photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const ownerId = providerId ?? userId ?? 'unknown';
    const fileName = `story_${ownerId}_${Date.now()}.jpg`;
    const filePath = `stories/${fileName}`;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      // expo-file-system doesn't re-export EncodingType on all builds; the runtime expects the string value.
      encoding: 'base64' as any,
    });

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, decode(base64), {
        contentType: 'image/jpeg',
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handlePublish = async () => {
    if (!selectedImage) {
      Alert.alert('Erreur', 'Sélectionnez une image pour votre story.');
      return;
    }

    setIsUploading(true);

    try {
      // Upload image to Supabase Storage
      const mediaUrl = await uploadImage(selectedImage);

      // Create story
      await createStory({
        media_url: mediaUrl,
        media_type: 'image',
        caption: caption.trim() || undefined,
        duration_seconds: 5,
      });

      Alert.alert('Succès', 'Votre story a été publiée !', [
        { text: 'OK', onPress: () => goBackOrFallback(router) },
      ]);
    } catch (error) {
      console.error('Error creating story:', error);
      Alert.alert('Erreur', 'Impossible de publier la story. Réessayez.');
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = isPending || isUploading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrFallback(router)} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Nouvelle Story</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {selectedImage ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.preview}
              contentFit="cover"
            />
            <Pressable
              style={styles.removeButton}
              onPress={() => setSelectedImage(null)}
            >
              <X size={20} color={Colors.white} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.mediaButtons}>
            <Pressable
              style={[styles.mediaButton, { backgroundColor: colors.backgroundTertiary }]}
              onPress={pickImage}
            >
              <ImageIcon size={32} color={colors.primary} />
              <Text style={[styles.mediaButtonText, { color: colors.text }]}>
                Galerie
              </Text>
            </Pressable>

            <Pressable
              style={[styles.mediaButton, { backgroundColor: colors.backgroundTertiary }]}
              onPress={takePhoto}
            >
              <Camera size={32} color={colors.primary} />
              <Text style={[styles.mediaButtonText, { color: colors.text }]}>
                Caméra
              </Text>
            </Pressable>
          </View>
        )}

        {/* Caption input */}
        {selectedImage && (
          <View style={styles.captionContainer}>
            <TextInput
              style={[
                styles.captionInput,
                { backgroundColor: colors.backgroundTertiary, color: colors.text },
              ]}
              placeholder="Ajouter une légende (optionnel)"
              placeholderTextColor={colors.textTertiary}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={200}
            />
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>
              {caption.length}/200
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      {selectedImage && (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.expiryNote, { color: colors.textSecondary }]}>
            Cette story expirera dans 24 heures
          </Text>
          <Button
            title={isLoading ? 'Publication...' : 'Publier la story'}
            variant="primary"
            size="lg"
            fullWidth
            onPress={handlePublish}
            disabled={isLoading}
            icon={isLoading ? <ActivityIndicator size="small" color={Colors.white} /> : undefined}
          />
        </View>
      )}
    </SafeAreaView>
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
    paddingVertical: Layout.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Layout.spacing.lg,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    justifyContent: 'center',
    paddingTop: 100,
  },
  mediaButton: {
    width: 140,
    height: 140,
    borderRadius: Layout.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  mediaButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  preview: {
    flex: 1,
    borderRadius: Layout.radius.lg,
  },
  removeButton: {
    position: 'absolute',
    top: Layout.spacing.md,
    right: Layout.spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionContainer: {
    marginTop: Layout.spacing.md,
  },
  captionInput: {
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    marginTop: Layout.spacing.xs,
    fontSize: 12,
  },
  footer: {
    padding: Layout.spacing.lg,
    borderTopWidth: 1,
    gap: Layout.spacing.md,
  },
  expiryNote: {
    textAlign: 'center',
    fontSize: 13,
  },
});
