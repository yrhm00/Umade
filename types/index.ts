import { Database } from './database';

// Types réutilisés dans l'application
export type UserRole = 'client' | 'provider';

// Import des types depuis la base de données Supabase
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Provider = Database['public']['Tables']['providers']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
