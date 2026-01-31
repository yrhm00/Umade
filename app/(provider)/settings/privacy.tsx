import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
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

export default function ProviderPrivacyScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Confidentialité</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.introCard}>
                    <Shield size={48} color={Colors.primary.DEFAULT} />
                    <Text style={styles.introTitle}>Vos données sont en sécurité</Text>
                    <Text style={styles.introText}>
                        Chez Umade, nous prenons la confidentialité très au sérieux.
                        Voici comment nous protégeons vos informations et celles de vos clients.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>1. Collecte des données</Text>
                    <Text style={styles.paragraph}>
                        Nous collectons uniquement les informations nécessaires au bon fonctionnement de votre activité :
                        coordonnées, détails de l'entreprise, photos de portfolio et historique des transactions.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>2. Utilisation des informations</Text>
                    <Text style={styles.paragraph}>
                        Vos données sont utilisées pour :
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletPoint}>• Gérer vos réservations et votre profil public.</Text>
                        <Text style={styles.bulletPoint}>• Traiter les paiements de manière sécurisée.</Text>
                        <Text style={styles.bulletPoint}>• Améliorer nos services et vous proposer des fonctionnalités adaptées.</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>3. Partage des données</Text>
                    <Text style={styles.paragraph}>
                        Nous ne vendons jamais vos données personnelles. Elles peuvent être partagées uniquement avec
                        des tiers de confiance nécessaires au service (ex: Stripe pour les paiements) sous des accords de confidentialité stricts.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>4. Sécurité</Text>
                    <Text style={styles.paragraph}>
                        Nous utilisons des protocoles de sécurité avancés (chiffrement SSL/TLS) pour protéger vos données
                        lors de leur transmission et de leur stockage.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>5. Vos droits (RGPD)</Text>
                    <Text style={styles.paragraph}>
                        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
                        Pour exercer ces droits, contactez-nous à privacy@umade.fr.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Dernière mise à jour : 30 Janvier 2026</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Layout.spacing.lg,
        paddingVertical: Layout.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[200],
    },
    backButton: {
        padding: Layout.spacing.xs,
    },
    title: {
        fontSize: Layout.fontSize.lg,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    content: {
        padding: Layout.spacing.lg,
        paddingBottom: Layout.spacing.xl * 2,
    },
    introCard: {
        backgroundColor: Colors.white,
        borderRadius: Layout.radius.lg,
        padding: Layout.spacing.xl,
        alignItems: 'center',
        marginBottom: Layout.spacing.xl,
        borderWidth: 1,
        borderColor: Colors.gray[100],
    },
    introTitle: {
        fontSize: Layout.fontSize.lg,
        fontWeight: '700',
        color: Colors.text.primary,
        marginTop: Layout.spacing.md,
        marginBottom: Layout.spacing.sm,
    },
    introText: {
        fontSize: Layout.fontSize.md,
        color: Colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    section: {
        marginBottom: Layout.spacing.lg,
    },
    sectionHeader: {
        fontSize: Layout.fontSize.md,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: Layout.spacing.sm,
    },
    paragraph: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.secondary,
        lineHeight: 20,
    },
    bulletList: {
        marginTop: Layout.spacing.xs,
        paddingLeft: Layout.spacing.sm,
    },
    bulletPoint: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.secondary,
        lineHeight: 24,
    },
    footer: {
        marginTop: Layout.spacing.xl,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.gray[200],
        paddingTop: Layout.spacing.lg,
    },
    footerText: {
        fontSize: Layout.fontSize.xs,
        color: Colors.text.tertiary,
    },
});
