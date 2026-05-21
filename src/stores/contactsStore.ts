import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Contact } from '../types';

interface ContactsState {
  contactsByServer: Record<string, Contact[]>; // keyed by serverId
  presenceMap: Record<string, boolean>; // userId -> online

  addContact: (serverId: string, contact: Contact) => void;
  removeContact: (serverId: string, userId: string) => void;
  updateContactPublicKey: (
    serverId: string,
    userId: string,
    publicKey: string,
  ) => void;
  setNickname: (
    serverId: string,
    userId: string,
    nickname: string,
  ) => void;
  updatePresence: (userId: string, online: boolean) => void;
  getContacts: (serverId: string) => Contact[];
  getContact: (
    serverId: string,
    userId: string,
  ) => Contact | undefined;
}

export const useContactsStore = create<ContactsState>()(
  persist(
    (set, get) => ({
      contactsByServer: {},
      presenceMap: {},

      addContact: (serverId, contact) =>
        set((state) => {
          const existing = state.contactsByServer[serverId] || [];
          if (existing.find((c) => c.userId === contact.userId)) return state;
          return {
            contactsByServer: {
              ...state.contactsByServer,
              [serverId]: [...existing, contact],
            },
          };
        }),

      removeContact: (serverId, userId) =>
        set((state) => ({
          contactsByServer: {
            ...state.contactsByServer,
            [serverId]: (state.contactsByServer[serverId] || []).filter(
              (c) => c.userId !== userId,
            ),
          },
        })),

      updateContactPublicKey: (serverId, userId, publicKey) =>
        set((state) => ({
          contactsByServer: {
            ...state.contactsByServer,
            [serverId]: (state.contactsByServer[serverId] || []).map((c) =>
              c.userId === userId ? { ...c, publicKey } : c,
            ),
          },
        })),

      setNickname: (serverId, userId, nickname) =>
        set((state) => ({
          contactsByServer: {
            ...state.contactsByServer,
            [serverId]: (state.contactsByServer[serverId] || []).map((c) =>
              c.userId === userId
                ? { ...c, nickname: nickname || undefined }
                : c,
            ),
          },
        })),

      updatePresence: (userId, online) =>
        set((state) => ({
          presenceMap: { ...state.presenceMap, [userId]: online },
        })),

      getContacts: (serverId) => get().contactsByServer[serverId] || [],

      getContact: (serverId, userId) =>
        (get().contactsByServer[serverId] || []).find(
          (c) => c.userId === userId,
        ),
    }),
    { name: 'voidchat-contacts' },
  ),
);
