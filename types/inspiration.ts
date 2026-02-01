/**
 * Types pour les inspirations (Phase 9)
 */

// ============================================
// Enums et constantes
// ============================================

export const EVENT_TYPES = {
  wedding: 'Mariage',
  birthday: 'Anniversaire',
  corporate: 'Entreprise',
  baptism: 'Bapteme',
  communion: 'Communion',
  baby_shower: 'Baby Shower',
  engagement: 'Fiancailles',
  graduation: 'Remise de diplome',
  retirement: 'Retraite',
  other: 'Autre',
} as const;

export const INSPIRATION_STYLES = {
  modern: 'Moderne',
  rustic: 'Rustique',
  bohemian: 'Boheme',
  classic: 'Classique',
  minimalist: 'Minimaliste',
  luxe: 'Luxueux',
  tropical: 'Tropical',
  vintage: 'Vintage',
  industrial: 'Industriel',
  romantic: 'Romantique',
} as const;

export type EventType = keyof typeof EVENT_TYPES;
export type InspirationStyle = keyof typeof INSPIRATION_STYLES;

// ============================================
// Types de base
// ============================================

export interface InspirationImage {
  id: string;
  inspiration_id: string;
  image_url: string;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  display_order: number;
  created_at: string | null;
}

export interface Inspiration {
  id: string;
  provider_id: string;
  title: string | null;
  description: string | null;
  event_type: EventType;
  style: InspirationStyle | null;
  tags: string[] | null;
  view_count: number;
  favorite_count: number;
  share_count: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface InspirationFavorite {
  id: string;
  user_id: string;
  inspiration_id: string;
  created_at: string | null;
}

// ============================================
// Types avec relations
// ============================================

export interface InspirationWithImages extends Inspiration {
  inspiration_images: InspirationImage[];
}

export interface InspirationWithProvider extends InspirationWithImages {
  providers?: {
    id: string;
    business_name: string;
    profiles?: {
      avatar_url: string | null;
      full_name: string | null;
    };
    categories?: {
      name: string;
      slug: string;
    };
  };
}

export interface InspirationDetail extends InspirationWithProvider {
  is_favorite?: boolean;
}

// ============================================
// Filtres et recherche
// ============================================

export interface InspirationFilters {
  event_type?: EventType | null;
  style?: InspirationStyle | null;
  searchQuery?: string;
  providerId?: string;
}

export type InspirationSortBy = 'recent' | 'popular' | 'trending';

export const SORT_OPTIONS: Record<InspirationSortBy, string> = {
  recent: 'Recent',
  popular: 'Populaire',
  trending: 'Tendance',
};

// ============================================
// Inputs pour mutations
// ============================================

export interface CreateInspirationInput {
  title: string;
  description?: string;
  event_type: EventType;
  style?: InspirationStyle;
  tags?: string[];
}

export interface InspirationImageInput {
  uri: string;
  width?: number;
  height?: number;
}

// ============================================
// Helpers
// ============================================

export function getEventTypeLabel(type: EventType): string {
  return EVENT_TYPES[type] || type;
}

export function getStyleLabel(style: InspirationStyle): string {
  return INSPIRATION_STYLES[style] || style;
}

export function getEventTypeOptions(): { value: EventType; label: string }[] {
  return Object.entries(EVENT_TYPES).map(([value, label]) => ({
    value: value as EventType,
    label,
  }));
}

export function getStyleOptions(): { value: InspirationStyle; label: string }[] {
  return Object.entries(INSPIRATION_STYLES).map(([value, label]) => ({
    value: value as InspirationStyle,
    label,
  }));
}
