import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFindOrCreateConversation } from '@/hooks/useConversations';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';

export default function NewConversationScreen() {
  const router = useRouter();
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
        // Replace current screen so back button goes to previous page, not this loading screen
        router.replace(`/chat/${conversation.id}`);
      },
      onError: () => {
        router.back();
      },
    });
  }, [providerId, findOrCreate, router]);

  return (
    <View style={styles.container}>
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
    backgroundColor: Colors.background.primary,
  },
});
