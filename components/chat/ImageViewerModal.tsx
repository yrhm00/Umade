/**
 * Visionneuse image plein écran (chat)
 */

import { Layout } from '@/constants/Layout';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ImageViewerModalProps {
  visible: boolean;
  imageUrl: string;
  caption?: string | null;
  onClose: () => void;
}

const MAX_SCALE = 4;

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.max(min, Math.min(value, max));
}

export function ImageViewerModal({
  visible,
  imageUrl,
  caption,
  onClose,
}: ImageViewerModalProps) {
  const scale = useSharedValue(1);
  const baseScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const baseTranslateX = useSharedValue(0);
  const baseTranslateY = useSharedValue(0);

  const resetTransform = () => {
    scale.value = withTiming(1, { duration: 180 });
    baseScale.value = 1;
    translateX.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(0, { duration: 180 });
    baseTranslateX.value = 0;
    baseTranslateY.value = 0;
  };

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onUpdate((event) => {
          const next = clamp(baseScale.value * event.scale, 1, MAX_SCALE);
          scale.value = next;
        })
        .onEnd(() => {
          if (scale.value <= 1.01) {
            scale.value = withTiming(1);
            baseScale.value = 1;
            translateX.value = withTiming(0);
            translateY.value = withTiming(0);
            baseTranslateX.value = 0;
            baseTranslateY.value = 0;
            return;
          }
          baseScale.value = scale.value;
        }),
    [baseScale, baseTranslateX, baseTranslateY, scale, translateX, translateY]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((event) => {
          if (scale.value <= 1) return;

          const maxOffset = ((scale.value - 1) * Layout.window.width) / 2;
          translateX.value = clamp(baseTranslateX.value + event.translationX, -maxOffset, maxOffset);
          translateY.value = clamp(baseTranslateY.value + event.translationY, -maxOffset, maxOffset);
        })
        .onEnd(() => {
          if (scale.value <= 1) {
            translateX.value = withTiming(0);
            translateY.value = withTiming(0);
            baseTranslateX.value = 0;
            baseTranslateY.value = 0;
            return;
          }

          baseTranslateX.value = translateX.value;
          baseTranslateY.value = translateY.value;
        }),
    [baseTranslateX, baseTranslateY, scale, translateX, translateY]
  );

  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
          if (scale.value > 1) {
            scale.value = withTiming(1, { duration: 180 });
            baseScale.value = 1;
            translateX.value = withTiming(0, { duration: 180 });
            translateY.value = withTiming(0, { duration: 180 });
            baseTranslateX.value = 0;
            baseTranslateY.value = 0;
          } else {
            scale.value = withTiming(2, { duration: 180 });
            baseScale.value = 2;
          }
        }),
    [baseScale, baseTranslateX, baseTranslateY, scale, translateX, translateY]
  );

  const composedGesture = useMemo(
    () => Gesture.Simultaneous(doubleTapGesture, pinchGesture, panGesture),
    [doubleTapGesture, pinchGesture, panGesture]
  );

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleClose = () => {
    resetTransform();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={12}>
              <X size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.imageStage}>
            <GestureDetector gesture={composedGesture}>
              <Animated.View style={[styles.imageAnimatedContainer, imageAnimatedStyle]}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  contentFit="contain"
                  transition={180}
                  placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
                />
              </Animated.View>
            </GestureDetector>
          </View>

          {!!caption && (
            <View style={styles.captionContainer}>
              <Text style={styles.captionText}>{caption}</Text>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageAnimatedContainer: {
    width: Layout.window.width,
    height: Layout.window.height * 0.72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: Layout.window.width,
    height: Layout.window.height * 0.72,
  },
  captionContainer: {
    paddingHorizontal: Layout.spacing.xl,
    paddingTop: Layout.spacing.sm,
    paddingBottom: Layout.spacing.lg,
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: Layout.fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});
