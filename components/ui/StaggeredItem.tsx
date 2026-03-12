import React from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface StaggeredItemProps {
  children: React.ReactNode;
  index: number;
  delay?: number;
  duration?: number;
}

export function StaggeredItem({
  children,
  index,
  delay = 40,
  duration = 280,
}: StaggeredItemProps) {
  return (
    <Animated.View entering={FadeInUp.delay(index * delay).duration(duration)}>
      {children}
    </Animated.View>
  );
}
