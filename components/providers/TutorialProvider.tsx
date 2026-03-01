/**
 * Provider pour gérer le tutoriel in-app
 * Affiche les tooltips au bon moment
 */

import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tooltip } from '@/components/ui/Tooltip';
import { useTutorialStore, TUTORIAL_CONTENT, TutorialStep } from '@/stores/tutorialStore';
import { usePathname } from 'expo-router';

interface TutorialProviderProps {
  children: React.ReactNode;
}

// Mapping des routes aux steps de tutorial
const ROUTE_STEPS: Record<string, TutorialStep[]> = {
  '/(tabs)': ['welcome', 'home_search'],
  '/(tabs)/index': ['welcome', 'home_search'],
  '/(tabs)/search': ['home_filters'],
  '/(tabs)/profile': ['profile_settings'],
  '/provider/': ['provider_book'],
  '/chat/': ['chat_intro'],
};

export function TutorialProvider({ children }: TutorialProviderProps) {
  const pathname = usePathname();
  const {
    activeTooltip,
    showTooltip,
    hideTooltip,
    completeStep,
    shouldShowStep,
    isEnabled,
  } = useTutorialStore();

  // Trigger tooltips based on route
  useEffect(() => {
    if (!isEnabled) return;

    // Find matching route
    for (const [route, steps] of Object.entries(ROUTE_STEPS)) {
      if (pathname.startsWith(route) || pathname === route) {
        // Find first uncompleted step for this route
        const nextStep = steps.find((step) => shouldShowStep(step));
        if (nextStep && !activeTooltip) {
          // Delay to allow screen to render
          const timer = setTimeout(() => {
            showTooltip(nextStep);
          }, 1000);
          return () => clearTimeout(timer);
        }
        break;
      }
    }
  }, [pathname, isEnabled, activeTooltip]);

  const handleDismiss = useCallback(() => {
    if (activeTooltip) {
      completeStep(activeTooltip);
    }
  }, [activeTooltip, completeStep]);

  // Get tooltip content if active
  const tooltipContent = activeTooltip ? TUTORIAL_CONTENT[activeTooltip] : null;

  return (
    <View style={styles.container}>
      {children}

      {/* Render tooltip overlay */}
      {activeTooltip && tooltipContent && (
        <Tooltip
          title={tooltipContent.title}
          description={tooltipContent.description}
          position={tooltipContent.position}
          onDismiss={handleDismiss}
          visible={true}
          // Default center position if no target specified
          targetX={150}
          targetY={200}
          targetWidth={100}
          targetHeight={50}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
