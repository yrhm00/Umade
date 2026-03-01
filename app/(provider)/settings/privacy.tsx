import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield } from 'lucide-react-native';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';

export default function ProviderPrivacyScreen() {
    const router = useRouter();
    const colors = useColors();
    const isDark = useIsDarkTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
                <TouchableOpacity
                    onPress={() => goBackOrFallback(router)}
                    style={[
                        styles.backButton,
                        { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary },
                    ]}
                >
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Confidentialité</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={[styles.introCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Shield size={48} color={colors.primary} />
                    <Text style={[styles.introTitle, { color: colors.text }]}>Vos données sont en sécurité</Text>
                    <Text style={[styles.introText, { color: colors.textSecondary }]}>
                        Chez Umade, nous prenons la confidentialité très au sérieux.
                        Voici comment nous protégeons vos informations et celles de vos clients.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.text }]}>1. Collecte des données</Text>
                    <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                        Nous collectons uniquement les informations nécessaires au bon fonctionnement de votre activité :
                        coordonnées, détails de l'entreprise, photos de portfolio et historique des transactions.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.text }]}>2. Utilisation des informations</Text>
                    <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                        Vos données sont utilisées pour :
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>• Gérer vos réservations et votre profil public.</Text>
                        <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>• Traiter les paiements de manière sécurisée.</Text>
                        <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>• Améliorer nos services et vous proposer des fonctionnalités adaptées.</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.text }]}>3. Partage des données</Text>
                    <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                        Nous ne vendons jamais vos données personnelles. Elles peuvent être partagées uniquement avec
                        des tiers de confiance nécessaires au service (ex: Stripe pour les paiements) sous des accords de confidentialité stricts.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.text }]}>4. Sécurité</Text>
                    <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                        Nous utilisons des protocoles de sécurité avancés (chiffrement SSL/TLS) pour protéger vos données
                        lors de leur transmission et de leur stockage.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.text }]}>5. Vos droits (RGPD)</Text>
                    <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
                        Pour exercer ces droits, contactez-nous à privacy@umade.fr.
                    </Text>
                </View>

                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                    <Text style={[styles.footerText, { color: colors.textTertiary }]}>Dernière mise à jour : 30 Janvier 2026</Text>
                </View>
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
        paddingHorizontal: Layout.spacing.lg,
        paddingVertical: Layout.spacing.md,
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
        fontSize: Layout.fontSize.lg,
        fontWeight: '700',
    },
    content: {
        padding: Layout.spacing.lg,
        paddingBottom: Layout.spacing.xl * 2,
    },
    introCard: {
        borderRadius: Layout.radius.lg,
        padding: Layout.spacing.xl,
        alignItems: 'center',
        marginBottom: Layout.spacing.xl,
        borderWidth: 1,
    },
    introTitle: {
        fontSize: Layout.fontSize.lg,
        fontWeight: '700',
        marginTop: Layout.spacing.md,
        marginBottom: Layout.spacing.sm,
    },
    introText: {
        fontSize: Layout.fontSize.md,
        textAlign: 'center',
        lineHeight: 22,
    },
    section: {
        marginBottom: Layout.spacing.lg,
    },
    sectionHeader: {
        fontSize: Layout.fontSize.md,
        fontWeight: '700',
        marginBottom: Layout.spacing.sm,
    },
    paragraph: {
        fontSize: Layout.fontSize.sm,
        lineHeight: 20,
    },
    bulletList: {
        marginTop: Layout.spacing.xs,
        paddingLeft: Layout.spacing.sm,
    },
    bulletPoint: {
        fontSize: Layout.fontSize.sm,
        lineHeight: 24,
    },
    footer: {
        marginTop: Layout.spacing.xl,
        alignItems: 'center',
        borderTopWidth: 1,
        paddingTop: Layout.spacing.lg,
    },
    footerText: {
        fontSize: Layout.fontSize.xs,
    },
});
