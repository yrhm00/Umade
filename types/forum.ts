/**
 * Types pour le Forum/Q&A
 * Questions et réponses communautaires
 */

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  display_order: number;
  post_count: number;
  is_active: boolean;
  created_at: string;
}

export interface ForumQuestion {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  content: string;
  tags: string[];
  view_count: number;
  upvote_count: number;
  downvote_count: number;
  answer_count: number;
  accepted_answer_id?: string | null;
  is_solved: boolean;
  is_pinned: boolean;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ForumQuestionWithDetails extends ForumQuestion {
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  forum_categories?: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  };
  user_vote?: VoteType | null;
}

export interface ForumAnswer {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  upvote_count: number;
  downvote_count: number;
  is_accepted: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface ForumAnswerWithUser extends ForumAnswer {
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  user_vote?: VoteType | null;
}

export type VoteType = 'up' | 'down';

export interface ForumQuestionVote {
  id: string;
  question_id: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
}

export interface ForumAnswerVote {
  id: string;
  answer_id: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
}

export interface CreateQuestionInput {
  category_id: string;
  title: string;
  content: string;
  tags?: string[];
}

export interface CreateAnswerInput {
  question_id: string;
  content: string;
}

export type ForumSortBy = 'recent' | 'popular' | 'unanswered' | 'solved';

export interface ForumFilters {
  category_id?: string;
  tags?: string[];
  is_solved?: boolean;
  search_query?: string;
}

// Default forum categories
export const DEFAULT_FORUM_CATEGORIES = [
  { name: 'Mariage', slug: 'mariage', icon: 'heart' },
  { name: 'Anniversaire', slug: 'anniversaire', icon: 'cake' },
  { name: 'Corporate', slug: 'corporate', icon: 'briefcase' },
  { name: 'Décoration', slug: 'decoration', icon: 'palette' },
  { name: 'Budget', slug: 'budget', icon: 'wallet' },
  { name: 'Organisation', slug: 'organisation', icon: 'calendar' },
  { name: 'Autre', slug: 'autre', icon: 'help-circle' },
];
