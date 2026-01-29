import { create } from 'zustand';

interface ChatState {
  draftMessages: Record<string, string>;
  typingUsers: Record<string, boolean>;

  setDraft: (conversationId: string, text: string) => void;
  clearDraft: (conversationId: string) => void;
  getDraft: (conversationId: string) => string;
  setTyping: (conversationId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  draftMessages: {},
  typingUsers: {},

  setDraft: (conversationId, text) =>
    set((state) => ({
      draftMessages: {
        ...state.draftMessages,
        [conversationId]: text,
      },
    })),

  clearDraft: (conversationId) =>
    set((state) => {
      const { [conversationId]: _, ...rest } = state.draftMessages;
      return { draftMessages: rest };
    }),

  getDraft: (conversationId) => get().draftMessages[conversationId] || '',

  setTyping: (conversationId, isTyping) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: isTyping,
      },
    })),
}));
