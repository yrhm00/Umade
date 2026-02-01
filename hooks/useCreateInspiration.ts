/**
 * Hook pour creer et gerer les inspirations (prestataires) - Phase 9
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import {
  CreateInspirationInput,
  InspirationImageInput,
  InspirationWithProvider,
} from '@/types/inspiration';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';
import { useAuth } from './useAuth';

// Helper pour accéder aux tables non encore dans les types auto-générés
const fromTable = (table: string) => supabase.from(table as any);

// Helper to convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// ============================================
// Hook pour obtenir le provider ID de l'utilisateur
// ============================================

export function useCurrentProvider() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ['currentProvider', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('providers')
        .select('id, business_name')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// ============================================
// Hook pour les inspirations du prestataire connecte
// ============================================

export function useMyInspirations() {
  const { data: provider } = useCurrentProvider();

  return useQuery({
    queryKey: [Config.cacheKeys.inspirations, 'my', provider?.id],
    queryFn: async (): Promise<InspirationWithProvider[]> => {
      if (!provider?.id) return [];

      const { data, error } = await fromTable('inspirations')
        .select(`
          *,
          inspiration_images (
            id,
            image_url,
            thumbnail_url,
            width,
            height,
            display_order
          ),
          providers (
            id,
            business_name,
            profiles:user_id (
              avatar_url,
              full_name
            ),
            categories (
              name,
              slug
            )
          )
        `)
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return ((data as any[]) || []).map((item) => ({
        ...item,
        inspiration_images: (item.inspiration_images || []).sort(
          (a: { display_order: number }, b: { display_order: number }) =>
            a.display_order - b.display_order
        ),
      })) as InspirationWithProvider[];
    },
    enabled: !!provider?.id,
  });
}

// ============================================
// Hook pour creer une inspiration avec upload d'images
// ============================================

interface CreateInspirationParams {
  inspiration: CreateInspirationInput;
  images: InspirationImageInput[];
}

export function useCreateInspiration() {
  const queryClient = useQueryClient();
  const { data: provider } = useCurrentProvider();

  return useMutation({
    mutationFn: async ({ inspiration, images }: CreateInspirationParams) => {
      if (!provider?.id) throw new Error('Provider not found');

      // 1. Creer l'inspiration
      const { data: newInspiration, error: inspirationError } = await fromTable('inspirations')
        .insert({
          provider_id: provider.id,
          title: inspiration.title,
          description: inspiration.description || null,
          event_type: inspiration.event_type,
          style: inspiration.style || null,
          tags: inspiration.tags || null,
        })
        .select()
        .single();

      if (inspirationError) throw inspirationError;

      const inspirationId = (newInspiration as any).id;

      // 2. Upload des images et creation des entries
      const uploadedImages = await Promise.all(
        images.map(async (image, index) => {
          // Generer un nom de fichier unique
          const fileName = `${inspirationId}/${Date.now()}_${index}.jpg`;

          // Lire le fichier en base64
          const base64 = await FileSystem.readAsStringAsync(image.uri, {
            encoding: 'base64' as const,
          });

          // Upload vers Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('inspirations')
            .upload(fileName, base64ToArrayBuffer(base64), {
              contentType: 'image/jpeg',
            });

          if (uploadError) throw uploadError;

          // Obtenir l'URL publique
          const { data: urlData } = supabase.storage
            .from('inspirations')
            .getPublicUrl(fileName);

          return {
            inspiration_id: inspirationId,
            image_url: urlData.publicUrl,
            thumbnail_url: urlData.publicUrl,
            width: image.width || null,
            height: image.height || null,
            display_order: index,
          };
        })
      );

      // 3. Inserer les images dans la table
      if (uploadedImages.length > 0) {
        const { error: imagesError } = await fromTable('inspiration_images')
          .insert(uploadedImages);

        if (imagesError) throw imagesError;
      }

      return newInspiration;
    },
    onSuccess: () => {
      // Invalider les caches
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.inspirations],
      });
    },
  });
}

// ============================================
// Hook pour mettre a jour une inspiration
// ============================================

interface UpdateInspirationParams {
  inspirationId: string;
  updates: Partial<CreateInspirationInput>;
}

export function useUpdateInspiration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inspirationId, updates }: UpdateInspirationParams) => {
      const { data, error } = await fromTable('inspirations')
        .update({
          title: updates.title,
          description: updates.description,
          event_type: updates.event_type,
          style: updates.style,
          tags: updates.tags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inspirationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.inspirations],
      });
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.inspirations, 'detail', data.id],
      });
    },
  });
}

// ============================================
// Hook pour supprimer une inspiration
// ============================================

export function useDeleteInspiration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inspirationId: string) => {
      // 1. Recuperer les images pour les supprimer du storage
      const { data: images } = await fromTable('inspiration_images')
        .select('image_url')
        .eq('inspiration_id', inspirationId);

      // 2. Supprimer les images du storage
      if (images && (images as any[]).length > 0) {
        const filePaths = (images as any[])
          .map((img) => {
            const url = img.image_url;
            const match = url.match(/inspirations\/(.+)$/);
            return match ? match[1] : null;
          })
          .filter((path): path is string => path !== null);

        if (filePaths.length > 0) {
          await supabase.storage.from('inspirations').remove(filePaths);
        }
      }

      // 3. Supprimer l'inspiration (cascade delete les images et favoris)
      const { error } = await fromTable('inspirations')
        .delete()
        .eq('id', inspirationId);

      if (error) throw error;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.inspirations],
      });
    },
  });
}

// ============================================
// Hook pour ajouter des images a une inspiration existante
// ============================================

interface AddImagesParams {
  inspirationId: string;
  images: InspirationImageInput[];
}

export function useAddInspirationImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inspirationId, images }: AddImagesParams) => {
      // Obtenir le display_order max actuel
      const { data: existingImages } = await fromTable('inspiration_images')
        .select('display_order')
        .eq('inspiration_id', inspirationId)
        .order('display_order', { ascending: false })
        .limit(1);

      const startOrder = (existingImages as any[])?.[0]?.display_order ?? -1;

      // Upload et creer les entries
      const uploadedImages = await Promise.all(
        images.map(async (image, index) => {
          const fileName = `${inspirationId}/${Date.now()}_${index}.jpg`;

          const base64 = await FileSystem.readAsStringAsync(image.uri, {
            encoding: 'base64' as const,
          });

          const { error: uploadError } = await supabase.storage
            .from('inspirations')
            .upload(fileName, base64ToArrayBuffer(base64), {
              contentType: 'image/jpeg',
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('inspirations')
            .getPublicUrl(fileName);

          return {
            inspiration_id: inspirationId,
            image_url: urlData.publicUrl,
            thumbnail_url: urlData.publicUrl,
            width: image.width || null,
            height: image.height || null,
            display_order: startOrder + 1 + index,
          };
        })
      );

      const { data, error } = await fromTable('inspiration_images')
        .insert(uploadedImages)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.inspirations, 'detail', variables.inspirationId],
      });
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.inspirations],
      });
    },
  });
}

// ============================================
// Hook pour supprimer une image d'une inspiration
// ============================================

export function useDeleteInspirationImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ imageId, imageUrl }: { imageId: string; imageUrl: string }) => {
      // Supprimer du storage
      const match = imageUrl.match(/inspirations\/(.+)$/);
      if (match) {
        await supabase.storage.from('inspirations').remove([match[1]]);
      }

      // Supprimer de la table
      const { error } = await fromTable('inspiration_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.inspirations],
      });
    },
  });
}
