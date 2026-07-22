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
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  // Track zoom state on JS side so the pan gesture can be enabled only
  // while the image is actually zoomed in — otherwise the surrounding
  // FlatList must keep its swipe-to-paginate behavior.
  const [isZoomed, setIsZoomed] = useState(false);

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
            runOnJS(setIsZoomed)(false);
            return;
          }
          baseScale.value = scale.value;
          runOnJS(setIsZoomed)(true);
        }),
    [baseScale, baseTx, baseTy, scale, tx, ty]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isZoomed)
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
    [baseTx, baseTy, scale, tx, ty, isZoomed]
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
            runOnJS(setIsZoomed)(false);
          } else {
            scale.value = withTiming(2, { duration: 170 });
            baseScale.value = 2;
            runOnJS(setIsZoomed)(true);
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
  const insets = useSafeAreaInsets();

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
        <View style={styles.safeArea}>
          <View
            style={[
              styles.headerRow,
              // Marges appliquées à la main : un SafeAreaView placé dans un
              // Modal est rendu hors du SafeAreaProvider et ne reçoit pas
              // toujours les bons insets — la croix passait alors sous
              // l'heure et la batterie.
              { paddingTop: Math.max(insets.top, 12) + Layout.spacing.sm },
            ]}
          >
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}>
              <X size={22} color="#FFFFFF" />
            </Pressable>
            {images.length > 1 ? (
              <View style={styles.counterChip}>
                <Text style={styles.counterText}>
                  {currentIndex + 1} / {images.length}
                </Text>
              </View>
            ) : null}
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

          <View
            style={[
              styles.contactFloating,
              { bottom: Math.max(insets.bottom, Layout.spacing.lg) },
            ]}
          >
            <Button title="Contacter" onPress={onContact} size="lg" />
          </View>
        </View>
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
    // paddingTop est fourni en ligne à partir des insets réels.
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Layout.radius.full,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  contactFloating: {
    // bottom est fourni en ligne à partir des insets réels.
    position: 'absolute',
    left: Layout.spacing.lg,
    right: Layout.spacing.lg,
  },
});
