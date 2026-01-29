/**
 * Hook d'authentification
 * Wrapper autour du store Zustand pour un accès simplifié.
 * Utilise useShallow pour éviter les re-renders quand des propriétés non-utilisées changent.
 */

import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/react/shallow';

export function useAuth() {
  const {
    session,
    user,
    profile,
    isLoading,
    isInitialized,
    isAuthenticated,
    isProvider,
    isClient,
    isOnboarded,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    clearError,
  } = useAuthStore(
    useShallow((state) => ({
      session: state.session,
      user: state.user,
      profile: state.profile,
      isLoading: state.isLoading,
      isInitialized: state.isInitialized,
      isAuthenticated: state.isAuthenticated,
      isProvider: state.isProvider,
      isClient: state.isClient,
      isOnboarded: state.isOnboarded,
      error: state.error,
      signUp: state.signUp,
      signIn: state.signIn,
      signOut: state.signOut,
      resetPassword: state.resetPassword,
      updateProfile: state.updateProfile,
      refreshProfile: state.refreshProfile,
      clearError: state.clearError,
    }))
  );

  return {
    // State
    session,
    user,
    profile,
    isLoading,
    isInitialized,
    error,

    // Computed (from store)
    isAuthenticated,
    isProvider,
    isClient,
    isOnboarded,
    userId: user?.id,

    // Actions
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    clearError,
  };
}
