/**
 * Composant pour afficher le contexte d'une inspiration dans le chat
 * S'affiche quand un message est de type "inspiration_context"
 */

import { Colors } from '@/constants/Colors';
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
    const handlePress = () => {
        router.push(`/inspiration/${data.inspiration_id}`);
    };

    return (
        <View style={[styles.container, isOwn && styles.containerOwn]}>
            <Pressable onPress={handlePress} style={styles.card}>
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
                        <Sparkles size={14} color={Colors.primary.DEFAULT} />
                        <Text style={styles.label}>Inspiration partagee</Text>
                    </View>

                    <Text style={styles.title} numberOfLines={1}>
                        {data.title || 'Publication'}
                    </Text>

                    <View style={styles.viewLink}>
                        <Text style={styles.viewLinkText} numberOfLines={1}>
                            Voir la publication
                        </Text>
                        <ExternalLink size={12} color={Colors.primary.DEFAULT} />
                    </View>
                </View>
            </Pressable>

            {/* Message optionnel */}
            {data.message && (
                <View style={[styles.messageBubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
                    <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
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
        backgroundColor: Colors.white,
        borderRadius: Layout.radius.lg,
        overflow: 'hidden',
        width: '100%',
        borderWidth: 1,
        borderColor: Colors.gray[200],
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
        color: Colors.primary.DEFAULT,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    title: {
        fontSize: 13,
        fontFamily: fontFamily.semiBold,
        color: Colors.text.primary,
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
        color: Colors.primary.DEFAULT,
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
        backgroundColor: Colors.primary.DEFAULT,
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        backgroundColor: Colors.gray[100],
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: Layout.fontSize.md,
        color: Colors.text.primary,
        lineHeight: 22,
    },
    messageTextOwn: {
        color: Colors.white,
    },
});
