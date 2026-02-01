import { useColors } from '@/hooks/useColors';
import { LinearGradient } from 'expo-linear-gradient';
import { useSegments } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function TopEdgeGradient() {
    const segments = useSegments();
    const insets = useSafeAreaInsets();
    const colors = useColors();

    // Hide on auth screens and onboarding
    // segments is an array of route segments, e.g. ['(auth)', 'welcome']
    const shouldHide = segments.includes('(auth)') || segments.includes('onboarding');

    if (shouldHide) return null;

    // Height covers status bar + a bit of fade
    const height = insets.top + 60;

    return (
        <View style={[styles.container, { height }]} pointerEvents="none">
            <LinearGradient
                colors={[
                    // @ts-ignore
                    colors.background,
                    'rgba(0,0,0,0)', // Transparent
                ]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999, // Ensure it's on top of headers
    },
    gradient: {
        flex: 1,
    },
});
