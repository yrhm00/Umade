/**
 * Types pour les fonctionnalités événement avancées
 * Budget, Invités, Plan de table, Timeline, Checklist
 */

// ============================================
// BUDGET TRACKER
// ============================================

export type BudgetCategory =
  | 'venue'
  | 'catering'
  | 'decoration'
  | 'photography'
  | 'music'
  | 'flowers'
  | 'attire'
  | 'transportation'
  | 'invitations'
  | 'gifts'
  | 'other';

export const BUDGET_CATEGORIES: Record<BudgetCategory, { label: string; icon: string; color: string }> = {
  venue: { label: 'Lieu', icon: '🏛️', color: '#5F4A8B' },
  catering: { label: 'Traiteur', icon: '🍽️', color: '#10B981' },
  decoration: { label: 'Décoration', icon: '🎨', color: '#F59E0B' },
  photography: { label: 'Photo/Vidéo', icon: '📸', color: '#3B82F6' },
  music: { label: 'Musique', icon: '🎵', color: '#EC4899' },
  flowers: { label: 'Fleurs', icon: '💐', color: '#EF4444' },
  attire: { label: 'Tenues', icon: '👗', color: '#8B5CF6' },
  transportation: { label: 'Transport', icon: '🚗', color: '#14B8A6' },
  invitations: { label: 'Faire-part', icon: '💌', color: '#F97316' },
  gifts: { label: 'Cadeaux', icon: '🎁', color: '#06B6D4' },
  other: { label: 'Autre', icon: '📦', color: '#6B7280' },
};

export interface BudgetItem {
  id: string;
  event_id: string;
  category: BudgetCategory;
  name: string;
  estimated_amount: number;
  actual_amount: number | null;
  paid_amount: number;
  vendor_name: string | null;
  notes: string | null;
  due_date: string | null;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
  source_type?: 'manual' | 'booking';
  source_booking_id?: string | null;
  auto_generated?: boolean;
}

export interface BudgetSummary {
  total_estimated: number;
  total_actual: number;
  total_paid: number;
  total_remaining: number;
  by_category: Record<BudgetCategory, { estimated: number; actual: number; paid: number }>;
}

export interface CreateBudgetItemInput {
  event_id: string;
  category: BudgetCategory;
  name: string;
  estimated_amount: number;
  actual_amount?: number;
  vendor_name?: string;
  notes?: string;
  due_date?: string;
}

// ============================================
// GUEST LIST
// ============================================

export type GuestStatus = 'pending' | 'confirmed' | 'declined' | 'maybe';
export type GuestCategory = 'family' | 'friends' | 'colleagues' | 'other';
export type MealPreference = 'standard' | 'vegetarian' | 'vegan' | 'halal' | 'kosher' | 'gluten_free' | 'other';

export const GUEST_STATUS_LABELS: Record<GuestStatus, { label: string; color: string }> = {
  pending: { label: 'En attente', color: '#F59E0B' },
  confirmed: { label: 'Confirmé', color: '#10B981' },
  declined: { label: 'Décliné', color: '#EF4444' },
  maybe: { label: 'Peut-être', color: '#6B7280' },
};

export const GUEST_CATEGORIES: Record<GuestCategory, string> = {
  family: 'Famille',
  friends: 'Amis',
  colleagues: 'Collègues',
  other: 'Autres',
};

export const MEAL_PREFERENCES: Record<MealPreference, string> = {
  standard: 'Standard',
  vegetarian: 'Végétarien',
  vegan: 'Végan',
  halal: 'Halal',
  kosher: 'Casher',
  gluten_free: 'Sans gluten',
  other: 'Autre',
};

export interface Guest {
  id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: GuestStatus;
  category: GuestCategory;
  plus_one: boolean;
  plus_one_name: string | null;
  plus_one_confirmed: boolean;
  meal_preference: MealPreference;
  dietary_notes: string | null;
  table_id: string | null;
  seat_number: number | null;
  notes: string | null;
  rsvp_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestListSummary {
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
  maybe: number;
  with_plus_one: number;
  total_attending: number;
  by_category: Record<GuestCategory, number>;
  by_meal: Record<MealPreference, number>;
}

export interface CreateGuestInput {
  event_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  category?: GuestCategory;
  plus_one?: boolean;
  meal_preference?: MealPreference;
  dietary_notes?: string;
  notes?: string;
  group_id?: string; // Lien vers le groupe
}

// ============================================
// GUEST GROUPS (Familles / Groupes)
// ============================================

export interface GuestGroup {
  id: string;
  event_id: string;
  name: string; // Ex: "Famille Dupont"
  member_count: number; // Nombre total de personnes
  status: GuestStatus;
  category: GuestCategory;
  email: string | null;
  phone: string | null;
  notes: string | null;
  rsvp_date: string | null;
  confirmed_adults?: number;
  confirmed_children?: number;
  response_note?: string | null;
  contact_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestGroupWithMembers extends GuestGroup {
  members: GuestGroupMember[];
}

export interface GuestGroupMember {
  id: string;
  group_id: string;
  name: string; // Nom complet du membre
  meal_preference: MealPreference;
  dietary_notes: string | null;
  is_child: boolean;
  age: number | null; // Pour les enfants
  created_at: string;
}

export interface CreateGuestGroupInput {
  event_id: string;
  name: string;
  member_count: number;
  category?: GuestCategory;
  email?: string;
  phone?: string;
  notes?: string;
  members?: { name: string; meal_preference?: MealPreference; is_child?: boolean; age?: number }[];
}

export interface GuestGroupSummary {
  total_groups: number;
  total_people: number;
  confirmed_groups: number;
  confirmed_people: number;
  pending_groups: number;
  pending_people: number;
  declined_groups: number;
  declined_people: number;
  by_category: Record<GuestCategory, { groups: number; people: number }>;
}

// ============================================
// SEATING PLAN
// ============================================

export type TableShape = 'round' | 'rectangular' | 'square' | 'oval';
export type SeatingRoomShape = 'rectangle' | 'square' | 'l_shape';
export type SeatingLayoutPresetId =
  | 'intime'
  | 'classique'
  | 'grand_banquet'
  | 'cocktail'
  | 'custom';

export interface SeatingLayoutPreset {
  id: SeatingLayoutPresetId;
  label: string;
  description: string;
  surface_m2: [number, number];
  width_m: number;
  height_m: number;
  room_shape: SeatingRoomShape;
  aisle_m: number;
}

export const SEATING_LAYOUT_PRESETS: SeatingLayoutPreset[] = [
  {
    id: 'intime',
    label: 'Intime',
    description: 'Petite salle pour 20 a 50 invites',
    surface_m2: [40, 90],
    width_m: 10,
    height_m: 8,
    room_shape: 'rectangle',
    aisle_m: 1.2,
  },
  {
    id: 'classique',
    label: 'Classique Carre',
    description: 'Salle standard carree, simple a organiser',
    surface_m2: [90, 180],
    width_m: 12,
    height_m: 12,
    room_shape: 'square',
    aisle_m: 1.6,
  },
  {
    id: 'grand_banquet',
    label: 'Grand Banquet',
    description: 'Grande salle pour 120+ invites',
    surface_m2: [180, 340],
    width_m: 22,
    height_m: 14,
    room_shape: 'rectangle',
    aisle_m: 2,
  },
  {
    id: 'cocktail',
    label: 'Cocktail / L',
    description: 'Disposition flexible pour salle atypique',
    surface_m2: [120, 260],
    width_m: 18,
    height_m: 13,
    room_shape: 'l_shape',
    aisle_m: 1.8,
  },
  {
    id: 'custom',
    label: 'Personnalise',
    description: 'Definis ta surface exacte',
    surface_m2: [40, 500],
    width_m: 18,
    height_m: 12,
    room_shape: 'rectangle',
    aisle_m: 1.6,
  },
];

export interface SeatingRoomLayout {
  id: string;
  event_id: string;
  preset_id: SeatingLayoutPresetId;
  room_shape: SeatingRoomShape;
  width_m: number;
  height_m: number;
  aisle_m: number;
  created_at: string;
  updated_at: string;
}

export interface SeatingRoomLayoutInput {
  event_id: string;
  preset_id: SeatingLayoutPresetId;
  room_shape: SeatingRoomShape;
  width_m: number;
  height_m: number;
  aisle_m: number;
}

export interface Table {
  id: string;
  event_id: string;
  name: string;
  shape: TableShape;
  capacity: number;
  position_x: number;
  position_y: number;
  rotation: number;
  created_at: string;
  updated_at: string;
}

export interface TableWithGuests extends Table {
  guests: Guest[];
  available_seats: number;
}

export interface CreateTableInput {
  event_id: string;
  name: string;
  shape?: TableShape;
  capacity?: number;
  position_x?: number;
  position_y?: number;
}

export interface SeatingAssignment {
  guest_id: string;
  table_id: string;
  seat_number?: number;
}

// ============================================
// DAY-OF TIMELINE
// ============================================

export type TimelineItemType = 'ceremony' | 'reception' | 'meal' | 'speech' | 'entertainment' | 'photo' | 'travel' | 'other';

export const TIMELINE_ITEM_TYPES: Record<TimelineItemType, { label: string; icon: string; color: string }> = {
  ceremony: { label: 'Cérémonie', icon: '💒', color: '#5F4A8B' },
  reception: { label: 'Réception', icon: '🥂', color: '#F59E0B' },
  meal: { label: 'Repas', icon: '🍽️', color: '#10B981' },
  speech: { label: 'Discours', icon: '🎤', color: '#3B82F6' },
  entertainment: { label: 'Animation', icon: '🎉', color: '#EC4899' },
  photo: { label: 'Photos', icon: '📸', color: '#8B5CF6' },
  travel: { label: 'Déplacement', icon: '🚗', color: '#14B8A6' },
  other: { label: 'Autre', icon: '📌', color: '#6B7280' },
};

export interface TimelineItem {
  id: string;
  event_id: string;
  type: TimelineItemType;
  title: string;
  description: string | null;
  start_time: string; // HH:MM format
  end_time: string | null;
  duration_minutes: number | null;
  location: string | null;
  responsible_person: string | null;
  vendor_id: string | null;
  notes: string | null;
  is_completed: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTimelineItemInput {
  event_id: string;
  type: TimelineItemType;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  location?: string;
  responsible_person?: string;
  notes?: string;
}

// ============================================
// COLLABORATIVE CHECKLIST
// ============================================

export type ChecklistItemStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type ChecklistPriority = 'low' | 'medium' | 'high' | 'urgent';

export const CHECKLIST_STATUS: Record<ChecklistItemStatus, { label: string; color: string }> = {
  todo: { label: 'À faire', color: '#6B7280' },
  in_progress: { label: 'En cours', color: '#3B82F6' },
  done: { label: 'Terminé', color: '#10B981' },
  blocked: { label: 'Bloqué', color: '#EF4444' },
};

export const CHECKLIST_PRIORITY: Record<ChecklistPriority, { label: string; color: string }> = {
  low: { label: 'Basse', color: '#6B7280' },
  medium: { label: 'Moyenne', color: '#F59E0B' },
  high: { label: 'Haute', color: '#F97316' },
  urgent: { label: 'Urgente', color: '#EF4444' },
};

// Alias pour compatibilité (anciens imports) - inclut maintenant "urgent".
export const CHECKLIST_PRIORITIES: Record<ChecklistPriority, { label: string; color: string }> =
  CHECKLIST_PRIORITY;

export interface ChecklistItem {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  status: ChecklistItemStatus;
  priority: ChecklistPriority;
  due_date: string | null;
  assigned_to: string | null; // user_id or collaborator_id
  assigned_name: string | null;
  category: string | null;
  order_index: number;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateChecklistItemInput {
  event_id: string;
  title: string;
  description?: string;
  priority?: ChecklistPriority;
  due_date?: string;
  assigned_to?: string;
  category?: string;
}

// ============================================
// COLLABORATORS (for sharing)
// ============================================

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export const COLLABORATOR_ROLES: Record<CollaboratorRole, { label: string; description: string }> = {
  owner: { label: 'Propriétaire', description: 'Contrôle total sur l\'événement' },
  editor: { label: 'Éditeur', description: 'Peut modifier les informations' },
  viewer: { label: 'Spectateur', description: 'Peut voir les informations' },
};

export interface Collaborator {
  id: string;
  event_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: CollaboratorRole;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface CreateCollaboratorInput {
  event_id: string;
  email: string;
  role?: CollaboratorRole;
}
