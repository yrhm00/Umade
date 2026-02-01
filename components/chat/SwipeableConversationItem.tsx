import { useColors } from '@/hooks/useColors';
import { ConversationWithDetails } from '@/types';
import { Pin, Trash2 } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { ConversationCard } from './ConversationCard';

interface SwipeableConversationItemProps {
    conversation: ConversationWithDetails;
    isPinned?: boolean;
    onPin: (id: string, currentPinnedState: boolean) => void;
    onHide: (id: string) => void;
}

export const SwipeableConversationItem = ({
    conversation,
    isPinned,
    onPin,
    onHide,
}: SwipeableConversationItemProps) => {
    const swipeableRef = useRef<Swipeable>(null);
    const colors = useColors();

    const close = () => {
        swipeableRef.current?.close();
    };

    const renderLeftActions = (
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const trans = dragX.interpolate({
            inputRange: [0, 80],
            outputRange: [-80, 0],
            extrapolate: 'clamp',
        });

        return (
            <View style={{ width: 80 }}>
                <Animated.View style={[styles.actionContainer, { transform: [{ translateX: trans }] }]}>
                    <RectButton
                        style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
                        onPress={() => {
                            onPin(conversation.id, !!isPinned);
                            close();
                        }}
                    >
                        <Pin size={24} color="#FFFFFF" fill={isPinned ? '#FFFFFF' : 'none'} />
                        <Text style={styles.actionText}>{isPinned ? 'Détacher' : 'Épingler'}</Text>
                    </RectButton>
                </Animated.View>
            </View>
        );
    };

    const renderRightActions = (
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const trans = dragX.interpolate({
            inputRange: [-80, 0],
            outputRange: [0, 80],
            extrapolate: 'clamp',
        });

        return (
            <View style={{ width: 80 }}>
                <Animated.View style={[styles.actionContainer, { transform: [{ translateX: trans }] }]}>
                    <RectButton
                        style={[styles.actionButton, { backgroundColor: colors.error }]}
                        onPress={() => {
                            onHide(conversation.id);
                            close();
                        }}
                    >
                        <Trash2 size={24} color="#FFFFFF" />
                        <Text style={styles.actionText}>Supprimer</Text>
                    </RectButton>
                </Animated.View>
            </View>
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            renderLeftActions={renderLeftActions}
            renderRightActions={renderRightActions}
            friction={2}
            overshootRight={false}
            overshootLeft={false}
        >
            <View style={[styles.cardContainer, { backgroundColor: colors.card }]}>
                <ConversationCard conversation={conversation} />
                {isPinned && (
                    <View style={styles.pinnedMarker}>
                        <Pin size={12} color="#FFFFFF" fill="#FFFFFF" />
                    </View>
                )}
            </View>
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    actionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButton: {
        width: 80,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
    },
    cardContainer: {
    },
    pinnedMarker: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#3B82F6',
        borderBottomLeftRadius: 8,
        padding: 4,
        zIndex: 10,
    },
});
