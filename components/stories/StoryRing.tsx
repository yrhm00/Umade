/**
 * StoryRing - Avatar avec ring gradient pour les stories
 * Le ring est coloré si des stories non vues, gris sinon
 */

import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface StoryRingProps {
  avatarUrl: string | null;
  name: string;
  hasUnseenStories: boolean;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  isAddButton?: boolean;
}

const SIZES = {
  sm: { ring: 56, avatar: 48, border: 2 },
  md: { ring: 72, avatar: 64, border: 3 },
  lg: { ring: 88, avatar: 80, border: 3 },
};

export function StoryRing({
  avatarUrl,
  name,
  hasUnseenStories,
  onPress,
  size = 'md',
  showName = true,
  isAddButton = false,
}: StoryRingProps) {
  const colors = useColors();
  const dimensions = SIZES[size];

  const gradientColors = hasUnseenStories
    ? ([Colors.primary.DEFAULT, '#9333EA', '#EC4899'] as const) // Purple to pink gradient
    : ([colors.border, colors.border] as const); // Gray ring for seen stories

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.ring,
          {
            width: dimensions.ring,
            height: dimensions.ring,
            borderRadius: dimensions.ring / 2,
            padding: dimensions.border,
          },
        ]}
      >
        <View
          style={[
            styles.avatarContainer,
            {
              backgroundColor: colors.background,
              borderRadius: (dimensions.ring - dimensions.border * 2) / 2,
              padding: 2,
            },
          ]}
        >
          {isAddButton ? (
            <View
              style={[
                styles.addButton,
                {
                  width: dimensions.avatar,
                  height: dimensions.avatar,
                  borderRadius: dimensions.avatar / 2,
                  backgroundColor: colors.backgroundTertiary,
                },
              ]}
            >
              <Text style={[styles.addIcon, { color: colors.primary }]}>+</Text>
            </View>
          ) : (
            <Avatar
              source={avatarUrl}
              name={name}
              size={size === 'sm' ? 'md' : 'lg'}
            />
          )}
        </View>
      </LinearGradient>

      {showName && (
        <Text
          style={[styles.name, { color: colors.text }]}
          numberOfLines={1}
        >
          {isAddButton ? 'Ajouter' : name.split(' ')[0]}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 80,
  },
  ring: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 32,
    fontWeight: '300',
  },
  name: {
    marginTop: Layout.spacing.xs,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
