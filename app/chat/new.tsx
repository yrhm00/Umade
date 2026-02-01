/**
 * New Conversation Screen
 * Dark Mode Support
 */

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useColors } from '@/hooks/useColors';
import { useFindOrCreateConversation } from '@/hooks/useConversations';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

export default function NewConversationScreen() {
  const router = useRouter();
  const colors = useColors();
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const { mutate: findOrCreate, isPending, error } =
    useFindOrCreateConversation();

  useEffect(() => {
    if (!providerId) {
      router.back();
      return;
    }

    findOrCreate(providerId, {
      onSuccess: (conversation) => {
        router.replace(`/chat/${conversation.id}`);
      },
      onError: () => {
        router.back();
      },
    });
  }, [providerId, findOrCreate, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LoadingSpinner
        fullScreen
        message={
          error
            ? 'Erreur lors de la création de la conversation'
            : 'Ouverture de la conversation...'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
