/**
 * Composant pour afficher le contexte d'une inspiration dans le chat
 * S'affiche quand un message est de type "inspiration_context"
 */

import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
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
                />

                {/* Contenu */}
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Sparkles size={14} color={Colors.primary.DEFAULT} />
                        <Text style={styles.label}>Inspiration</Text>
                    </View>

                    <Text style={styles.title} numberOfLines={2}>
                        {data.title || 'Publication'}
                    </Text>

                    <View style={styles.viewLink}>
                        <Text style={styles.viewLinkText}>Voir l'inspiration</Text>
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
        marginBottom: Layout.spacing.sm,
        paddingHorizontal: Layout.spacing.md,
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
        maxWidth: '85%',
        borderWidth: 1,
        borderColor: Colors.gray[200],
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    image: {
        width: 80,
        height: 80,
    },
    content: {
        flex: 1,
        padding: Layout.spacing.sm,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.primary.DEFAULT,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.text.primary,
        lineHeight: 18,
    },
    viewLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewLinkText: {
        fontSize: 11,
        color: Colors.primary.DEFAULT,
        fontWeight: '500',
    },
    messageBubble: {
        marginTop: Layout.spacing.xs,
        paddingVertical: Layout.spacing.sm,
        paddingHorizontal: Layout.spacing.md,
        borderRadius: Layout.radius.lg,
        maxWidth: '85%',
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
