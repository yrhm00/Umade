/**
 * Terms of Service Screen
 * Dark Mode Support
 */

import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { Stack } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function Section({ title, children, colors }: { title: string, children: React.ReactNode, colors: ReturnType<typeof useColors> }) {
    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            {children}
        </View>
    );
}

export default function TermsOfServiceScreen() {
    const colors = useColors();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: "Conditions d'utilisation",
                    headerBackTitle: 'Profil',
                }}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.lastUpdated, { color: colors.textTertiary }]}>Dernière mise à jour : 30 Janvier 2026</Text>

                <Section title="1. Objet" colors={colors}>
                    <Text style={[styles.text, { color: colors.textSecondary }]}>
                        Les présentes Conditions Générales d'Utilisation (ci-après "CGU") ont pour objet de définir les modalités de mise à disposition des services du site et de l'application Umade, ci-après nommé "le Service", et les conditions d'utilisation du Service par l'Utilisateur.
                    </Text>
                </Section>

                <Section title="2. Définitions" colors={colors}>
                    <Text style={[styles.text, { color: colors.textSecondary }]}>
                        <Text style={[styles.bold, { color: colors.text }]}>Application :</Text> Désigne l'application mobile Umade disponible sur iOS et Android.{'\n'}
                        <Text style={[styles.bold, { color: colors.text }]}>Utilisateur :</Text> Toute personne qui utilise le Site ou l'Application.{'\n'}
                        <Text style={[styles.bold, { color: colors.text }]}>Client :</Text> Utilisateur souhaitant réserver une prestation.{'\n'}
                        <Text style={[styles.bold, { color: colors.text }]}>Prestataire :</Text> Professionnel ou particulier proposant ses services via l'Application.{'\n'}
                        <Text style={[styles.bold, { color: colors.text }]}>Prestation :</Text> Service proposé par un Prestataire (ex: Photographie, Traiteur, DJ, etc.).
                    </Text>
                </Section>

                <Section title="3. Accès au service" colors={colors}>
                    <Text style={[styles.text, { color: colors.textSecondary }]}>
                        Le Service est accessible gratuitement à tout Utilisateur disposant d'un accès à internet. Tous les coûts afférents à l'accès au Service, que ce soient les frais matériels, logiciels ou d'accès à internet sont exclusivement à la charge de l'utilisateur.
                    </Text>
                </Section>

                <Section title="4. Compte Utilisateur" colors={colors}>
                    <Text style={[styles.text, { color: colors.textSecondary }]}>
                        L'accès à certains services nécessite la création d'un compte. L'Utilisateur s'engage à fournir des informations sincères et exactes. Il est responsable de la confidentialité de ses identifiants. Umade ne saurait être tenu responsable de toute perte ou dommage résultant de la négligence de l'Utilisateur à protéger ses identifiants.
                    </Text>
                </Section>

                <Section title="5. Mise en relation et Réservation" colors={colors}>
                    <Text style={[styles.text, { color: colors.textSecondary }]}>
                        Umade agit en tant qu'intermédiaire technique permettant la mise en relation entre Clients et Prestataires. Umade n'est pas partie au contrat de prestation conclu entre le Client et le Prestataire.
                        {'\n\n'}
                        Lors d'une demande de réservation, le Prestataire dispose d'un délai défini pour accepter ou refuser la demande. Le paiement est sécurisé et cantonné jusqu'à la validation de la prestation.
                    </Text>
                </Section>

                <Section title="6. Paiements et Frais" colors={colors}>
                    <Text style={[styles.text, { color: colors.textSecondary }]}>
                        Les prix des Prestations sont fixés librement par les Prestataires. Umade peut percevoir une commission de service sur chaque transaction, clairement indiquée avant la validation du paiement.
                        {'\n\n'}
                        Les paiements sont traités par un prestataire de paiement sécurisé tiers (Stripe).
                    </Text>
                </Section>

                <Section title="7. Annulation et Rétractation" colors={colors}>
                    <Text style={[styles.text, { color: colors.textSecondary }]}>
                        Les conditions d'annulation sont définies par chaque Prestataire et affichées sur leur profil ou lors de la réservation. En cas d'annulation par le Prestataire, le Client est intégralement remboursé.
                        {'\n\n'}
                        Le droit de rétractation ne s'applique pas aux contrats de prestation de services d'hébergement, de transport, de restauration ou de loisirs qui doivent être fournis à une date ou à une période déterminée (Article L221-28 du Code de la consommation).
                    </Text>
                </Section>

                <Section title="8. Responsabilité" colors={colors}>
                    <Text style={[styles.text, { color: colors.textSecondary }]}>
                        Umade s'efforce d'assurer la fiabilité des informations diffusées sur l'Application mais ne saurait garantir l'exactitude, la complétude ou l'actualité des informations fournies par les Prestataires.
                        {'\n\n'}
                        Umade ne saurait être tenu responsable de l'inexécution ou de la mauvaise exécution de la Prestation, qui relève de la seule responsabilité du Prestataire.
                    </Text>
                </Section>

                <Section title="9. Propriété intellectuelle" colors={colors}>
                    <Text style={[styles.text, { color: colors.textSecondary }]}>
                        Les marques, logos, signes ainsi que tous les contenus du site (textes, images, son...) font l'objet d'une protection par le Code de la propriété intellectuelle et plus particulièrement par le droit d'auteur.
                    </Text>
                </Section>

                <Section title="10. Données personnelles" colors={colors}>
                    <Text style={[styles.text, { color: colors.textSecondary }]}>
                        Les informations demandées à la création du compte sont nécessaires et obligatoires pour la création du compte de l'Utilisateur. En particulier, l'adresse email pourra être utilisée par le site pour l'administration, la gestion et l'animation du service.
                    </Text>
                </Section>

                <Section title="11. Loi applicable" colors={colors}>
                    <Text style={[styles.text, { color: colors.textSecondary }]}>
                        Les présentes conditions sont régies par la loi française. En cas de litige, et à défaut d'accord amiable, les tribunaux français seront seuls compétents.
                    </Text>
                </Section>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textTertiary }]}>Umade SAS - 12 Rue de la Paix, 75000 Paris</Text>
                    <Text style={[styles.footerText, { color: colors.textTertiary }]}>RCS Paris B 123 456 789</Text>
                </View>

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
    lastUpdated: {
        fontSize: Layout.fontSize.xs,
        marginBottom: Layout.spacing.xl,
        textAlign: 'center',
    },
    section: {
        marginBottom: Layout.spacing.xl,
    },
    sectionTitle: {
        fontSize: Layout.fontSize.lg,
        fontWeight: '700',
        marginBottom: Layout.spacing.sm,
    },
    text: {
        fontSize: Layout.fontSize.sm,
        lineHeight: 22,
        textAlign: 'justify',
    },
    bold: {
        fontWeight: '700',
    },
    footer: {
        marginTop: Layout.spacing.xl,
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: Layout.fontSize.xs,
    }
});
