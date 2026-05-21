import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ServerConfig } from '../types';

interface ServerState {
  servers: ServerConfig[];
  activeServerId: string | null;

  addServer: (server: ServerConfig) => void;
  removeServer: (id: string) => void;
  renameServer: (id: string, name: string) => void;
  setActiveServer: (id: string | null) => void;
  getActiveServer: () => ServerConfig | undefined;
}

export const useServerStore = create<ServerState>()(
  persist(
    (set, get) => ({
      servers: [],
      activeServerId: null,

      addServer: (server) =>
        set((state) => ({
          servers: [...state.servers, server],
        })),

      removeServer: (id) =>
        set((state) => ({
          servers: state.servers.filter((s) => s.id !== id),
          activeServerId:
            state.activeServerId === id ? null : state.activeServerId,
        })),

      renameServer: (id, name) =>
        set((state) => ({
          servers: state.servers.map((s) =>
            s.id === id ? { ...s, name } : s,
          ),
        })),

      setActiveServer: (id) => set({ activeServerId: id }),

      getActiveServer: () => {
        const state = get();
        return state.servers.find((s) => s.id === state.activeServerId);
      },
    }),
    { name: 'voidchat-servers' },
  ),
);
