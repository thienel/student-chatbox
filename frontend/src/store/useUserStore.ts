import { create } from 'zustand';
import type { User } from '../types';

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useUserStore = create<UserState>()(
  (set, get) => ({
    user: null,

    setUser: (user) => {
      set({ user });
    },

    clearUser: () => {
      set({ user: null });
    },

    hasPermission: (permission: string) => {
      const { user } = get();
      if (!user) return false;
      return user.permissions.includes(permission);
    },
  })
);

/**
 * Subscribe to whether the current user holds a permission. Re-renders when the
 * user (and thus their permissions) changes, unlike calling hasPermission().
 */
export const usePermission = (permission: string): boolean =>
  useUserStore((s) => !!s.user?.permissions.includes(permission));
