import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { useConversation } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/constants/Layout';
import { goBackOrFallback } from '@/lib/navigation';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';

interface ChatHeaderProps {
  conversationId: string;
}

export const ChatHeader = React.memo(function ChatHeader({
  conversationId,
}: ChatHeaderProps) {
  const router = useRouter();
  const { userId } = useAuth();
  const colors = useColors();
  const isDark = useIsDarkTheme();
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
    <View style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={[
          styles.backButton,
          { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary },
        ]}
        onPress={() => goBackOrFallback(router)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ArrowLeft size={24} color={colors.text} />
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
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
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
    borderBottomWidth: 1,
    gap: Layout.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.radius.md,
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
  },
});
