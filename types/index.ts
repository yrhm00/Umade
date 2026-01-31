import { Database } from './database';

// Types réutilisés dans l'application
export type UserRole = 'client' | 'provider';

// Import des types depuis la base de données Supabase
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Provider = Database['public']['Tables']['providers']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type PortfolioImage = Database['public']['Tables']['portfolio_images']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Favorite = Database['public']['Tables']['favorites']['Row'];

// Provider avec relations complètes
export interface ProviderWithDetails extends Provider {
  category?: Category;
  services?: Service[];
  portfolio_images?: PortfolioImage[];
  reviews?: ReviewWithClient[];
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
    phone?: string | null;
  };
}

// Provider pour les listes (résultat de search_providers RPC)
export interface ProviderListItem {
  id: string;
  user_id: string;
  business_name: string;
  description: string | null;
  category_id: string;
  category_name: string;
  category_slug: string;
  city: string | null;
  average_rating: number | null;
  review_count: number | null;
  min_price: number | null;
  portfolio_image: string | null;
}

// Review avec infos client
export interface ReviewWithClient extends Review {
  client?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Filtres de recherche
export interface ProviderFilters {
  categorySlug?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  searchQuery?: string;
}

// Pagination
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// Résultat paginé
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  hasMore: boolean;
}

// === EVENTS ===

export type Event = Database['public']['Tables']['events']['Row'];

export interface EventWithBookings extends Event {
  bookings?: BookingWithDetails[];
  bookings_count?: number;
}

export interface CreateEventInput {
  title: string;
  event_type: string;
  event_date: string;
  location?: string;
  guest_count?: number;
  budget_min?: number;
  budget_max?: number;
  notes?: string;
}

// === BOOKINGS ===

export type BookingStatus = Database['public']['Enums']['booking_status'];

export interface BookingWithDetails {
  id: string;
  event_id: string | null;
  provider_id: string;
  service_id: string;
  client_id: string;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  status: BookingStatus | null;
  total_price: number;
  client_message: string | null;
  provider_response: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  providers?: {
    id: string;
    business_name: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    };
    categories?: {
      name: string;
    };
  };
  services?: {
    id: string;
    name: string;
    price: number;
    description: string | null;
    duration_minutes: number | null;
  };
  events?: {
    id: string;
    title: string;
    event_date: string;
  };
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface CreateBookingInput {
  provider_id: string;
  service_id: string;
  event_id?: string;
  booking_date: string;
  start_time?: string;
  end_time?: string;
  total_price: number;
  client_message?: string;
}

// === AVAILABILITY ===

export type Availability = Database['public']['Tables']['availabilities']['Row'];

export interface DayAvailability {
  date: string;
  isAvailable: boolean;
  slots: { start_time: string; end_time: string }[];
}

// === MESSAGING ===

export interface MessageWithSender {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string | null;
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface ConversationWithDetails {
  id: string;
  client_id: string;
  provider_id: string;
  booking_id: string | null;
  last_message_at: string | null;
  created_at: string | null;
  provider?: {
    id: string;
    user_id: string;
    business_name: string;
  };
  client?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string | null;
  };
  unread_count: number;
}

export interface CreateMessageInput {
  conversation_id: string;
  content: string;
}

// === REVIEWS ===

export interface ReviewWithDetails extends Review {
  client?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  booking?: {
    id: string;
    booking_date: string;
    service?: {
      name: string;
    };
    provider?: {
      id: string;
      business_name: string;
    };
  };
}

export interface CreateReviewInput {
  booking_id: string;
  provider_id: string;
  rating: number;
  comment?: string;
}

export interface ReviewStats {
  average_rating: number;
  total_count: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// === NOTIFICATIONS ===

// App-level notification types (more specific than DB enum)
export type NotificationType =
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_reminder'
  | 'new_message'
  | 'new_review'
  | 'review_response'
  | 'system';

// Maps to DB enum: booking | message | review | system
export type NotificationTypeDB = 'booking' | 'message' | 'review' | 'system';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationTypeDB;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  booking_updates: boolean;
  messages: boolean;
  reviews: boolean;
  marketing: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  created_at: string;
}

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationTypeDB;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

export interface ReviewableBooking {
  id: string;
  booking_date: string;
  provider?: {
    id: string;
    business_name: string;
  };
  service?: {
    name: string;
  };
}
