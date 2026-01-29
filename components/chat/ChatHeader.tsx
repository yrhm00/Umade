import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { useConversation } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface ChatHeaderProps {
  conversationId: string;
}

export const ChatHeader = React.memo(function ChatHeader({
  conversationId,
}: ChatHeaderProps) {
  const router = useRouter();
  const { userId } = useAuth();
  const { data: conversation } = useConversation(conversationId);

  const isClient = conversation?.client_id === userId;
  const displayName = isClient
    ? conversation?.provider?.business_name || 'Prestataire'
    : conversation?.client?.full_name || 'Client';
  const avatarUrl = isClient
    ? undefined
    : conversation?.client?.avatar_url ?? undefined;

  const providerId = conversation?.provider?.id;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ArrowLeft size={24} color={Colors.text.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.info}
        onPress={() => {
          if (isClient && providerId) {
            router.push(`/provider/${providerId}`);
          }
        }}
        disabled={!isClient || !providerId}
        activeOpacity={isClient ? 0.7 : 1}
      >
        <Avatar source={avatarUrl} name={displayName} size="md" />
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    gap: Layout.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.radius.md,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});
