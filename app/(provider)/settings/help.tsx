import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp, Mail, MessageCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { toast } from '@/lib/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';

/* FAQ Data */
const faqData = [
    {
        question: "Comment gérer mes disponibilités ?",
        answer: "Allez dans 'Paramètres > Disponibilités'. Vous pouvez définir vos horaires d'ouverture pour chaque jour de la semaine et ajouter des pauses."
    },
    {
        question: "Comment ajouter des photos à mon portfolio ?",
        answer: "Depuis le tableau de bord, cliquez sur 'Gérer mon portfolio'. Vous pouvez ajouter, supprimer et réorganiser vos photos pour mettre en valeur votre travail."
    },
    {
        question: "Comment fonctionnent les paiements ?",
        answer: "Les paiements sont traités de manière sécurisée via Stripe. Vous recevez vos virements sur votre compte bancaire configuré dans la section 'Paiements' tous les lundis."
    },
    {
        question: "Puis-je refuser une réservation ?",
        answer: "Oui, vous avez le contrôle total. Une fois une demande reçue, vous pouvez l'accepter ou la refuser. Cependant, des refus fréquents peuvent affecter votre visibilité."
    }
];

export default function ProviderHelpScreen() {
    const router = useRouter();
    const colors = useColors();
    const isDark = useIsDarkTheme();
    const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(null);

    const toggleQuestion = (index: number) => {
        setOpenQuestionIndex(openQuestionIndex === index ? null : index);
    };

    const handleContactSupport = async () => {
        const url = 'mailto:support@umade.fr?subject=Support%20Prestataire%20Umade';
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                throw new Error('No mail app');
            }
        } catch (error) {
            toast.info('Impossible d\'ouvrir l\'application mail. Écrivez-nous à : support@umade.fr');
        }
    };

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
                <Text style={[styles.title, { color: colors.text }]}>Aide & Support</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Contact Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Besoin d'aide immédiate ?</Text>
                    <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <View style={[styles.contactIcon, { backgroundColor: `${colors.primary}22` }]}>
                            <MessageCircle size={32} color={colors.primary} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={[styles.contactTitle, { color: colors.text }]}>Service Client Pro</Text>
                            <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
                                Notre équipe est là pour vous aider du lundi au samedi, de 9h à 19h.
                            </Text>
                        </View>
                        <TouchableOpacity style={[styles.contactButton, { backgroundColor: colors.primary }]} onPress={handleContactSupport}>
                            <Mail size={20} color={Colors.white} />
                            <Text style={styles.contactButtonText}>Nous contacter</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* FAQ Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Questions Fréquentes</Text>
                    <View style={[styles.faqList, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        {faqData.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.faqItem,
                                    { borderBottomColor: colors.border },
                                    index === faqData.length - 1 && { borderBottomWidth: 0 },
                                ]}
                                onPress={() => toggleQuestion(index)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.faqHeader}>
                                    <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.question}</Text>
                                    {openQuestionIndex === index ? (
                                        <ChevronUp size={20} color={colors.primary} />
                                    ) : (
                                        <ChevronDown size={20} color={colors.textTertiary} />
                                    )}
                                </View>
                                {openQuestionIndex === index && (
                                    <View
                                        style={[
                                            styles.faqAnswerContainer,
                                            {
                                                backgroundColor: isDark
                                                    ? colors.backgroundTertiary
                                                    : colors.backgroundSecondary,
                                            },
                                        ]}
                                    >
                                        <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{item.answer}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Additional Links */}
                <View style={styles.footerLinks}>
                    <TouchableOpacity onPress={() => Linking.openURL('https://umade.fr/guides')}>
                        <Text style={[styles.linkText, { color: colors.primary }]}>Consulter nos guides {'>'} </Text>
                    </TouchableOpacity>
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
    section: {
        marginBottom: Layout.spacing.xl,
    },
    sectionTitle: {
        fontSize: Layout.fontSize.md,
        fontWeight: '700',
        marginBottom: Layout.spacing.md,
    },
    contactCard: {
        borderRadius: Layout.radius.lg,
        borderWidth: 1,
        padding: Layout.spacing.lg,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    contactIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Layout.spacing.md,
    },
    contactInfo: {
        alignItems: 'center',
        marginBottom: Layout.spacing.lg,
    },
    contactTitle: {
        fontSize: Layout.fontSize.lg,
        fontWeight: '700',
        marginBottom: Layout.spacing.xs,
    },
    contactSubtitle: {
        fontSize: Layout.fontSize.sm,
        textAlign: 'center',
        lineHeight: 20,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary.DEFAULT,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: Layout.radius.full,
        gap: 8,
    },
    contactButtonText: {
        color: Colors.white,
        fontWeight: '600',
        fontSize: Layout.fontSize.md,
    },
    faqList: {
        borderRadius: Layout.radius.lg,
        overflow: 'hidden',
        borderWidth: 1,
    },
    faqItem: {
        borderBottomWidth: 1,
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Layout.spacing.md,
    },
    faqQuestion: {
        fontSize: Layout.fontSize.md,
        fontWeight: '500',
        flex: 1,
        marginRight: 8,
    },
    faqAnswerContainer: {
        paddingHorizontal: Layout.spacing.md,
        paddingBottom: Layout.spacing.md,
    },
    faqAnswer: {
        fontSize: Layout.fontSize.sm,
        lineHeight: 20,
    },
    footerLinks: {
        alignItems: 'center',
        marginTop: Layout.spacing.md,
    },
    linkText: {
        fontWeight: '600',
    },
});
