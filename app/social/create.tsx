/**
 * Écran de création d'un post social
 */

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useColors } from '@/hooks/useColors';
import { useCreateSocialPost } from '@/hooks/useSocialFeed';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
  Camera,
  ChevronLeft,
  Image as ImageIcon,
  MapPin,
  X,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';
import { toast } from '@/lib/toast';

interface SelectedImage {
  uri: string;
  width?: number;
  height?: number;
}

export default function CreateSocialPostScreen() {
  const colors = useColors();
  const { userId } = useAuth();
  const { mutateAsync: createPost, isPending } = useCreateSocialPost();

  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      }));
      setImages([...images, ...newImages].slice(0, 10));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast.warning("Autorisez l'accès à la caméra.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([
        ...images,
        {
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
        },
      ].slice(0, 10));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const uploadImage = async (uri: string, index: number): Promise<string> => {
    const fileName = `post_${userId}_${Date.now()}_${index}.jpg`;
    const filePath = `social/${fileName}`;

    const base64 = await FileSystem.readAsStringAsync(uri, {
      // expo-file-system doesn't re-export EncodingType on all builds; the runtime expects the string value.
      encoding: 'base64' as any,
    });

    const { error } = await supabase.storage
      .from('media')
      .upload(filePath, decode(base64), {
        contentType: 'image/jpeg',
      });

    if (error) throw error;

    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handlePublish = async () => {
    if (images.length === 0 && !content.trim()) {
      toast.error('Ajoutez du contenu ou des images.');
      return;
    }

    setIsUploading(true);

    try {
      // Upload images
      const uploadedImages: SelectedImage[] = [];
      for (let i = 0; i < images.length; i++) {
        const url = await uploadImage(images[i].uri, i);
        uploadedImages.push({
          uri: url,
          width: images[i].width,
          height: images[i].height,
        });
      }

      // Create post
      await createPost({
        content: content.trim() || undefined,
        location: location.trim() || undefined,
        images: uploadedImages,
      });

      toast.success('Votre publication a été partagée !');
      goBackOrFallback(router);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Impossible de publier. Réessayez.');
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = isPending || isUploading;
  const canPublish = (images.length > 0 || content.trim().length > 0) && !isLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => goBackOrFallback(router)} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Nouvelle publication</Text>
        <Button
          title={isLoading ? '' : 'Publier'}
          variant="primary"
          size="sm"
          onPress={handlePublish}
          disabled={!canPublish}
          icon={isLoading ? <ActivityIndicator size="small" color={Colors.white} /> : undefined}
        />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Content input */}
        <TextInput
          style={[styles.contentInput, { color: colors.text }]}
          placeholder="Partagez votre événement..."
          placeholderTextColor={colors.textTertiary}
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={2000}
        />

        {/* Location input */}
        <View style={[styles.locationInput, { backgroundColor: colors.backgroundTertiary }]}>
          <MapPin size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.locationText, { color: colors.text }]}
            placeholder="Ajouter un lieu"
            placeholderTextColor={colors.textTertiary}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Images grid */}
        {images.length > 0 && (
          <View style={styles.imagesGrid}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.imagePreview}
                  contentFit="cover"
                />
                <Pressable
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <X size={16} color={Colors.white} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Add media buttons */}
        <View style={styles.mediaButtons}>
          <Pressable
            style={[styles.mediaButton, { backgroundColor: colors.backgroundTertiary }]}
            onPress={pickImages}
          >
            <ImageIcon size={24} color={colors.primary} />
            <Text style={[styles.mediaButtonText, { color: colors.text }]}>
              Galerie
            </Text>
          </Pressable>

          <Pressable
            style={[styles.mediaButton, { backgroundColor: colors.backgroundTertiary }]}
            onPress={takePhoto}
          >
            <Camera size={24} color={colors.primary} />
            <Text style={[styles.mediaButtonText, { color: colors.text }]}>
              Caméra
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          {images.length}/10 images
        </Text>
      </ScrollView>
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
    borderBottomWidth: 1,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Layout.spacing.lg,
  },
  contentInput: {
    fontSize: 18,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: Layout.spacing.lg,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  imageWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: Layout.radius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    gap: Layout.spacing.sm,
  },
  mediaButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  hint: {
    textAlign: 'center',
    marginTop: Layout.spacing.md,
    fontSize: 13,
  },
});
