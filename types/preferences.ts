/**
 * Types pour les préférences utilisateur, checklist et badges (Phase 10)
 */

// ============================================
// Event Types
// ============================================

export type EventType =
  | 'wedding'
  | 'birthday'
  | 'baptism'
  | 'corporate'
  | 'graduation'
  | 'other';

export type EventTimeline =
  | 'less_than_3_months'
  | '3_to_6_months'
  | '6_to_12_months'
  | 'just_looking';

export type StylePreference =
  | 'bohemian'
  | 'classic'
  | 'modern'
  | 'vintage'
  | 'luxe'
  | 'minimalist'
  | 'rustic';

export type BudgetRange = 'small' | 'medium' | 'large' | 'premium';

// ============================================
// User Preferences
// ============================================

export interface UserPreferences {
  id: string;
  user_id: string;
  event_type: EventType | null;
  event_name: string | null;
  event_date: string | null;
  event_timeline: EventTimeline | null;
  preferred_styles: StylePreference[];
  budget_range: BudgetRange | null;
  location: string | null;
  guest_count: number | null;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Checklist
// ============================================

export type ChecklistStatus = 'todo' | 'in_progress' | 'done';

export interface ChecklistItem {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string | null;
  status: ChecklistStatus;
  provider_id: string | null;
  booking_id: string | null;
  display_order: number;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  provider?: {
    id: string;
    business_name: string;
  };
  booking?: {
    id: string;
    status: string;
  };
}

export interface ChecklistCategory {
  name: string;
  icon: string;
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
}

// ============================================
// Badges & Gamification
// ============================================

export type BadgeCategory =
  | 'engagement'
  | 'exploration'
  | 'booking'
  | 'social'
  | 'special';

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  points: number;
  is_secret: boolean;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  badge: Badge;
  earned_at: string;
  seen_at: string | null;
}

// ============================================
// Provider Stats (Social Proof)
// ============================================

export interface ProviderStats {
  provider_id: string;
  views_this_week: number;
  contacts_this_week: number;
  avg_response_time: number | null; // in minutes
  response_rate: number | null; // 0-100
  current_viewers: number;
  last_booking_at: string | null;
  last_booking_client_name: string | null;
}

// ============================================
// Options avec labels FR
// ============================================

export const EVENT_TYPE_OPTIONS: { value: EventType; label: string; emoji: string }[] = [
  { value: 'wedding', label: 'Mariage', emoji: '💒' },
  { value: 'birthday', label: 'Anniversaire', emoji: '🎂' },
  { value: 'baptism', label: 'Baptême', emoji: '👶' },
  { value: 'graduation', label: 'Diplôme', emoji: '🎓' },
  { value: 'corporate', label: 'Corporate', emoji: '🏢' },
  { value: 'other', label: 'Autre', emoji: '🎉' },
];

export const TIMELINE_OPTIONS: { value: EventTimeline; label: string; emoji: string }[] = [
  { value: 'less_than_3_months', label: 'Moins de 3 mois', emoji: '⚡' },
  { value: '3_to_6_months', label: '3 à 6 mois', emoji: '📅' },
  { value: '6_to_12_months', label: '6 à 12 mois', emoji: '🗓️' },
  { value: 'just_looking', label: 'Je regarde juste', emoji: '👀' },
];

export const STYLE_OPTIONS: { value: StylePreference; label: string; image: string }[] = [
  { value: 'bohemian', label: 'Bohème', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400' },
  { value: 'classic', label: 'Classique', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400' },
  { value: 'modern', label: 'Moderne', image: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=400' },
  { value: 'vintage', label: 'Vintage', image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400' },
  { value: 'luxe', label: 'Luxe', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400' },
  { value: 'minimalist', label: 'Minimaliste', image: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=400' },
  { value: 'rustic', label: 'Rustique', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400' },
];

export const BUDGET_OPTIONS: { value: BudgetRange; label: string; range: string }[] = [
  { value: 'small', label: 'Petit budget', range: '< 5 000€' },
  { value: 'medium', label: 'Budget moyen', range: '5 000€ - 15 000€' },
  { value: 'large', label: 'Grand budget', range: '15 000€ - 30 000€' },
  { value: 'premium', label: 'Premium', range: '30 000€+' },
];

export const GUEST_COUNT_OPTIONS = [
  { value: 20, label: 'Intime', range: '< 30 invités' },
  { value: 50, label: 'Moyen', range: '30 - 80 invités' },
  { value: 100, label: 'Grand', range: '80 - 150 invités' },
  { value: 200, label: 'Très grand', range: '150+ invités' },
];

// ============================================
// Default checklists par type d'événement
// ============================================

export const DEFAULT_CHECKLIST_ITEMS: Record<EventType, { category: string; title: string; icon: string }[]> = {
  wedding: [
    { category: 'Lieu', title: 'Trouver le lieu de réception', icon: '🏰' },
    { category: 'Lieu', title: 'Réserver le lieu de cérémonie', icon: '⛪' },
    { category: 'Photo/Vidéo', title: 'Réserver un photographe', icon: '📸' },
    { category: 'Photo/Vidéo', title: 'Réserver un vidéaste', icon: '🎥' },
    { category: 'Traiteur', title: 'Choisir le traiteur', icon: '🍽️' },
    { category: 'Musique', title: 'Réserver DJ ou groupe', icon: '🎵' },
    { category: 'Décoration', title: 'Décoration & fleurs', icon: '💐' },
    { category: 'Tenue', title: 'Robe de mariée', icon: '👰' },
    { category: 'Tenue', title: 'Costume du marié', icon: '🤵' },
    { category: 'Administratif', title: 'Faire-part & invitations', icon: '💌' },
  ],
  birthday: [
    { category: 'Lieu', title: 'Réserver le lieu', icon: '🏠' },
    { category: 'Traiteur', title: 'Commander le gâteau', icon: '🎂' },
    { category: 'Traiteur', title: 'Organiser le buffet', icon: '🍕' },
    { category: 'Animation', title: 'Animations & jeux', icon: '🎮' },
    { category: 'Décoration', title: 'Décoration', icon: '🎈' },
    { category: 'Musique', title: 'Playlist ou DJ', icon: '🎵' },
  ],
  baptism: [
    { category: 'Cérémonie', title: 'Réserver l\'église', icon: '⛪' },
    { category: 'Lieu', title: 'Lieu de réception', icon: '🏠' },
    { category: 'Traiteur', title: 'Traiteur ou buffet', icon: '🍽️' },
    { category: 'Photo/Vidéo', title: 'Photographe', icon: '📸' },
    { category: 'Décoration', title: 'Décoration', icon: '🎀' },
    { category: 'Administratif', title: 'Faire-part', icon: '💌' },
  ],
  graduation: [
    { category: 'Lieu', title: 'Réserver le lieu', icon: '🏠' },
    { category: 'Traiteur', title: 'Traiteur ou buffet', icon: '🍽️' },
    { category: 'Photo/Vidéo', title: 'Photographe', icon: '📸' },
    { category: 'Décoration', title: 'Décoration', icon: '🎓' },
  ],
  corporate: [
    { category: 'Lieu', title: 'Réserver la salle', icon: '🏢' },
    { category: 'Traiteur', title: 'Traiteur', icon: '🍽️' },
    { category: 'Technique', title: 'Équipement audiovisuel', icon: '🎤' },
    { category: 'Animation', title: 'Animation team building', icon: '🎯' },
    { category: 'Photo/Vidéo', title: 'Photographe corporate', icon: '📸' },
  ],
  other: [
    { category: 'Lieu', title: 'Trouver un lieu', icon: '📍' },
    { category: 'Traiteur', title: 'Organiser la restauration', icon: '🍽️' },
    { category: 'Décoration', title: 'Décoration', icon: '✨' },
    { category: 'Animation', title: 'Animations', icon: '🎉' },
  ],
};

// ============================================
// Helpers
// ============================================

export function getEventTypeLabel(type: EventType): string {
  return EVENT_TYPE_OPTIONS.find(o => o.value === type)?.label ?? type;
}

export function getEventTypeEmoji(type: EventType): string {
  return EVENT_TYPE_OPTIONS.find(o => o.value === type)?.emoji ?? '🎉';
}

export function getTimelineLabel(timeline: EventTimeline): string {
  return TIMELINE_OPTIONS.find(o => o.value === timeline)?.label ?? timeline;
}

export function getStyleLabel(style: StylePreference): string {
  return STYLE_OPTIONS.find(o => o.value === style)?.label ?? style;
}

export function getBudgetLabel(budget: BudgetRange): string {
  const option = BUDGET_OPTIONS.find(o => o.value === budget);
  return option ? `${option.label} (${option.range})` : budget;
}

export function formatResponseTime(minutes: number | null): string {
  if (minutes === null) return '';
  if (minutes < 60) return 'moins d\'1h';
  if (minutes < 120) return '~1h';
  if (minutes < 180) return '~2h';
  if (minutes < 360) return '~${Math.round(minutes / 60)}h';
  if (minutes < 1440) return 'moins de 24h';
  return `~${Math.round(minutes / 1440)} jour(s)`;
}

export function getDaysUntilEvent(eventDate: string | null): number | null {
  if (!eventDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const event = new Date(eventDate);
  event.setHours(0, 0, 0, 0);
  const diffTime = event.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
