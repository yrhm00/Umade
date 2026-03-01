/**
 * Types pour les Stories Prestataires
 * Contenu éphémère qui expire après 24h
 */

export interface ProviderStory {
  id: string;
  provider_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string | null;
  caption?: string | null;
  duration_seconds: number;
  view_count: number;
  expires_at: string;
  created_at: string;
}

export interface StoryWithProvider extends ProviderStory {
  providers?: {
    id: string;
    business_name: string;
    profiles?: {
      avatar_url: string | null;
      full_name: string | null;
    };
  };
}

export interface StoryView {
  id: string;
  story_id: string;
  user_id: string;
  viewed_at: string;
}

export interface UserStoryProgress {
  id: string;
  user_id: string;
  provider_id: string;
  last_seen_story_id: string | null;
  last_seen_at: string;
}

export interface ProviderStoriesGroup {
  provider: {
    id: string;
    business_name: string;
    avatar_url: string | null;
  };
  stories: StoryWithProvider[];
  hasUnseenStories: boolean;
  lastStoryAt: string;
}

export interface CreateStoryInput {
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string;
  caption?: string;
  duration_seconds?: number;
}
