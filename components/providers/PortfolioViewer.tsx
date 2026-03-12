/**
 * Visionneuse fullscreen du portfolio prestataire
 */

import { Button } from '@/components/ui/Button';
import { Layout } from '@/constants/Layout';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PortfolioViewerImage {
  id: string;
  image_url: string;
  thumbnail_url?: string | null;
}

interface PortfolioViewerProps {
  visible: boolean;
  images: PortfolioViewerImage[];
  initialIndex?: number;
  onClose: () => void;
  onContact: () => void;
}

const MAX_SCALE = 4;

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.max(min, Math.min(value, max));
}

function ZoomableSlide({ uri }: { uri: string }) {
  const scale = useSharedValue(1);
  const baseScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const baseTx = useSharedValue(0);
  const baseTy = useSharedValue(0);

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onUpdate((event) => {
          scale.value = clamp(baseScale.value * event.scale, 1, MAX_SCALE);
        })
        .onEnd(() => {
          if (scale.value <= 1.01) {
            scale.value = withTiming(1);
            baseScale.value = 1;
            tx.value = withTiming(0);
            ty.value = withTiming(0);
            baseTx.value = 0;
            baseTy.value = 0;
            return;
          }
          baseScale.value = scale.value;
        }),
    [baseScale, baseTx, baseTy, scale, tx, ty]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((event) => {
          if (scale.value <= 1) return;
          const maxOffset = ((scale.value - 1) * Layout.window.width) / 2;
          tx.value = clamp(baseTx.value + event.translationX, -maxOffset, maxOffset);
          ty.value = clamp(baseTy.value + event.translationY, -maxOffset, maxOffset);
        })
        .onEnd(() => {
          if (scale.value <= 1) {
            tx.value = withTiming(0);
            ty.value = withTiming(0);
            baseTx.value = 0;
            baseTy.value = 0;
            return;
          }
          baseTx.value = tx.value;
          baseTy.value = ty.value;
        }),
    [baseTx, baseTy, scale, tx, ty]
  );

  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
          if (scale.value > 1) {
            scale.value = withTiming(1, { duration: 170 });
            baseScale.value = 1;
            tx.value = withTiming(0, { duration: 170 });
            ty.value = withTiming(0, { duration: 170 });
            baseTx.value = 0;
            baseTy.value = 0;
          } else {
            scale.value = withTiming(2, { duration: 170 });
            baseScale.value = 2;
          }
        }),
    [baseScale, baseTx, baseTy, scale, tx, ty]
  );

  const gesture = useMemo(
    () => Gesture.Simultaneous(doubleTapGesture, pinchGesture, panGesture),
    [doubleTapGesture, pinchGesture, panGesture]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.slideInner, animatedStyle]}>
        <Image source={{ uri }} style={styles.fullscreenImage} contentFit="contain" transition={180} placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }} />
      </Animated.View>
    </GestureDetector>
  );
}

export function PortfolioViewer({
  visible,
  images,
  initialIndex = 0,
  onClose,
  onContact,
}: PortfolioViewerProps) {
  const listRef = useRef<FlatList<PortfolioViewerImage>>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible) return;

    setCurrentIndex(initialIndex);
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    }, 30);

    return () => clearTimeout(timer);
  }, [initialIndex, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View entering={FadeIn.duration(170)} exiting={FadeOut.duration(140)} style={styles.overlay}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.headerRow}>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}>
              <X size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <FlatList
            ref={listRef}
            data={images}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              index,
              length: Layout.window.width,
              offset: Layout.window.width * index,
            })}
            onMomentumScrollEnd={(event) => {
              const next = Math.round(event.nativeEvent.contentOffset.x / Layout.window.width);
              setCurrentIndex(next);
            }}
            renderItem={({ item }) => (
              <View style={styles.slide}>
                <ZoomableSlide uri={item.image_url} />
              </View>
            )}
          />

          <View style={styles.counterChip} pointerEvents="none">
            <Animated.Text style={styles.counterText}>
              {currentIndex + 1}/{images.length}
            </Animated.Text>
          </View>

          <View style={styles.contactFloating}>
            <Button title="Contacter" onPress={onContact} size="lg" />
          </View>
        </SafeAreaView>
      </Animated.View>
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
  headerRow: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
    alignItems: 'flex-start',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    width: Layout.window.width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideInner: {
    width: Layout.window.width,
    height: Layout.window.height * 0.74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: Layout.window.width,
    height: Layout.window.height * 0.74,
  },
  counterChip: {
    position: 'absolute',
    top: Layout.spacing.lg + 4,
    right: Layout.spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Layout.radius.full,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  contactFloating: {
    position: 'absolute',
    left: Layout.spacing.lg,
    right: Layout.spacing.lg,
    bottom: Layout.spacing.lg,
  },
});
