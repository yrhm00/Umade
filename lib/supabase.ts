import { Database } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T];

// Typed helpers
export type Profile = Tables<'profiles'>;
export type Provider = Tables<'providers'>;
export type Service = Tables<'services'>;
export type Category = Tables<'categories'>;
export type Booking = Tables<'bookings'>;
export type Conversation = Tables<'conversations'>;
export type Message = Tables<'messages'>;
export type Review = Tables<'reviews'>;
export type Notification = Tables<'notifications'>;
export type Favorite = Tables<'favorites'>;

export type BookingStatus = Enums<'booking_status'>;
export type UserRole = Enums<'user_role'>;
export type NotificationType = Enums<'notification_type'>;