/**
 * Aiguillage vers le bon tunnel d'onboarding selon le rôle.
 * Les prestataires ont leurs propres questions (métier, entreprise, zone) —
 * les questions client ("quel type d'événement prépares-tu ?") n'ont aucun
 * sens pour eux.
 */

import { useAuthStore } from '@/stores/authStore';
import { Redirect } from 'expo-router';

export default function OnboardingIndex() {
  const isProvider = useAuthStore((state) => state.profile?.role === 'provider');

  return (
    <Redirect
      href={(isProvider ? '/onboarding/provider/category' : '/onboarding/event-type') as any}
    />
  );
}
