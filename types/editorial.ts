import { Database } from './database';

export type EditorialArticle =
  Database['public']['Tables']['editorial_articles']['Row'];

export interface EditorialArticleListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  category: string;
  tags: string[] | null;
  event_types: string[] | null;
  author_name: string | null;
  author_avatar_url: string | null;
  published_at: string | null;
  view_count: number | null;
  featured: boolean | null;
}

export const EDITORIAL_CATEGORIES = [
  { key: 'all', label: 'Tous' },
  { key: 'conseils', label: 'Conseils' },
  { key: 'tendances', label: 'Tendances' },
  { key: 'inspiration', label: 'Inspiration' },
  { key: 'budget', label: 'Budget' },
  { key: 'organisation', label: 'Organisation' },
] as const;

export type EditorialCategory = (typeof EDITORIAL_CATEGORIES)[number]['key'];
