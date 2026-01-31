import { Colors } from '@/constants/Colors';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Canvas, Group, LinearGradient, RoundedRect, Shadow, vec } from "@shopify/react-native-skia";
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function LiquidTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    // Use React state for layout width to avoid accessing shared value during render
    const [measuredWidth, setMeasuredWidth] = React.useState(0);

    // Shared values for animation
    const tabWidth = useSharedValue(0);
    const indicatorPosition = useSharedValue(0);

    const activeIndex = state.index;

    // Derived values for Skia
    const skiaPosition = useDerivedValue(() => {
        return indicatorPosition.value;
    });

    const skiaWidth = useDerivedValue(() => {
        return tabWidth.value > 0 ? tabWidth.value : 0;
    });

    const onLayout = (e: LayoutChangeEvent) => {
        const width = e.nativeEvent.layout.width;
        // Update measuring state
        setMeasuredWidth(width);
        // Update shared value
        tabWidth.value = width / state.routes.length;

        // Immediate update ensures no lag on initial load
        indicatorPosition.value = withSpring(activeIndex * (width / state.routes.length), {
            damping: 25,
            stiffness: 200,
            mass: 0.8,
        });
    };

    useEffect(() => {
        // Only run if we have a valid width
        if (measuredWidth > 0 && tabWidth.value > 0) {
            indicatorPosition.value = withSpring(activeIndex * tabWidth.value, {
                damping: 25,
                stiffness: 200,
                mass: 0.8,
            });
            // Haptic feedback on tab change
            if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        }
    }, [activeIndex, measuredWidth]);

    return (
        <View style={[styles.floatingContainer, { bottom: insets.bottom + 10 }]}>
            {/* 
                Floating Glass Background 
                Made "Ultra Glassy" by reducing opacity and using light tint
            */}
            <BlurView
                intensity={Platform.OS === 'ios' ? 40 : 0}
                tint="light"
                style={StyleSheet.absoluteFillObject}
            />
            {/* Fallback & tint overlay for cleaner glass look */}
            <View style={[StyleSheet.absoluteFillObject, styles.glassOverlay]} />

            <View style={styles.content} onLayout={onLayout}>
                {/* Skia Layer for "The Lens" */}
                {measuredWidth > 0 && (
                    <Canvas style={StyleSheet.absoluteFill}>
                        <Group>
                            {/* 1. Deep Shadow/Glow behind */}
                            <Group>
                                <Shadow dx={0} dy={2} blur={6} color="rgba(0,0,0,0.1)" />
                                <RoundedRect
                                    x={skiaPosition}
                                    y={5}
                                    width={skiaWidth}
                                    height={60}
                                    r={30}
                                    color="transparent"
                                />
                            </Group>

                            {/* 2. Glass Capsule Body */}
                            <RoundedRect
                                x={skiaPosition}
                                y={5}
                                width={skiaWidth}
                                height={60}
                                r={30}
                            >
                                {/* More transparent "Lens" look */}
                                <LinearGradient
                                    start={vec(0, 0)}
                                    end={vec(0, 60)}
                                    colors={["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.05)"]}
                                />
                            </RoundedRect>

                            {/* 3. Top Specular Edge */}
                            <RoundedRect
                                x={skiaPosition}
                                y={5}
                                width={skiaWidth}
                                height={60}
                                r={30}
                                style="stroke"
                                strokeWidth={1}
                            >
                                <LinearGradient
                                    start={vec(0, 6)}
                                    end={vec(0, 30)}
                                    colors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.0)"]}
                                />
                            </RoundedRect>

                            {/* 4. Bottom Reflection */}
                            <RoundedRect
                                x={skiaPosition}
                                y={5}
                                width={skiaWidth}
                                height={60}
                                r={30}
                                style="stroke"
                                strokeWidth={1}
                            >
                                <LinearGradient
                                    start={vec(0, 50)}
                                    end={vec(0, 64)}
                                    colors={["transparent", "rgba(255, 255, 255, 0.5)"]}
                                />
                            </RoundedRect>
                        </Group>
                    </Canvas>
                )}

                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    const Icon = options.tabBarIcon;
                    const badge = options.tabBarBadge;

                    const animatedIconStyle = useAnimatedStyle(() => {
                        return {
                            transform: [{ scale: withTiming(isFocused ? 1.1 : 1, { duration: 200 }) }],
                            // Keep opacity slightly higher (0.7) for non-active to ensure visibility on transparent glass
                            opacity: withTiming(isFocused ? 1 : 0.6, { duration: 200 }),
                            marginBottom: withTiming(isFocused ? 2 : 0, { duration: 200 }) // Slight lift
                        };
                    });

                    const animatedTextStyle = useAnimatedStyle(() => {
                        return {
                            opacity: withTiming(isFocused ? 1 : 0.5, { duration: 200 }),
                            transform: [{ scale: withTiming(isFocused ? 1 : 0.9, { duration: 200 }) }]
                        };
                    });

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={styles.tabItem}
                            activeOpacity={0.7}
                        >
                            <View style={styles.itemContent}>
                                <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
                                    {Icon && Icon({
                                        focused: isFocused,
                                        // Use slightly darker/richer colors to pop against the glass
                                        color: isFocused ? Colors.primary.DEFAULT : Colors.gray[500],
                                        size: 24
                                    })}
                                </Animated.View>

                                <Animated.Text style={[styles.label, animatedTextStyle]}>
                                    {typeof label === 'string' ? label : ''}
                                </Animated.Text>
                            </View>

                            {badge != null && (
                                <View style={[styles.badgeContainer, options.tabBarBadgeStyle]}>
                                    <Text style={styles.badgeText}>
                                        {badge}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    floatingContainer: {
        position: 'absolute',
        left: 20,
        right: 20,
        height: 70, // Increased height for text
        backgroundColor: 'transparent',
        borderRadius: 35, // Fully rounded pill
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)', // Subtle glass border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15, // Floating shadow
        shadowRadius: 20,
        elevation: 8,
    },
    glassOverlay: {
        backgroundColor: 'rgba(255,255,255,0.4)', // Very sheer white tint
        zIndex: -1,
    },
    fallbackBg: {
        backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(255,255,255,0.85)',
        zIndex: -1,
    },
    content: {
        flexDirection: 'row',
        height: '100%',
        alignItems: 'center',
    },
    tabItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        position: 'relative',
    },
    itemContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    label: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.text.primary,
        marginTop: 2,
        zIndex: 2,
    },
    badgeContainer: {
        position: 'absolute',
        top: 6,
        right: '15%',
        backgroundColor: Colors.error.DEFAULT,
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: Colors.white,
        zIndex: 3,
    },
    badgeText: {
        color: Colors.white,
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 10,
    },
});
