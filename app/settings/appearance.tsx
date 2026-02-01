/**
 * Page des paramètres d'apparence - Thème clair/sombre/système
 * Dark Mode Support
 */

import { Card } from '@/components/ui/Card';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useThemeStore, type ThemeMode } from '@/stores/themeStore';
import { Stack } from 'expo-router';
import { Check, Moon, Smartphone, Sun } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ThemeOptionProps {
    mode: ThemeMode;
    label: string;
    description: string;
    icon: React.ReactNode;
    isSelected: boolean;
    onPress: () => void;
    colors: ReturnType<typeof useColors>;
    isDark: boolean;
}

function ThemeOption({ mode, label, description, icon, isSelected, onPress, colors, isDark }: ThemeOptionProps) {
    const optionBg = isSelected
        ? `${colors.primary}15`
        : colors.card;
    const iconBg = isDark
        ? colors.backgroundTertiary
        : `${colors.primary}10`;

    return (
        <Pressable onPress={onPress}>
            <View style={[styles.option, { backgroundColor: optionBg }]}>
                <View style={[styles.optionIcon, { backgroundColor: iconBg }]}>{icon}</View>
                <View style={styles.optionContent}>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>{label}</Text>
                    <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>{description}</Text>
                </View>
                {isSelected && (
                    <View style={styles.checkIcon}>
                        <Check size={20} color={colors.primary} />
                    </View>
                )}
            </View>
        </Pressable>
    );
}

export default function AppearanceSettingsScreen() {
    const { mode, setMode } = useThemeStore();
    const colors = useColors();
    const isDark = useIsDarkTheme();

    const options: { mode: ThemeMode; label: string; description: string; icon: React.ReactNode }[] = [
        {
            mode: 'light',
            label: 'Mode clair',
            description: "Toujours utiliser le thème clair",
            icon: <Sun size={24} color="#F59E0B" />,
        },
        {
            mode: 'dark',
            label: 'Mode sombre',
            description: "Toujours utiliser le thème sombre",
            icon: <Moon size={24} color={colors.primary} />,
        },
        {
            mode: 'system',
            label: 'Système',
            description: "S'adapte aux réglages de votre appareil",
            icon: <Smartphone size={24} color={colors.textSecondary} />,
        },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <Stack.Screen
                options={{
                    title: 'Apparence',
                    headerBackTitle: 'Retour',
                }}
            />

            <View style={styles.content}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Thème</Text>
                <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                    Choisissez le thème de l'application
                </Text>

                <Card variant="outlined" padding="none" style={styles.optionsCard}>
                    {options.map((option, index) => (
                        <React.Fragment key={option.mode}>
                            {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                            <ThemeOption
                                {...option}
                                isSelected={mode === option.mode}
                                onPress={() => setMode(option.mode)}
                                colors={colors}
                                isDark={isDark}
                            />
                        </React.Fragment>
                    ))}
                </Card>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: Layout.spacing.lg,
    },
    sectionTitle: {
        fontSize: Layout.fontSize.xl,
        fontWeight: '700',
        marginBottom: Layout.spacing.xs,
    },
    sectionDescription: {
        fontSize: Layout.fontSize.sm,
        marginBottom: Layout.spacing.lg,
    },
    optionsCard: {
        overflow: 'hidden',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Layout.spacing.md,
    },
    optionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Layout.spacing.md,
    },
    optionContent: {
        flex: 1,
    },
    optionLabel: {
        fontSize: Layout.fontSize.md,
        fontWeight: '600',
        marginBottom: 2,
    },
    optionDescription: {
        fontSize: Layout.fontSize.sm,
    },
    checkIcon: {
        marginLeft: Layout.spacing.sm,
    },
    divider: {
        height: 1,
        marginLeft: 44 + Layout.spacing.md * 2,
    },
});
