import { create } from 'zustand';

const MAX_COMPARE = 3;

interface CompareState {
  compareIds: string[];
  limitNoticeTick: number;
  addToCompare: (providerId: string) => { ok: boolean; reason?: 'exists' | 'limit' };
  removeFromCompare: (providerId: string) => void;
  clearCompare: () => void;
  isInCompare: (providerId: string) => boolean;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  compareIds: [],
  limitNoticeTick: 0,

  addToCompare: (providerId) => {
    const ids = get().compareIds;

    if (ids.includes(providerId)) {
      return { ok: false, reason: 'exists' };
    }

    if (ids.length >= MAX_COMPARE) {
      set((state) => ({ limitNoticeTick: state.limitNoticeTick + 1 }));
      return { ok: false, reason: 'limit' };
    }

    set({ compareIds: [...ids, providerId] });
    return { ok: true };
  },

  removeFromCompare: (providerId) =>
    set((state) => ({
      compareIds: state.compareIds.filter((id) => id !== providerId),
    })),

  clearCompare: () => set({ compareIds: [] }),

  isInCompare: (providerId) => get().compareIds.includes(providerId),
}));
