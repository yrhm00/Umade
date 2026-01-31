import { SwipeableConversationItem } from '@/components/chat/SwipeableConversationItem';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useHideConversation, usePinConversation } from '@/hooks/useConversations';
import { useProviderConversations } from '@/hooks/useProviderStats';
import { useRealtimeConversations } from '@/hooks/useRealtimeMessages';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProviderMessagesScreen() {
    const router = useRouter();
    const { data: conversations, isLoading, refetch, isRefetching } =
        useProviderConversations();

    const { mutate: pinConversation } = usePinConversation();
    const { mutate: hideConversation } = useHideConversation();

    // Real-time subscription for new messages
    useRealtimeConversations();

    const handlePin = useCallback((id: string, currentPinnedState: boolean) => {
        pinConversation({ conversationId: id, isPinned: !currentPinnedState });
    }, [pinConversation]);

    const handleHide = useCallback((id: string) => {
        hideConversation(id);
    }, [hideConversation]);

    const renderItem = useCallback(
        ({ item }: { item: any }) => (
            <SwipeableConversationItem
                conversation={item}
                isPinned={(item as any).isPinned}
                onPin={handlePin}
                onHide={handleHide}
            />
        ),
        [handlePin, handleHide]
    );

    const keyExtractor = useCallback(
        (item: any) => item.id,
        []
    );

    const ItemSeparator = useCallback(
        () => <View style={styles.separator} />,
        []
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Messages</Text>
                <View style={styles.placeholder} />
            </View>

            {isLoading ? (
                <LoadingSpinner fullScreen message="Chargement..." />
            ) : conversations && conversations.length > 0 ? (
                <FlatList
                    data={conversations}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={ItemSeparator}
                    onRefresh={refetch}
                    refreshing={isRefetching}
                />
            ) : (
                <EmptyState
                    icon="💬"
                    title="Aucune conversation"
                    description="Vos conversations avec les clients apparaîtront ici."
                />
            )}
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
        borderBottomColor: Colors.gray[100],
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: Layout.fontSize['xl'],
        fontWeight: '700',
        color: Colors.text.primary,
    },
    placeholder: {
        width: 40,
    },
    list: {
        paddingVertical: Layout.spacing.sm,
    },
    separator: {
        height: 1,
        backgroundColor: Colors.gray[100],
        marginLeft: Layout.spacing.lg + 56 + Layout.spacing.md,
    },
});
