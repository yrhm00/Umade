/**
 * Chat Input Component
 * Dark Mode Support
 * Support for pending inspiration attachment
 * Support for image sharing + quick reply templates (providers)
 */

import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { uploadChatImage } from '@/lib/chatImageUpload';
import { useChatStore } from '@/stores/chatStore';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon, Send, Sparkles, X, Zap } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { toast } from '@/lib/toast';
import { InspirationContextData } from './InspirationContextCard';
import { QuickReplySheet } from './QuickReplySheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

interface ChatInputProps {
  conversationId: string;
  onSend: (message: string) => void;
  disabled?: boolean;
  pendingInspiration?: InspirationContextData | null;
  onClearInspiration?: () => void;
  isProvider?: boolean;
}

export function ChatInput({
  conversationId,
  onSend,
  disabled,
  pendingInspiration,
  onClearInspiration,
  isProvider = false,
}: ChatInputProps) {
  const { getDraft, setDraft, clearDraft } = useChatStore();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const [text, setText] = useState(getDraft(conversationId));
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const quickReplyRef = useRef<BottomSheetModal>(null);

  const handleChangeText = useCallback(
    (value: string) => {
      setText(value);
      setDraft(conversationId, value);
    },
    [conversationId, setDraft]
  );

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setPendingImage(result.assets[0].uri);
      }
    } catch {
      // Silently fail if picker is cancelled or errors
    }
  }, []);

  const handleClearImage = useCallback(() => {
    setPendingImage(null);
  }, []);

  const handleSend = useCallback(async () => {
    if (disabled || isUploading) return;

    const trimmed = text.trim();

    // If there's a pending image, upload and send
    if (pendingImage) {
      setIsUploading(true);
      try {
        const { image_url, thumbnail_url } = await uploadChatImage(conversationId, pendingImage);
        const imageMessage = JSON.stringify({
          type: 'chat_image',
          image_url,
          thumbnail_url,
          caption: trimmed || undefined,
        });
        onSend(imageMessage);
        setText('');
        clearDraft(conversationId);
        setPendingImage(null);
      } catch (error) {
        // Sans ce log, l'erreur réelle de Storage (bucket manquant, RLS,
        // taille, type MIME) est invisible et le bug indiagnosticable.
        if (__DEV__) console.error('[ChatInput] upload image échoué:', error);
        toast.error("L'image n'a pas pu être envoyée. Réessaie dans quelques instants.");
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // If there's a pending inspiration, send it (with optional message)
    if (pendingInspiration) {
      const contextMessage = JSON.stringify({
        ...pendingInspiration,
        message: trimmed || undefined,
      });
      onSend(contextMessage);
      setText('');
      clearDraft(conversationId);
      onClearInspiration?.();
      return;
    }

    // Regular text message
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    clearDraft(conversationId);
  }, [text, disabled, isUploading, onSend, conversationId, clearDraft, pendingInspiration, onClearInspiration, pendingImage]);

  const handleQuickReplySelect = useCallback(
    (content: string) => {
      setText(content);
      setDraft(conversationId, content);
      quickReplyRef.current?.dismiss();
    },
    [conversationId, setDraft]
  );

  // Can send if there's text OR a pending inspiration/image
  const canSend = (text.trim().length > 0 || !!pendingInspiration || !!pendingImage) && !disabled && !isUploading;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {/* Pending Inspiration Preview */}
      {pendingInspiration && (
        <View
          style={[
            styles.attachmentPreview,
            {
              backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.attachmentContent}>
            <Image
              source={{ uri: pendingInspiration.image_url }}
              style={styles.attachmentImage}
              contentFit="cover"
            />
            <View style={styles.attachmentInfo}>
              <View style={styles.attachmentHeader}>
                <Sparkles size={12} color={colors.primary} />
                <Text style={[styles.attachmentLabel, { color: colors.primary }]}>
                  Inspiration
                </Text>
              </View>
              <Text
                style={[styles.attachmentTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {pendingInspiration.title || 'Publication'}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClearInspiration}
            style={[styles.removeButton, { backgroundColor: isDark ? colors.background : colors.backgroundTertiary }]}
            hitSlop={8}
          >
            <X size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
      )}

      {/* Pending Image Preview */}
      {pendingImage && (
        <View
          style={[
            styles.attachmentPreview,
            {
              backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.attachmentContent}>
            <Image
              source={{ uri: pendingImage }}
              style={styles.attachmentImage}
              contentFit="cover"
            />
            <View style={styles.attachmentInfo}>
              <View style={styles.attachmentHeader}>
                <ImageIcon size={12} color={colors.primary} />
                <Text style={[styles.attachmentLabel, { color: colors.primary }]}>
                  Photo
                </Text>
              </View>
              <Text
                style={[styles.attachmentTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                Image sélectionnée
              </Text>
            </View>
          </View>
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: Layout.spacing.sm }} />
          ) : (
            <Pressable
              onPress={handleClearImage}
              style={[styles.removeButton, { backgroundColor: isDark ? colors.background : colors.backgroundTertiary }]}
              hitSlop={8}
            >
              <X size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      )}

      {/* Input Row */}
      <View style={styles.container}>
        {/* Quick Reply button (providers only) */}
        {isProvider && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.backgroundTertiary }]}
            onPress={() => quickReplyRef.current?.present()}
            disabled={disabled}
            accessibilityLabel="Réponses rapides"
            accessibilityRole="button"
          >
            <Zap size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Camera/Image button */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.backgroundTertiary }]}
          onPress={handlePickImage}
          disabled={disabled || isUploading}
          accessibilityLabel="Joindre une photo"
          accessibilityRole="button"
        >
          <Camera size={20} color={disabled || isUploading ? colors.textTertiary : colors.textSecondary} />
        </TouchableOpacity>

        <View style={[styles.inputContainer, { backgroundColor: colors.backgroundTertiary }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={text}
            onChangeText={handleChangeText}
            placeholder={
              isUploading
                ? 'Envoi en cours...'
                : pendingImage
                ? 'Ajouter une légende (optionnel)...'
                : pendingInspiration
                ? 'Ajouter un message (optionnel)...'
                : 'Votre message...'
            }
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={1000}
            editable={!disabled && !isUploading}
            accessibilityLabel="Champ de message"
          />
          {text.length > 900 && (
            <Text style={[styles.charCounter, { color: text.length >= 990 ? colors.error : colors.textTertiary }]}>
              {1000 - text.length}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colors.backgroundTertiary },
            canSend && { backgroundColor: colors.primary },
          ]}
          onPress={handleSend}
          disabled={!canSend}
          accessibilityLabel={isUploading ? 'Envoi en cours' : 'Envoyer le message'}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSend, busy: isUploading }}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send size={22} color={canSend ? '#FFFFFF' : colors.textTertiary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Reply Sheet (providers only) */}
      {isProvider && (
        <QuickReplySheet
          ref={quickReplyRef}
          onSelectTemplate={handleQuickReplySelect}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
  },
  attachmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Layout.spacing.sm,
  },
  attachmentImage: {
    width: 48,
    height: 48,
    borderRadius: Layout.radius.md,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attachmentLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attachmentTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Layout.spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    borderRadius: Layout.radius.lg,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    maxHeight: 120,
  },
  input: {
    fontSize: Layout.fontSize.md,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charCounter: {
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 2,
    paddingBottom: 2,
  },
});
