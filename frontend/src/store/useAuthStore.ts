import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/endpoints/auth';

interface AuthState {
  accessToken: string | null;
  setAuth: (token: string) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,

      setAuth: (token) => {
        set({ accessToken: token });
      },

      clearAuth: () => {
        set({ accessToken: null });
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout API failed:', error);
        }
        set({ accessToken: null });
        window.location.href = '/login';
      },
    }),
    {
      name: 'educhat-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
      }),
    }
  )
);
