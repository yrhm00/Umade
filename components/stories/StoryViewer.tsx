/**
 * StoryViewer - Visualiseur de stories fullscreen
 * Avec progress bars, gestures et navigation
 */

import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { useMarkStoryViewed } from '@/hooks/useStories';
import { ProviderStoriesGroup } from '@/types/story';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StoryViewerProps {
  visible: boolean;
  storiesGroup: ProviderStoriesGroup;
  onClose: () => void;
  onNextGroup: () => void;
  onPreviousGroup: () => void;
  hasNextGroup: boolean;
  hasPreviousGroup: boolean;
}

export function StoryViewer({
  visible,
  storiesGroup,
  onClose,
  onNextGroup,
  onPreviousGroup,
  hasNextGroup,
  hasPreviousGroup,
}: StoryViewerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progress = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { mutate: markViewed } = useMarkStoryViewed();

  const stories = storiesGroup.stories;
  const currentStory = stories[currentIndex];

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Mark story as viewed
  useEffect(() => {
    if (currentStory) {
      markViewed(currentStory.id);
    }
  }, [currentStory?.id, markViewed, visible]);

  // Handle story progression
  const startTimer = useCallback(
    (resetProgress: boolean) => {
      if (!visible || !currentStory) return;

      clearTimer();

      const durationMs = (currentStory.duration_seconds || 5) * 1000;

      if (resetProgress) {
        progress.value = 0;
      }

      const remainingMs = Math.max(0, durationMs * (1 - progress.value));

      // Animate progress bar
      progress.value = withTiming(1, { duration: remainingMs });

      timerRef.current = setTimeout(() => {
        if (currentIndex < stories.length - 1) {
          setCurrentIndex((i) => i + 1);
        } else if (hasNextGroup) {
          onNextGroup();
        } else {
          onClose();
        }
      }, remainingMs);
    },
    [clearTimer, currentIndex, currentStory, hasNextGroup, onClose, onNextGroup, progress, stories.length, visible]
  );

  const pauseTimer = useCallback(() => {
    clearTimer();
    cancelAnimation(progress);
    setIsPaused(true);
  }, [clearTimer, progress]);

  const resumeTimer = useCallback(() => {
    setIsPaused(false);
    startTimer(false);
  }, [startTimer]);

  // Reset on story change / visibility
  useEffect(() => {
    if (!visible) {
      clearTimer();
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }

    setIsPaused(false);
    startTimer(true);

    return () => {
      clearTimer();
    };
  }, [clearTimer, progress, startTimer, visible, currentIndex, storiesGroup.provider.id]);

  // Reset index when group changes
  useEffect(() => {
    setCurrentIndex(0);
    progress.value = 0;
  }, [storiesGroup.provider.id]);

  // Handle tap navigation
  const handleTap = useCallback(
    (x: number) => {
      const isLeftSide = x < SCREEN_WIDTH / 3;
      const isRightSide = x > (SCREEN_WIDTH * 2) / 3;

      if (isLeftSide) {
        // Go to previous story
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        } else if (hasPreviousGroup) {
          onPreviousGroup();
        }
      } else if (isRightSide) {
        // Go to next story
        if (currentIndex < stories.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else if (hasNextGroup) {
          onNextGroup();
        } else {
          onClose();
        }
      }
    },
    [currentIndex, hasNextGroup, hasPreviousGroup, onClose, onNextGroup, onPreviousGroup, stories.length]
  );

  // Gestures
  const tapGesture = Gesture.Tap()
    .onEnd((event) => {
      runOnJS(handleTap)(event.x);
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(200)
    .onStart(() => {
      runOnJS(pauseTimer)();
    })
    .onEnd(() => {
      runOnJS(resumeTimer)();
    });

  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationY > 100) {
        runOnJS(onClose)();
      }
    });

  const composedGestures = Gesture.Race(
    longPressGesture,
    Gesture.Simultaneous(tapGesture, panGesture)
  );

  const handleProviderPress = useCallback(() => {
    onClose();
    router.push(`/provider/${storiesGroup.provider.id}` as any);
  }, [onClose, storiesGroup.provider.id]);

  if (!currentStory) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.storyContainer}>
          {/* Gestures only on the story content so header buttons stay tappable */}
          <GestureDetector gesture={composedGestures}>
            <View style={StyleSheet.absoluteFill}>
              {/* Story Image */}
              <Image
                source={{ uri: currentStory.media_url }}
                style={styles.storyImage}
                contentFit="cover"
              />

              {/* Overlay gradient */}
              <LinearGradient
                colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
                style={styles.topOverlay}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
                style={styles.bottomOverlay}
                pointerEvents="none"
              />
            </View>
          </GestureDetector>

          {/* UI overlay (must not be wrapped by GestureDetector) */}
          <View style={[StyleSheet.absoluteFill, styles.uiOverlay]} pointerEvents="box-none">
            {/* Progress bars */}
            <View
              style={[styles.progressContainer, { top: insets.top + 10 }]}
              pointerEvents="none"
            >
              {stories.map((_, index) => (
                <ProgressBar
                  key={index}
                  index={index}
                  currentIndex={currentIndex}
                  progress={progress}
                />
              ))}
            </View>

            {/* Header */}
            <View style={[styles.header, { top: insets.top + 28 }]} pointerEvents="box-none">
              <Pressable
                onPress={handleProviderPress}
                style={styles.providerInfo}
                hitSlop={8}
              >
                <Avatar
                  source={storiesGroup.provider.avatar_url}
                  name={storiesGroup.provider.business_name}
                  size="sm"
                />
                <View style={styles.providerText}>
                  <Text style={styles.providerName}>
                    {storiesGroup.provider.business_name}
                  </Text>
                  <Text style={styles.storyTime}>
                    {getTimeAgo(currentStory.created_at)}
                  </Text>
                </View>
              </Pressable>

              <Pressable onPress={onClose} style={styles.closeButton} hitSlop={10}>
                <X size={24} color={Colors.white} />
              </Pressable>
            </View>

            {/* Caption */}
            {currentStory.caption && (
              <View style={styles.captionContainer} pointerEvents="none">
                <BlurView intensity={30} tint="dark" style={styles.captionBlur}>
                  <Text style={styles.caption}>{currentStory.caption}</Text>
                </BlurView>
              </View>
            )}

            {/* Pause indicator */}
            {isPaused && (
              <View style={styles.pausedIndicator} pointerEvents="none">
                <Text style={styles.pausedText}>En pause</Text>
              </View>
            )}
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

// Progress bar component
function ProgressBar({
  index,
  currentIndex,
  progress,
}: {
  index: number;
  currentIndex: number;
  progress: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const value =
      index < currentIndex ? 1 : index === currentIndex ? progress.value : 0;
    return { width: `${value * 100}%` };
  }, [index, currentIndex]);

  return (
    <View style={styles.progressBarContainer}>
      <Animated.View style={[styles.progressBar, animatedStyle]} />
    </View>
  );
}

// Helper to get time ago string
function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return 'Il y a 1j';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  storyContainer: {
    flex: 1,
  },
  storyImage: {
    ...StyleSheet.absoluteFillObject,
  },
  uiOverlay: {
    // Keep this view on top of the media and avoid blocking gestures outside buttons
    zIndex: 10,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  progressContainer: {
    position: 'absolute',
    left: Layout.spacing.md,
    right: Layout.spacing.md,
    flexDirection: 'row',
    gap: 4,
  },
  progressBarContainer: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  header: {
    position: 'absolute',
    left: Layout.spacing.md,
    right: Layout.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  providerText: {
    gap: 2,
  },
  providerName: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  storyTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 80,
    left: Layout.spacing.md,
    right: Layout.spacing.md,
  },
  captionBlur: {
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    overflow: 'hidden',
  },
  caption: {
    color: Colors.white,
    fontSize: 15,
    lineHeight: 22,
  },
  pausedIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -15 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.md,
  },
  pausedText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
});
