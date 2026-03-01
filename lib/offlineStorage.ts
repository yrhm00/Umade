/**
 * Stockage hors-ligne pour les données utilisateur
 * Utilise AsyncStorage pour persister les données localement
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { InspirationWithProvider } from '@/types/inspiration';

const STORAGE_KEYS = {
  FAVORITE_IDS: '@umade/favorite_ids',
  FAVORITE_INSPIRATIONS: '@umade/favorite_inspirations',
  LAST_SYNC: '@umade/last_sync',
} as const;

// ============================================
// Favorite IDs
// ============================================

export async function saveFavoriteIds(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_IDS, JSON.stringify(ids));
  } catch (error) {
    console.error('Error saving favorite IDs:', error);
  }
}

export async function loadFavoriteIds(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_IDS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading favorite IDs:', error);
    return [];
  }
}

// ============================================
// Favorite Inspirations (full data)
// ============================================

export async function saveFavoriteInspirations(
  inspirations: InspirationWithProvider[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.FAVORITE_INSPIRATIONS,
      JSON.stringify(inspirations)
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_SYNC,
      new Date().toISOString()
    );
  } catch (error) {
    console.error('Error saving favorite inspirations:', error);
  }
}

export async function loadFavoriteInspirations(): Promise<InspirationWithProvider[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_INSPIRATIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading favorite inspirations:', error);
    return [];
  }
}

export async function getLastSyncTime(): Promise<Date | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return data ? new Date(data) : null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
}

// ============================================
// Clear offline data
// ============================================

export async function clearOfflineData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.FAVORITE_IDS,
      STORAGE_KEYS.FAVORITE_INSPIRATIONS,
      STORAGE_KEYS.LAST_SYNC,
    ]);
  } catch (error) {
    console.error('Error clearing offline data:', error);
  }
}
