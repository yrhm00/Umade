/**
 * Page des paramètres d'apparence - Thème clair/sombre/système
 * Dark Mode Support
 */

import { Card } from '@/components/ui/Card';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useThemeStore, type ThemeMode } from '@/stores/themeStore';
import { Stack } from 'expo-router';
import { Check, Moon, Smartphone, Sun, Zap } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
            mode: 'oled',
            label: 'OLED (Noir pur)',
            description: "Économise la batterie sur écrans OLED",
            icon: <Zap size={24} color="#00D084" />,
        },
        {
            mode: 'system',
            label: 'Système',
            description: "S'adapte aux réglages de votre appareil",
            icon: <Smartphone size={24} color={colors.textSecondary} />,
        },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <Text style={[styles.heroTitle, { color: colors.text }]}>Thème de l'app</Text>
                    <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>
                        Choisissez le style visuel qui vous convient le mieux.
                    </Text>
                </View>

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

                <View style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.tipTitle, { color: colors.text }]}>Conseil</Text>
                    <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                        Le mode <Text style={{ color: colors.text, fontWeight: '700' }}>Système</Text> applique automatiquement
                        le thème de votre téléphone.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    content: {
        padding: Layout.spacing.lg,
        paddingTop: Layout.spacing.md,
        paddingBottom: Layout.spacing.xxl,
        gap: Layout.spacing.lg,
    },
    hero: {
        gap: 4,
    },
    heroTitle: {
        fontSize: Layout.fontSize.xl,
        fontWeight: '700',
    },
    heroDescription: {
        fontSize: Layout.fontSize.sm,
        lineHeight: 20,
    },
    optionsCard: {
        overflow: 'hidden',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: Layout.spacing.md,
        minHeight: 76,
    },
    optionIcon: {
        width: 44,
        height: 44,
        borderRadius: 18,
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
        marginBottom: 3,
    },
    optionDescription: {
        fontSize: Layout.fontSize.sm,
        lineHeight: 18,
    },
    checkIcon: {
        marginLeft: Layout.spacing.sm,
        paddingTop: 10,
    },
    divider: {
        height: 1,
        marginLeft: 44 + Layout.spacing.md * 2,
    },
    tipCard: {
        borderWidth: 1,
        borderRadius: Layout.radius.lg,
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.sm,
        gap: 4,
    },
    tipTitle: {
        fontSize: Layout.fontSize.sm,
        fontWeight: '700',
    },
    tipText: {
        fontSize: Layout.fontSize.sm,
        lineHeight: 19,
    },
});
