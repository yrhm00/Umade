/**
 * Store Zustand pour la gestion des filtres de recherche
 */

import { create } from 'zustand';
import { ProviderFilters } from '@/types';

interface SearchState {
  filters: ProviderFilters;
  viewMode: 'grid' | 'list';
  setFilters: (filters: Partial<ProviderFilters>) => void;
  resetFilters: () => void;
  setSearchQuery: (query: string) => void;
  setCategory: (slug: string | undefined) => void;
  setCity: (city: string | undefined) => void;
  setMinRating: (rating: number | undefined) => void;
  setPriceRange: (minPrice?: number, maxPrice?: number) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
}

const defaultFilters: ProviderFilters = {
  categorySlug: undefined,
  city: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  minRating: undefined,
  searchQuery: undefined,
};

export const useSearchStore = create<SearchState>((set) => ({
  filters: defaultFilters,
  viewMode: 'grid',

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  setSearchQuery: (query) =>
    set((state) => ({
      filters: { ...state.filters, searchQuery: query || undefined },
    })),

  setCategory: (slug) =>
    set((state) => ({
      filters: { ...state.filters, categorySlug: slug },
    })),

  setCity: (city) =>
    set((state) => ({
      filters: { ...state.filters, city },
    })),

  setMinRating: (rating) =>
    set((state) => ({
      filters: { ...state.filters, minRating: rating },
    })),

  setPriceRange: (minPrice, maxPrice) =>
    set((state) => ({
      filters: { ...state.filters, minPrice, maxPrice },
    })),

  setViewMode: (mode) => set({ viewMode: mode }),
}));
