import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../api/endpoints/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, token, refreshToken) => {
        set({ user, accessToken: token, refreshToken: refreshToken ?? get().refreshToken });
      },

      clearAuth: () => {
        set({ user: null, accessToken: null, refreshToken: null });
      },

      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          try {
            await authApi.logout(refreshToken);
          } catch (error) {
            console.error('Logout API failed:', error);
          }
        }
        set({ user: null, accessToken: null, refreshToken: null });
        window.location.href = '/login';
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        return user.permissions.includes(permission);
      },
    }),
    {
      name: 'educhat-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

/**
 * Subscribe to whether the current user holds a permission. Re-renders when the
 * user (and thus their permissions) changes, unlike calling hasPermission().
 */
export const usePermission = (permission: string): boolean =>
  useAuthStore((s) => !!s.user?.permissions.includes(permission));
