/**
 * Entrée du tunnel prestataire → première étape
 */

import { Redirect } from 'expo-router';

export default function ProviderOnboardingIndex() {
  return <Redirect href={'/onboarding/provider/category' as any} />;
}
