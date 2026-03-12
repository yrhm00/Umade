/**
 * Bulle image du chat
 */

import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { MessageWithSender } from '@/types';
import { Image } from 'expo-image';
import { Check, CheckCheck } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ImageViewerModal } from './ImageViewerModal';

export interface ChatImageData {
  type: 'chat_image';
  image_url: string;
  thumbnail_url?: string;
  caption?: string;
}

export function parseChatImage(content: string): ChatImageData | null {
  try {
    const parsed = JSON.parse(content);
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.type === 'chat_image' &&
      typeof parsed.image_url === 'string' &&
      parsed.image_url.length > 0
    ) {
      return {
        type: 'chat_image',
        image_url: parsed.image_url,
        thumbnail_url: parsed.thumbnail_url,
        caption: parsed.caption,
      };
    }
    return null;
  } catch {
    return null;
  }
}

interface ChatImageMessageProps {
  data: ChatImageData;
  message: MessageWithSender;
  isOwn: boolean;
}

export function ChatImageMessage({ data, message, isOwn }: ChatImageMessageProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const shimmerOpacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (isLoaded) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerOpacity, {
          toValue: 0.85,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerOpacity, {
          toValue: 0.35,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => {
      loop.stop();
    };
  }, [isLoaded, shimmerOpacity]);

  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString('fr-BE', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const metaColor = data.caption
    ? isOwn
      ? 'rgba(255,255,255,0.74)'
      : colors.textTertiary
    : '#FFFFFF';

  return (
    <>
      <View style={[styles.row, isOwn && styles.rowOwn]}>
        <Pressable
          onPress={() => setViewerVisible(true)}
          style={[
            styles.card,
            {
              backgroundColor: isOwn
                ? colors.primary
                : isDark
                ? colors.card
                : colors.backgroundSecondary,
            },
          ]}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: data.image_url }}
              style={styles.image}
              contentFit="cover"
              transition={180}
              placeholder={
                data.thumbnail_url
                  ? { uri: data.thumbnail_url }
                  : { blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }
              }
              onLoadEnd={() => setIsLoaded(true)}
            />
            {!isLoaded && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.shimmer,
                  {
                    opacity: shimmerOpacity,
                    backgroundColor: isDark ? '#2A2438' : '#EAE5F5',
                  },
                ]}
              />
            )}
          </View>

          {!!data.caption && (
            <Text
              style={[styles.caption, { color: isOwn ? Colors.white : colors.text }]}
              numberOfLines={4}
            >
              {data.caption}
            </Text>
          )}

          <View style={styles.metaRow}>
            <Text style={[styles.time, { color: metaColor }]}>{time}</Text>
            {isOwn &&
              (message.read_at ? (
                <CheckCheck size={12} color={metaColor} />
              ) : (
                <Check size={12} color={metaColor} />
              ))}
          </View>
        </Pressable>
      </View>

      <ImageViewerModal
        visible={viewerVisible}
        imageUrl={data.image_url}
        caption={data.caption}
        onClose={() => setViewerVisible(false)}
      />
    </>
  );
}

const IMAGE_WIDTH = Math.min(Layout.window.width * 0.62, 220);
const IMAGE_HEIGHT = 260;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.md,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  card: {
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
    maxWidth: IMAGE_WIDTH,
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: '#E8E3F2',
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  caption: {
    fontSize: Layout.fontSize.md,
    lineHeight: 21,
    paddingHorizontal: Layout.spacing.sm,
    paddingTop: Layout.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.sm,
    paddingBottom: Layout.spacing.xs,
    paddingTop: 2,
  },
  time: {
    fontSize: 11,
  },
});
