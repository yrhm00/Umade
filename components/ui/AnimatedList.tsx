import React, { useCallback } from 'react';
import {
  FlatList,
  FlatListProps,
  ViewStyle,
  ListRenderItem,
  RefreshControl,
} from 'react-native';
import Animated, {
  FadeInDown,
  Layout as ReanimatedLayout,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { Animations } from '@/constants/Animations';

interface AnimatedListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  renderItem: (info: { item: T; index: number }) => React.ReactElement;
  staggerDelay?: number;
  itemContainerStyle?: ViewStyle;
  animateOnMount?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function AnimatedList<T>({
  renderItem,
  staggerDelay = Animations.stagger.normal,
  itemContainerStyle,
  animateOnMount = true,
  refreshing,
  onRefresh,
  ...props
}: AnimatedListProps<T>) {
  const animatedRenderItem: ListRenderItem<T> = useCallback(
    ({ item, index }) => {
      const enteringAnimation = animateOnMount
        ? FadeInDown.delay(index * staggerDelay)
            .springify()
            .damping(15)
        : undefined;

      return (
        <Animated.View
          entering={enteringAnimation}
          layout={ReanimatedLayout.springify()}
          style={itemContainerStyle}
        >
          {renderItem({ item, index })}
        </Animated.View>
      );
    },
    [renderItem, staggerDelay, itemContainerStyle, animateOnMount]
  );

  return (
    <FlatList
      {...props}
      renderItem={animatedRenderItem}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing || false}
            onRefresh={onRefresh}
            tintColor={Colors.primary.DEFAULT}
            colors={[Colors.primary.DEFAULT]}
          />
        ) : undefined
      }
    />
  );
}

// AnimatedFlatList with generic type inference
export function createAnimatedList<T>() {
  return function TypedAnimatedList(props: AnimatedListProps<T>) {
    return <AnimatedList<T> {...props} />;
  };
}
