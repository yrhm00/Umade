/**
 * Initialisation Sentry (crash reporting + performance).
 * Ne fait rien tant que EXPO_PUBLIC_SENTRY_DSN n'est pas défini dans
 * .env.local — l'app fonctionne normalement sans compte Sentry.
 */

import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const sentryEnabled = Boolean(dsn) && !__DEV__;

export function initSentry() {
  if (!sentryEnabled) return;

  Sentry.init({
    dsn,
    // 20% des transactions suffisent pour le monitoring de perf
    // sans exploser le quota gratuit.
    tracesSampleRate: 0.2,
    // Capture les erreurs natives (crashes iOS/Android) en plus du JS.
    enableNativeCrashHandling: true,
    // Contexte utile : quelle update OTA était active lors du crash.
    enableAutoSessionTracking: true,
    environment: process.env.EXPO_PUBLIC_APP_ENV ?? 'production',
  });
}

export { Sentry };
