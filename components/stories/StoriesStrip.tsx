/**
 * StoriesStrip - Barre horizontale de stories en haut de l'écran
 * Affiche les avatars des prestataires avec leurs stories
 */

import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useColors } from '@/hooks/useColors';
import { useStoriesFeed } from '@/hooks/useStories';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { StoryRing } from './StoryRing';
import { StoryViewer } from './StoryViewer';

interface StoriesStripProps {
  onCreateStory?: () => void;
}

export function StoriesStrip({ onCreateStory }: StoriesStripProps) {
  const colors = useColors();
  const { isProvider } = useAuth();
  const { data: storiesGroups } = useStoriesFeed();
  const hasStories = (storiesGroups?.length ?? 0) > 0;

  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

  const handleStoryPress = useCallback((index: number) => {
    setSelectedGroupIndex(index);
    setViewerVisible(true);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setViewerVisible(false);
  }, []);

  const handleNextGroup = useCallback(() => {
    if (storiesGroups && selectedGroupIndex < storiesGroups.length - 1) {
      setSelectedGroupIndex(selectedGroupIndex + 1);
    } else {
      setViewerVisible(false);
    }
  }, [storiesGroups, selectedGroupIndex]);

  const handlePreviousGroup = useCallback(() => {
    if (selectedGroupIndex > 0) {
      setSelectedGroupIndex(selectedGroupIndex - 1);
    }
  }, [selectedGroupIndex]);

  const handleAddStory = useCallback(() => {
    if (onCreateStory) {
      onCreateStory();
    } else {
      router.push('/story/create' as any);
    }
  }, [onCreateStory]);

  // Cote client: ne rien afficher tant qu'il n'y a pas de stories.
  // Cela evite le spinner "vide" en haut de l'ecran.
  if (!isProvider && !hasStories) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Bouton ajouter pour les prestataires */}
        {isProvider && (
          <StoryRing
            avatarUrl={null}
            name="Ajouter"
            hasUnseenStories={false}
            onPress={handleAddStory}
            isAddButton
          />
        )}

        {/* Stories des prestataires */}
        {storiesGroups?.map((group, index) => (
          <StoryRing
            key={group.provider.id}
            avatarUrl={group.provider.avatar_url}
            name={group.provider.business_name}
            hasUnseenStories={group.hasUnseenStories}
            onPress={() => handleStoryPress(index)}
          />
        ))}
      </ScrollView>

      {/* Story Viewer Modal */}
      {viewerVisible && storiesGroups && storiesGroups.length > 0 && (
        <StoryViewer
          visible={viewerVisible}
          storiesGroup={storiesGroups[selectedGroupIndex]}
          onClose={handleCloseViewer}
          onNextGroup={handleNextGroup}
          onPreviousGroup={handlePreviousGroup}
          hasNextGroup={selectedGroupIndex < storiesGroups.length - 1}
          hasPreviousGroup={selectedGroupIndex > 0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  scrollContent: {
    paddingLeft: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
});
