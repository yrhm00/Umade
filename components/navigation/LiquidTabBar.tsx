import { useColors, useIsDarkTheme } from '@/hooks/useColors';
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
    const colors = useColors();
    const isDark = useIsDarkTheme();

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

    // Dynamic styles based on theme
    const glassOverlayColor = isDark
        ? 'rgba(26, 22, 37, 0.7)'
        : 'rgba(255, 255, 255, 0.4)';

    const glassGradientColors = isDark
        ? ["rgba(95, 74, 139, 0.3)", "rgba(95, 74, 139, 0.1)"]
        : ["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.05)"];

    const glassStrokeColors = isDark
        ? ["rgba(143, 119, 184, 0.5)", "rgba(143, 119, 184, 0.0)"]
        : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.0)"];

    const glassBottomColors = isDark
        ? ["transparent", "rgba(143, 119, 184, 0.3)"]
        : ["transparent", "rgba(255, 255, 255, 0.5)"];

    const borderColor = isDark
        ? 'rgba(95, 74, 139, 0.4)'
        : 'rgba(255, 255, 255, 0.4)';

    return (
        <View style={[
            styles.floatingContainer,
            {
                bottom: insets.bottom + 10,
                borderColor: borderColor,
            }
        ]}>
            {/* 
                Floating Glass Background 
                Made "Ultra Glassy" by reducing opacity and using light tint
            */}
            <BlurView
                intensity={Platform.OS === 'ios' ? 40 : 0}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFillObject}
            />
            {/* Fallback & tint overlay for cleaner glass look */}
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: glassOverlayColor, zIndex: -1 }]} />

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
                                    colors={glassGradientColors}
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
                                    colors={glassStrokeColors}
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
                                    colors={glassBottomColors}
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
                            opacity: withTiming(isFocused ? 1 : 0.6, { duration: 200 }),
                            marginBottom: withTiming(isFocused ? 2 : 0, { duration: 200 })
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
                                        color: isFocused ? colors.primary : colors.textTertiary,
                                        size: 24
                                    })}
                                </Animated.View>

                                <Animated.Text style={[
                                    styles.label,
                                    animatedTextStyle,
                                    { color: colors.text }
                                ]}>
                                    {typeof label === 'string' ? label : ''}
                                </Animated.Text>
                            </View>

                            {badge != null && (
                                <View style={styles.badgeContainer}>
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
        height: 70,
        backgroundColor: 'transparent',
        borderRadius: 35,
        overflow: 'hidden',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
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
        marginTop: 2,
        zIndex: 2,
    },
    badgeContainer: {
        position: 'absolute',
        top: 6,
        right: '15%',
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        zIndex: 3,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 10,
    },
});
