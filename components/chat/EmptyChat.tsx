import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

export function EmptyChat() {
  return (
    <View style={styles.container}>
      <MessageCircle size={48} color={Colors.gray[300]} />
      <Text style={styles.title}>Aucun message</Text>
      <Text style={styles.subtitle}>
        Commencez la conversation en envoyant un message
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
    // inverted FlatList: empty component is flipped, so we rotate it back
    transform: [{ scaleY: -1 }],
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: Layout.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Layout.spacing.xs,
    textAlign: 'center',
  },
});
