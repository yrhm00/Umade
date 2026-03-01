import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface QuickReplyTemplate {
  id: string;
  label: string;
  content: string;
  order: number;
}

interface QuickReplyState {
  templates: QuickReplyTemplate[];
  addTemplate: (input: Omit<QuickReplyTemplate, 'id' | 'order'>) => void;
  updateTemplate: (id: string, updates: Partial<Pick<QuickReplyTemplate, 'label' | 'content'>>) => void;
  deleteTemplate: (id: string) => void;
  reorderTemplates: (orderedIds: string[]) => void;
}

const DEFAULT_TEMPLATES: QuickReplyTemplate[] = [
  {
    id: 'default-1',
    label: 'Disponibilité',
    content:
      "Merci pour votre message ! Je suis disponible pour cette date. Souhaitez-vous qu'on en discute ?",
    order: 0,
  },
  {
    id: 'default-2',
    label: 'Tarifs',
    content:
      'Merci de votre intérêt ! Voici mes tarifs pour cette prestation : [à compléter]',
    order: 1,
  },
  {
    id: 'default-3',
    label: 'Suivi rapide',
    content: 'Bonjour ! Je reviens vers vous très vite avec plus d\'informations.',
    order: 2,
  },
  {
    id: 'default-4',
    label: 'Après réservation',
    content: "Merci pour cette réservation ! J'ai hâte de collaborer avec vous.",
    order: 3,
  },
];

function toSortedTemplates(templates: QuickReplyTemplate[]): QuickReplyTemplate[] {
  return [...templates].sort((a, b) => a.order - b.order);
}

export const useQuickReplyStore = create<QuickReplyState>()(
  persist(
    (set, get) => ({
      templates: DEFAULT_TEMPLATES,

      addTemplate: (input) =>
        set((state) => {
          const nextOrder = state.templates.length;
          const id = `qr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          return {
            templates: toSortedTemplates([
              ...state.templates,
              {
                id,
                label: input.label,
                content: input.content,
                order: nextOrder,
              },
            ]),
          };
        }),

      updateTemplate: (id, updates) =>
        set((state) => ({
          templates: toSortedTemplates(
            state.templates.map((item) =>
              item.id === id
                ? {
                    ...item,
                    ...updates,
                  }
                : item
            )
          ),
        })),

      deleteTemplate: (id) =>
        set((state) => {
          const filtered = state.templates.filter((item) => item.id !== id);
          return {
            templates: filtered.map((item, index) => ({
              ...item,
              order: index,
            })),
          };
        }),

      reorderTemplates: (orderedIds) =>
        set((state) => {
          const byId = new Map(state.templates.map((item) => [item.id, item]));
          const reordered = orderedIds
            .map((id) => byId.get(id))
            .filter(Boolean)
            .map((item, index) => ({
              ...item!,
              order: index,
            }));

          const missing = state.templates
            .filter((item) => !orderedIds.includes(item.id))
            .map((item, index) => ({
              ...item,
              order: reordered.length + index,
            }));

          return {
            templates: [...reordered, ...missing],
          };
        }),
    }),
    {
      name: 'quick-reply-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ templates: state.templates }),
    }
  )
);
