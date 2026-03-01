import { router as globalRouter, type Href } from 'expo-router';

import { useAuthStore } from '@/stores/authStore';

type RouterLike = Pick<typeof globalRouter, 'back' | 'canGoBack' | 'replace'>;

const getDefaultFallback = (): Href => {
  const { session, profile } = useAuthStore.getState();

  if (!session) {
    return '/(auth)/welcome';
  }

  if (profile?.role === 'provider') {
    return '/(provider)/dashboard';
  }

  return '/(tabs)';
};

export const goBackOrFallback = (
  router: RouterLike = globalRouter,
  fallback?: Href
) => {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback ?? getDefaultFallback());
};
