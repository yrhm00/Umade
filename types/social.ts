/**
 * Types pour le Feed Social
 * Partage d'événements réalisés par la communauté
 */

export interface SocialPost {
  id: string;
  user_id: string;
  provider_id?: string | null;
  event_id?: string | null;
  content?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  location?: string | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialPostImage {
  id: string;
  post_id: string;
  image_url: string;
  thumbnail_url?: string | null;
  width?: number | null;
  height?: number | null;
  display_order: number;
  created_at: string;
}

export interface SocialPostWithDetails extends SocialPost {
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  providers?: {
    id: string;
    business_name: string;
  } | null;
  social_post_images?: SocialPostImage[];
}

export interface SocialPostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface SocialPostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  like_count: number;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentWithUser extends SocialPostComment {
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  replies?: CommentWithUser[];
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface CreateSocialPostInput {
  content?: string;
  event_type?: string;
  event_date?: string;
  location?: string;
  event_id?: string;
  images: { uri: string; width?: number; height?: number }[];
}

export interface CreateCommentInput {
  post_id: string;
  content: string;
  parent_id?: string;
}

export type SocialFeedSortBy = 'recent' | 'popular' | 'following';

export interface SocialFeedFilters {
  event_type?: string;
  following_only?: boolean;
  user_id?: string;
}
