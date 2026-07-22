/**
 * Page des paramètres pour le provider
 */

import { Colors } from '@/constants/Colors';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Bell,
    Calendar,
    ChevronRight,
    CreditCard,
    FileText,
    HelpCircle,
    LogOut,
    Shield,
    Star,
    User,
} from 'lucide-react-native';
import React from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { toast } from '@/lib/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';

interface SettingItem {
    icon: React.ElementType;
    label: string;
    description?: string;
    onPress: () => void;
    danger?: boolean;
    showChevron?: boolean;
}

interface SettingSection {
    title: string;
    items: SettingItem[];
}

export default function ProviderSettingsScreen() {
    const router = useRouter();
    const colors = useColors();
    const isDark = useIsDarkTheme();
    const { profile, signOut } = useAuthStore();

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Déconnexion',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        router.replace('/(auth)/welcome');
                    },
                },
            ]
        );
    };

    const sections: SettingSection[] = [
        {
            title: 'Compte',
            items: [
                {
                    icon: User,
                    label: 'Mon profil',
                    description: 'Modifier vos informations personnelles',
                    onPress: () => router.push('/(provider)/profile-edit'),
                    showChevron: true,
                },
                {
                    icon: Calendar,
                    label: 'Disponibilités',
                    description: 'Gérer vos horaires de travail',
                    onPress: () => router.push('/(provider)/availability'),
                    showChevron: true,
                },
                {
                    icon: FileText,
                    label: 'Mes statistiques',
                    description: 'Voir vos performances et données',
                    onPress: () => router.push('/(provider)/stats'),
                    showChevron: true,
                },
            ],
        },
        {
            title: 'Préférences',
            items: [
                {
                    icon: Bell,
                    label: 'Notifications',
                    description: 'Gérer vos préférences de notifications',
                    onPress: () => router.push('/settings/notifications'),
                    showChevron: true,
                },
                {
                    icon: CreditCard,
                    label: 'Paiements',
                    description: 'Coordonnées bancaires et historique',
                    onPress: () => toast.info('Cette fonctionnalité arrive bientôt !'),
                    showChevron: true,
                },
            ],
        },
        {
            title: 'Informations',
            items: [
                {
                    icon: Star,
                    label: 'Mes avis',
                    description: 'Voir et répondre aux avis clients',
                    onPress: () => router.push('/(provider)/reviews'),
                    showChevron: true,
                },
                {
                    icon: HelpCircle,
                    label: 'Aide & Support',
                    description: 'FAQ et contact support',
                    onPress: () => router.push('/(provider)/settings/help'),
                    showChevron: true,
                },
                {
                    icon: Shield,
                    label: 'Confidentialité',
                    description: 'Politique de confidentialité',
                    onPress: () => router.push('/(provider)/settings/privacy'),
                    showChevron: true,
                },
            ],
        },
        {
            title: '',
            items: [
                {
                    icon: LogOut,
                    label: 'Déconnexion',
                    onPress: handleLogout,
                    danger: true,
                    showChevron: false,
                },
            ],
        },
    ];

    const renderSettingItem = (item: SettingItem, index: number, isLast: boolean) => (
        <TouchableOpacity
            key={index}
            style={[
                styles.settingItem,
                !isLast && styles.settingItemBorder,
                !isLast && { borderBottomColor: colors.border },
            ]}
            onPress={item.onPress}
            activeOpacity={0.7}
        >
            <View
                style={[
                    styles.iconContainer,
                    { backgroundColor: `${colors.primary}12` },
                    item.danger && styles.iconContainerDanger,
                ]}
            >
                <item.icon
                    size={20}
                    color={item.danger ? colors.error : colors.primary}
                />
            </View>
            <View style={styles.settingContent}>
                <Text
                    style={[
                        styles.settingLabel,
                        { color: colors.text },
                        item.danger && styles.settingLabelDanger,
                        item.danger && { color: colors.error },
                    ]}
                >
                    {item.label}
                </Text>
                {item.description && (
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                        {item.description}
                    </Text>
                )}
            </View>
            {item.showChevron && (
                <ChevronRight size={20} color={colors.textTertiary} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
                <TouchableOpacity
                    style={[
                        styles.backButton,
                        { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary },
                    ]}
                    onPress={() => goBackOrFallback(router)}
                >
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Paramètres</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={[styles.content, { backgroundColor: colors.background }]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profile Header */}
                <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={styles.avatarContainer}>
                        {profile?.avatar_url ? (
                            <Image
                                source={{ uri: profile.avatar_url }}
                                style={styles.avatar}
                                resizeMode="cover"
                            />
                        ) : (
                            <View
                                style={[
                                    styles.avatarPlaceholder,
                                    { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary },
                                ]}
                            >
                                <User size={32} color={colors.textTertiary} />
                            </View>
                        )}
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: colors.text }]}>{profile?.full_name || 'Prestataire'}</Text>
                        <Text style={[styles.profileRole, { color: colors.textSecondary }]}>Compte Prestataire</Text>
                    </View>
                </View>

                {/* Settings Sections */}
                {sections.map((section, sectionIndex) => (
                    <View key={sectionIndex} style={styles.section}>
                        {section.title && (
                            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
                        )}
                        <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                            {section.items.map((item, itemIndex) =>
                                renderSettingItem(item, itemIndex, itemIndex === section.items.length - 1)
                            )}
                        </View>
                    </View>
                ))}

                {/* App Version */}
                <Text style={[styles.version, { color: colors.textTertiary }]}>Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
    },
    profileRole: {
        fontSize: 14,
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    sectionContent: {
        borderRadius: 18,
        borderWidth: 1,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    settingItemBorder: {
        borderBottomWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconContainerDanger: {
        backgroundColor: Colors.error.DEFAULT + '10',
    },
    settingContent: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingLabelDanger: {
        color: Colors.error.DEFAULT,
    },
    settingDescription: {
        fontSize: 13,
        marginTop: 2,
    },
    version: {
        textAlign: 'center',
        fontSize: 13,
        marginTop: 16,
    },
});
