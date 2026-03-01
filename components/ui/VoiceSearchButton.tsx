/**
 * Bouton de recherche vocale
 * Utilise l'API Web Speech sur web, affiche un indicateur sur mobile
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Mic, MicOff } from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';

interface VoiceSearchButtonProps {
  onResult: (text: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  size?: number;
  disabled?: boolean;
}

// Type for Web Speech API
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function VoiceSearchButton({
  onResult,
  onListeningChange,
  size = 40,
  disabled = false,
}: VoiceSearchButtonProps) {
  const colors = useColors();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  // Check for Web Speech API support
  useEffect(() => {
    if (Platform.OS === 'web') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'fr-FR';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const results = event.results;
          const lastResult = results[results.length - 1];
          if (lastResult.isFinal) {
            const transcript = lastResult[0].transcript;
            onResult(transcript);
            stopListening();
          }
        };

        recognition.onerror = (event: { error: string }) => {
          console.log('Speech recognition error:', event.error);
          stopListening();
        };

        recognition.onend = () => {
          stopListening();
        };

        recognitionRef.current = recognition;
      }
    } else {
      // On mobile, we could implement expo-av recording
      // For now, just show the button as disabled
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Animate pulse when listening
  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 600 }),
          withTiming(0, { duration: 600 })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isListening]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        onListeningChange?.(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.log('Error starting speech recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        // Ignore errors on stop
      }
    }
    setIsListening(false);
    onListeningChange?.(false);
  };

  const handlePress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const iconColor = isListening
    ? colors.error
    : isSupported
      ? colors.primary
      : colors.textTertiary;

  if (!isSupported && Platform.OS !== 'web') {
    // Don't show button on mobile if not supported
    return null;
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || !isSupported}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isListening
            ? `${colors.error}15`
            : `${colors.primary}10`,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {/* Pulse effect */}
      <Animated.View
        style={[
          styles.pulse,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.error,
          },
          pulseStyle,
        ]}
      />

      {/* Icon */}
      <View style={styles.iconContainer}>
        {isListening ? (
          <MicOff size={size * 0.5} color={iconColor} />
        ) : (
          <Mic size={size * 0.5} color={iconColor} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulse: {
    position: 'absolute',
  },
  iconContainer: {
    position: 'absolute',
  },
});
