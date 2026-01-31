import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Stack } from 'expo-router';
import { ChevronDown, ChevronUp, Mail, MessageCircle, Phone } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/* --- DUMMY DATA --- */
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

function AccordionItem({ item }: { item: { question: string, answer: string } }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <Card variant="outlined" style={styles.accordionItem} padding="none">
            <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
            >
                <Text style={styles.question}>{item.question}</Text>
                {expanded ? (
                    <ChevronUp size={20} color={Colors.text.primary} />
                ) : (
                    <ChevronDown size={20} color={Colors.text.secondary} />
                )}
            </TouchableOpacity>
            {expanded && (
                <View style={styles.accordionBody}>
                    <Text style={styles.answer}>{item.answer}</Text>
                </View>
            )}
        </Card>
    );
}

export default function HelpScreen() {
    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
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
                    <Text style={styles.sectionTitle}>Nous contacter</Text>
                    <Card variant="elevated" style={styles.contactCard}>
                        <TouchableOpacity style={styles.contactRow}>
                            <View style={[styles.iconContainer, { backgroundColor: Colors.primary[50] }]}>
                                <MessageCircle size={24} color={Colors.primary.DEFAULT} />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactLabel}>Chat Support</Text>
                                <Text style={styles.contactValue}>Discutez avec nous en direct</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.contactRow}>
                            <View style={[styles.iconContainer, { backgroundColor: Colors.success[50] }]}>
                                <Mail size={24} color={Colors.success.DEFAULT} />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactLabel}>Email</Text>
                                <Text style={styles.contactValue}>support@umade.com</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.contactRow}>
                            <View style={[styles.iconContainer, { backgroundColor: Colors.warning[50] }]}>
                                <Phone size={24} color={Colors.warning.DEFAULT} />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactLabel}>Téléphone</Text>
                                <Text style={styles.contactValue}>+33 1 23 45 67 89</Text>
                            </View>
                        </TouchableOpacity>
                    </Card>
                </View>

                {/* FAQ Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Questions fréquentes</Text>
                    <View style={styles.faqList}>
                        {FAQ_ITEMS.map((item, index) => (
                            <AccordionItem key={index} item={item} />
                        ))}
                    </View>
                </View>

                <Text style={styles.footerText}>
                    Umade v1.0.0 • Fait avec ❤️ à Paris
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
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
        color: Colors.text.primary,
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
        color: Colors.text.primary,
        marginBottom: 2,
    },
    contactValue: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.secondary,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.gray[100],
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
        color: Colors.text.primary,
        paddingRight: Layout.spacing.sm,
    },
    accordionBody: {
        paddingHorizontal: Layout.spacing.md,
        paddingBottom: Layout.spacing.md,
        paddingTop: 0,
    },
    answer: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.secondary,
        lineHeight: 20,
    },
    footerText: {
        textAlign: 'center',
        color: Colors.text.tertiary,
        fontSize: Layout.fontSize.xs,
    }
});
