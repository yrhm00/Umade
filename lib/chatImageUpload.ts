/**
 * Helper pour l'upload d'images dans le chat
 * Upload vers Supabase Storage bucket "chat-images"
 */

import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function generateImageId(): string {
  const uuidFactory = (globalThis as any)?.crypto?.randomUUID;
  if (typeof uuidFactory === 'function') {
    return uuidFactory();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 12)}`;
}

export interface ChatImageUploadResult {
  image_url: string;
  thumbnail_url: string;
}

/**
 * Upload une image de chat vers Supabase Storage
 * @param conversationId ID de la conversation
 * @param imageUri URI locale de l'image (file:// ou content://)
 * @returns URL publique de l'image
 */
export async function uploadChatImage(
  conversationId: string,
  imageUri: string
): Promise<ChatImageUploadResult> {
  // Lire l'image en base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const imageId = generateImageId();
  const fileName = `${conversationId}/${imageId}.jpg`;

  // Upload vers Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('chat-images')
    .upload(fileName, base64ToArrayBuffer(base64), {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Erreur upload image: ${uploadError.message}`);
  }

  // Récupérer l'URL publique
  const { data: urlData } = supabase.storage
    .from('chat-images')
    .getPublicUrl(fileName);

  return {
    image_url: urlData.publicUrl,
    thumbnail_url: urlData.publicUrl,
  };
}
