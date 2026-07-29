/**
 * Types des événements créés par l'utilisateur (table `events`).
 *
 * À ne pas confondre avec `EventType` de `types/preferences.ts`, qui décrit
 * les réponses d'onboarding et utilise un vocabulaire anglais
 * (`wedding`, `birthday`, …).
 */

export const CREATED_EVENT_TYPES: Record<string, { label: string; emoji: string }> = {
  mariage: { label: 'Mariage', emoji: '💒' },
  anniversaire: { label: 'Anniversaire', emoji: '🎂' },
  corporate: { label: 'Corporate', emoji: '🏢' },
  soiree: { label: 'Soirée', emoji: '🎉' },
  conference: { label: 'Conférence', emoji: '🎤' },
  autre: { label: 'Autre', emoji: '✨' },
};

export function getCreatedEventTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Événement';
  return CREATED_EVENT_TYPES[type.toLowerCase()]?.label ?? 'Événement';
}

export function getCreatedEventTypeEmoji(type: string | null | undefined): string {
  if (!type) return '✨';
  return CREATED_EVENT_TYPES[type.toLowerCase()]?.emoji ?? '✨';
}
