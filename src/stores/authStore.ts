import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { generateKeyPair } from '../services/crypto';

interface AuthState {
  users: Record<string, User>; // keyed by serverId
  activeUserId: string | null;

  generateKeys: (serverId: string) => User;
  setUser: (serverId: string, user: User) => void;
  getUser: (serverId: string) => User | undefined;
  setActiveUserId: (userId: string | null) => void;
  clearUser: (serverId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: {},
      activeUserId: null,

      generateKeys: (serverId) => {
        const keys = generateKeyPair();
        const user: User = {
          userId: crypto.randomUUID(),
          publicKey: keys.publicKey,
          privateKey: keys.privateKey,
        };
        set((state) => ({
          users: { ...state.users, [serverId]: user },
        }));
        return user;
      },

      setUser: (serverId, user) =>
        set((state) => ({
          users: { ...state.users, [serverId]: user },
        })),

      getUser: (serverId) => get().users[serverId],

      setActiveUserId: (userId) => set({ activeUserId: userId }),

      clearUser: (serverId) =>
        set((state) => {
          const { [serverId]: _unused, ...rest } = state.users;
          void _unused;
          return { users: rest };
        }),
    }),
    { name: 'voidchat-auth' },
  ),
);
