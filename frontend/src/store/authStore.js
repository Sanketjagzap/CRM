import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: '',
      theme: 'dark',
      setSession: (session) => set({ user: session.user, accessToken: session.accessToken || '' }),
      clearSession: () => set({ user: null, accessToken: '' }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'modern-ai-crm-auth' }
  )
);