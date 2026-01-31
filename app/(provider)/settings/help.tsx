import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp, Mail, MessageCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
            Alert.alert(
                'Contact',
                'Impossible d\'ouvrir l\'application mail. Écrivez-nous à : support@umade.fr',
                [{ text: 'OK' }]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Aide & Support</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Contact Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Besoin d'aide immédiate ?</Text>
                    <View style={styles.contactCard}>
                        <View style={styles.contactIcon}>
                            <MessageCircle size={32} color={Colors.primary.DEFAULT} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactTitle}>Service Client Pro</Text>
                            <Text style={styles.contactSubtitle}>Notre équipe est là pour vous aider du lundi au samedi, de 9h à 19h.</Text>
                        </View>
                        <TouchableOpacity style={styles.contactButton} onPress={handleContactSupport}>
                            <Mail size={20} color={Colors.white} />
                            <Text style={styles.contactButtonText}>Nous contacter</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* FAQ Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Questions Fréquentes</Text>
                    <View style={styles.faqList}>
                        {faqData.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.faqItem, index === faqData.length - 1 && { borderBottomWidth: 0 }]}
                                onPress={() => toggleQuestion(index)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.faqHeader}>
                                    <Text style={styles.faqQuestion}>{item.question}</Text>
                                    {openQuestionIndex === index ? (
                                        <ChevronUp size={20} color={Colors.primary.DEFAULT} />
                                    ) : (
                                        <ChevronDown size={20} color={Colors.gray[400]} />
                                    )}
                                </View>
                                {openQuestionIndex === index && (
                                    <View style={styles.faqAnswerContainer}>
                                        <Text style={styles.faqAnswer}>{item.answer}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Additional Links */}
                <View style={styles.footerLinks}>
                    <TouchableOpacity onPress={() => Linking.openURL('https://umade.fr/guides')}>
                        <Text style={styles.linkText}>Consulter nos guides {'>'} </Text>
                    </TouchableOpacity>
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
    section: {
        marginBottom: Layout.spacing.xl,
    },
    sectionTitle: {
        fontSize: Layout.fontSize.md,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: Layout.spacing.md,
    },
    contactCard: {
        backgroundColor: Colors.white,
        borderRadius: Layout.radius.lg,
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
        backgroundColor: Colors.primary.light,
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
        color: Colors.text.primary,
        marginBottom: Layout.spacing.xs,
    },
    contactSubtitle: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.secondary,
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
        backgroundColor: Colors.white,
        borderRadius: Layout.radius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    faqItem: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[200],
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
        color: Colors.text.primary,
        flex: 1,
        marginRight: 8,
    },
    faqAnswerContainer: {
        paddingHorizontal: Layout.spacing.md,
        paddingBottom: Layout.spacing.md,
        backgroundColor: Colors.gray[50],
    },
    faqAnswer: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.secondary,
        lineHeight: 20,
    },
    footerLinks: {
        alignItems: 'center',
        marginTop: Layout.spacing.md,
    },
    linkText: {
        color: Colors.primary.DEFAULT,
        fontWeight: '600',
    },
});
