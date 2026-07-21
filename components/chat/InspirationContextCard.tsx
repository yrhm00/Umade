/**
 * Composant pour afficher le contexte d'une inspiration dans le chat
 * S'affiche quand un message est de type "inspiration_context"
 */

import { Colors } from '@/constants/Colors';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ExternalLink, Sparkles } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface InspirationContextData {
    type: 'inspiration_context';
    inspiration_id: string;
    title: string;
    image_url: string;
    message?: string;
}

interface InspirationContextCardProps {
    data: InspirationContextData;
    isOwn: boolean;
}

export function parseInspirationContext(content: string): InspirationContextData | null {
    try {
        const parsed = JSON.parse(content);
        if (parsed?.type === 'inspiration_context') {
            return parsed as InspirationContextData;
        }
        return null;
    } catch {
        return null;
    }
}

export function InspirationContextCard({ data, isOwn }: InspirationContextCardProps) {
    const colors = useColors();
    const isDark = useIsDarkTheme();
    const handlePress = () => {
        router.push(`/inspiration/${data.inspiration_id}`);
    };

    return (
        <View style={[styles.container, isOwn && styles.containerOwn]}>
            <Pressable onPress={handlePress} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                {/* Image miniature */}
                <Image
                    source={{ uri: data.image_url }}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                    placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
                />

                {/* Contenu */}
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Sparkles size={14} color={colors.primary} />
                        <Text style={[styles.label, { color: colors.primary }]}>Inspiration partagee</Text>
                    </View>

                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                        {data.title || 'Publication'}
                    </Text>

                    <View style={styles.viewLink}>
                        <Text style={[styles.viewLinkText, { color: colors.primary }]} numberOfLines={1}>
                            Voir la publication
                        </Text>
                        <ExternalLink size={12} color={colors.primary} />
                    </View>
                </View>
            </Pressable>

            {/* Message optionnel */}
            {data.message && (
                <View style={[styles.messageBubble, isOwn ? [styles.bubbleOwn, { backgroundColor: colors.primary }] : [styles.bubbleOther, { backgroundColor: isDark ? colors.backgroundTertiary : Colors.gray[100] }]]}>
                    <Text style={[styles.messageText, { color: colors.text }, isOwn && styles.messageTextOwn]}>
                        {data.message}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Layout.spacing.xs,
        alignItems: 'flex-start',
    },
    containerOwn: {
        alignItems: 'flex-end',
    },
    card: {
        flexDirection: 'row',
        borderRadius: Layout.radius.lg,
        overflow: 'hidden',
        width: '100%',
        borderWidth: 1,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    image: {
        width: 84,
        height: 84,
    },
    content: {
        flex: 1,
        minWidth: 0,
        minHeight: 84,
        paddingHorizontal: Layout.spacing.sm,
        paddingVertical: Layout.spacing.sm,
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    label: {
        fontSize: 10,
        fontFamily: fontFamily.semiBold,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    title: {
        fontSize: 13,
        fontFamily: fontFamily.semiBold,
        lineHeight: 17,
    },
    viewLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
        minWidth: 0,
    },
    viewLinkText: {
        fontSize: 11,
        fontFamily: fontFamily.medium,
        flexShrink: 1,
    },
    messageBubble: {
        marginTop: Layout.spacing.xs,
        paddingVertical: Layout.spacing.sm,
        paddingHorizontal: Layout.spacing.md,
        borderRadius: Layout.radius.lg,
        maxWidth: '100%',
    },
    bubbleOwn: {
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: Layout.fontSize.md,
        lineHeight: 22,
    },
    messageTextOwn: {
        color: Colors.white,
    },
});
