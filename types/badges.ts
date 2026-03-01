import { Database } from './database';

export type Badge = Database['public']['Tables']['badges']['Row'];
export type UserBadge = Database['public']['Tables']['user_badges']['Row'];

export interface UserBadgeWithDetails extends UserBadge {
  badges: Badge;
}
