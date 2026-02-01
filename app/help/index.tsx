/**
 * Help & Support Screen
 * Dark Mode Support
 */

import { Card } from '@/components/ui/Card';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { Stack } from 'expo-router';
import { ChevronDown, ChevronUp, Mail, MessageCircle, Phone } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FAQ_ITEMS = [
    {
        question: "Comment effectuer une réservation ?",
        answer: "Pour effectuer une réservation, naviguez vers la page d'accueil ou de recherche, choisissez un prestataire, sélectionnez un service et une date, puis suivez les instructions de paiement."
    },
    {
        question: "Puis-je annuler ma réservation ?",
        answer: "Oui, vous pouvez annuler votre réservation jusqu'à 48h avant l'événement sans frais. Passé ce délai, des frais peuvent s'appliquer selon les conditions du prestataire."
    },
    {
        question: "Comment contacter un prestataire ?",
        answer: "Une fois la réservation effectuée, vous pouvez utiliser la messagerie intégrée pour discuter des détails avec votre prestataire."
    },
    {
        question: "Quels sont les moyens de paiement acceptés ?",
        answer: "Nous acceptons les cartes bancaires (Visa, Mastercard) et Apple Pay. Tous les paiements sont sécurisés via Stripe."
    },
    {
        question: "J'ai un problème avec un prestataire, que faire ?",
        answer: "En cas de litige, contactez notre support via le formulaire ci-dessous ou par téléphone. Nous intervenons en tant que médiateur."
    }
];

function AccordionItem({ item, colors, isDark }: { item: { question: string, answer: string }, colors: ReturnType<typeof useColors>, isDark: boolean }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <Card variant="outlined" style={styles.accordionItem} padding="none">
            <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
            >
                <Text style={[styles.question, { color: colors.text }]}>{item.question}</Text>
                {expanded ? (
                    <ChevronUp size={20} color={colors.text} />
                ) : (
                    <ChevronDown size={20} color={colors.textSecondary} />
                )}
            </TouchableOpacity>
            {expanded && (
                <View style={styles.accordionBody}>
                    <Text style={[styles.answer, { color: colors.textSecondary }]}>{item.answer}</Text>
                </View>
            )}
        </Card>
    );
}

export default function HelpScreen() {
    const colors = useColors();
    const isDark = useIsDarkTheme();

    const iconBgPrimary = isDark ? colors.backgroundTertiary : `${colors.primary}15`;
    const iconBgSuccess = isDark ? colors.backgroundTertiary : '#D1FAE515';
    const iconBgWarning = isDark ? colors.backgroundTertiary : '#FEF3C715';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Aide & Support',
                    headerBackTitle: 'Profil',
                }}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Contact Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Nous contacter</Text>
                    <Card variant="elevated" style={styles.contactCard}>
                        <TouchableOpacity style={styles.contactRow}>
                            <View style={[styles.iconContainer, { backgroundColor: iconBgPrimary }]}>
                                <MessageCircle size={24} color={colors.primary} />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={[styles.contactLabel, { color: colors.text }]}>Chat Support</Text>
                                <Text style={[styles.contactValue, { color: colors.textSecondary }]}>Discutez avec nous en direct</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <TouchableOpacity style={styles.contactRow}>
                            <View style={[styles.iconContainer, { backgroundColor: iconBgSuccess }]}>
                                <Mail size={24} color="#10B981" />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={[styles.contactLabel, { color: colors.text }]}>Email</Text>
                                <Text style={[styles.contactValue, { color: colors.textSecondary }]}>support@umade.com</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <TouchableOpacity style={styles.contactRow}>
                            <View style={[styles.iconContainer, { backgroundColor: iconBgWarning }]}>
                                <Phone size={24} color="#F59E0B" />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={[styles.contactLabel, { color: colors.text }]}>Téléphone</Text>
                                <Text style={[styles.contactValue, { color: colors.textSecondary }]}>+33 1 23 45 67 89</Text>
                            </View>
                        </TouchableOpacity>
                    </Card>
                </View>

                {/* FAQ Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Questions fréquentes</Text>
                    <View style={styles.faqList}>
                        {FAQ_ITEMS.map((item, index) => (
                            <AccordionItem key={index} item={item} colors={colors} isDark={isDark} />
                        ))}
                    </View>
                </View>

                <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                    Umade v1.0.0 • Fait avec ❤️ à Paris
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Layout.spacing.lg,
        paddingBottom: 40,
    },
    section: {
        marginBottom: Layout.spacing.xl,
    },
    sectionTitle: {
        fontSize: Layout.fontSize.lg,
        fontWeight: '700',
        marginBottom: Layout.spacing.md,
    },
    contactCard: {
        padding: 0,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Layout.spacing.md,
        gap: Layout.spacing.md,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: Layout.fontSize.md,
        fontWeight: '600',
        marginBottom: 2,
    },
    contactValue: {
        fontSize: Layout.fontSize.sm,
    },
    divider: {
        height: 1,
        marginLeft: 48 + Layout.spacing.md * 2,
    },
    faqList: {
        gap: Layout.spacing.sm,
    },
    accordionItem: {
        overflow: 'hidden',
    },
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Layout.spacing.md,
    },
    question: {
        flex: 1,
        fontSize: Layout.fontSize.md,
        fontWeight: '600',
        paddingRight: Layout.spacing.sm,
    },
    accordionBody: {
        paddingHorizontal: Layout.spacing.md,
        paddingBottom: Layout.spacing.md,
        paddingTop: 0,
    },
    answer: {
        fontSize: Layout.fontSize.sm,
        lineHeight: 20,
    },
    footerText: {
        textAlign: 'center',
        fontSize: Layout.fontSize.xs,
    }
});
