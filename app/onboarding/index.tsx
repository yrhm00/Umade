/**
 * Redirection vers la première étape de l'onboarding
 */

import { Redirect } from 'expo-router';

export default function OnboardingIndex() {
  return <Redirect href={"/onboarding/event-type" as any} />;
}
