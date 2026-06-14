/* ============================================
   EcoPilot AI — Chat Store (Zustand)
   ============================================ */
'use client';

import { create } from 'zustand';
import type { ChatMessage } from '@/types';
import { getStorageItem, setStorageItem } from '@/lib/storage';
import { generateId } from '@/lib/utils';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  // Actions
  hydrate: () => void;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateLastAssistantMessage: (content: string) => void;
  clearChat: () => void;
  getMessageCount: () => number;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  isHydrated: false,
  error: null,

  hydrate: () => {
    const stored = getStorageItem<ChatMessage[]>('chat_history', []);
    set({ messages: stored, isHydrated: true });
  },

  addMessage: (role, content) => {
    const message: ChatMessage = {
      id: generateId(),
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    const messages = [...get().messages, message];
    setStorageItem('chat_history', messages);
    set({ messages, error: null });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  updateLastAssistantMessage: (content) => {
    const messages = [...get().messages];
    const lastIdx = messages.length - 1;
    if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
      messages[lastIdx] = { ...messages[lastIdx], content };
    }
    setStorageItem('chat_history', messages);
    set({ messages });
  },

  clearChat: () => {
    setStorageItem('chat_history', []);
    set({ messages: [] });
  },

  getMessageCount: () => get().messages.filter(m => m.role === 'user').length,
}));
