import { Profile, supabase, UserRole } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

interface AuthState {
  // State
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Computed
  isAuthenticated: boolean;
  isProvider: boolean;
  isClient: boolean;
  isOnboarded: boolean;

  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, role: UserRole, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

// Helper : calcule les valeurs dérivées à partir de session et profile.
// Appelé dans chaque set() qui modifie session ou profile.
function deriveState(session: Session | null, profile: Profile | null) {
  return {
    isAuthenticated: !!session,
    isProvider: profile?.role === 'provider',
    isClient: profile?.role === 'client',
    isOnboarded: profile?.is_onboarded ?? false,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
  error: null,

  // Valeurs dérivées (recalculées via deriveState à chaque set pertinent)
  isAuthenticated: false,
  isProvider: false,
  isClient: false,
  isOnboarded: false,

  // Initialize - appelé au démarrage de l'app
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Récupérer la session existante
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (session?.user) {
        // Récupérer le profil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        set({
          session,
          user: session.user,
          profile,
          isLoading: false,
          isInitialized: true,
          ...deriveState(session, profile),
        });
      } else {
        set({
          session: null,
          user: null,
          profile: null,
          isLoading: false,
          isInitialized: true,
          ...deriveState(null, null),
        });
      }

      // Écouter les changements d'auth
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        // Only handle specific events to prevent unnecessary re-renders
        if (event === 'SIGNED_IN' && newSession?.user) {
          // Only update if user is different
          const currentUserId = get().user?.id;
          if (currentUserId !== newSession.user.id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newSession.user.id)
              .single();

            set({
              session: newSession,
              user: newSession.user,
              profile,
              ...deriveState(newSession, profile),
            });
          }
        } else if (event === 'SIGNED_OUT') {
          // Only update if currently has session
          if (get().session) {
            set({
              session: null,
              user: null,
              profile: null,
              ...deriveState(null, null),
            });
          }
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          // Ne met à jour QUE le token, pas la session entière comme objet.
          // Cela évite de déclencher les sélecteurs qui dépendent de !!session.
          set({ session: newSession });
        }
        // Ignore INITIAL_SESSION and other events to prevent re-renders
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({
        error: (error as Error).message,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  // Sign Up
  signUp: async (email, password, role, fullName) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Le trigger handle_new_user crée automatiquement le profil
        // Mais on met à jour le role et le nom
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            role: role,
          })
          .eq('id', data.user.id);

        if (updateError) throw updateError;

        // Refresh profile
        await get().refreshProfile();
      }

      set({ isLoading: false });
    } catch (error) {
      console.error('Sign up error:', error);
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Sign In
  signIn: async (email, password) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        set({
          session: data.session,
          user: data.user,
          profile,
          isLoading: false,
          ...deriveState(data.session, profile),
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Sign Out
  signOut: async () => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        ...deriveState(null, null),
      });
    } catch (error) {
      console.error('Sign out error:', error);
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Reset Password
  resetPassword: async (email) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'umade://reset-password',
      });

      if (error) throw error;

      set({ isLoading: false });
    } catch (error) {
      console.error('Reset password error:', error);
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Update Profile
  updateProfile: async (updates) => {
    try {
      set({ isLoading: true, error: null });

      const userId = get().user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      set({
        profile: data,
        isLoading: false,
        ...deriveState(get().session, data),
      });
    } catch (error) {
      console.error('Update profile error:', error);
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Refresh Profile
  refreshProfile: async () => {
    try {
      const userId = get().user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      set({
        profile: data,
        ...deriveState(get().session, data),
      });
    } catch (error) {
      console.error('Refresh profile error:', error);
    }
  },

  // Clear Error
  clearError: () => {
    set({ error: null });
  },
}));