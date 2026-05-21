import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message } from '../types';

interface ChatState {
  messagesByContact: Record<string, Record<string, Message[]>>; // serverId -> contactId -> messages
  unreadCountByServer: Record<string, Record<string, number>>; // serverId -> contactId -> count
  activeChatId: string | null;

  getMessages: (serverId: string, contactId: string) => Message[];
  addMessage: (
    serverId: string,
    contactId: string,
    message: Message,
  ) => void;
  clearMessages: (serverId: string, contactId: string) => void;
  markAsRead: (serverId: string, contactId: string) => void;
  incrementUnread: (serverId: string, contactId: string) => void;
  setActiveChat: (contactId: string | null) => void;
  getUnreadCount: (serverId: string, contactId: string) => number;
  getAllUnreadForServer: (serverId: string) => Record<string, number>;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messagesByContact: {},
      unreadCountByServer: {},
      activeChatId: null,

      getMessages: (serverId, contactId) =>
        get().messagesByContact[serverId]?.[contactId] || [],

      addMessage: (serverId, contactId, message) =>
        set((state) => {
          const serverMsgs = state.messagesByContact[serverId] || {};
          const contactMsgs = serverMsgs[contactId] || [];
          return {
            messagesByContact: {
              ...state.messagesByContact,
              [serverId]: {
                ...serverMsgs,
                [contactId]: [...contactMsgs, message],
              },
            },
          };
        }),

      clearMessages: (serverId, contactId) =>
        set((state) => {
          const serverMsgs = state.messagesByContact[serverId] || {};
          return {
            messagesByContact: {
              ...state.messagesByContact,
              [serverId]: {
                ...serverMsgs,
                [contactId]: [],
              },
            },
            unreadCountByServer: {
              ...state.unreadCountByServer,
              [serverId]: {
                ...(state.unreadCountByServer[serverId] || {}),
                [contactId]: 0,
              },
            },
          };
        }),

      markAsRead: (serverId, contactId) =>
        set((state) => ({
          unreadCountByServer: {
            ...state.unreadCountByServer,
            [serverId]: {
              ...(state.unreadCountByServer[serverId] || {}),
              [contactId]: 0,
            },
          },
        })),

      incrementUnread: (serverId, contactId) =>
        set((state) => {
          const serverUnread = state.unreadCountByServer[serverId] || {};
          return {
            unreadCountByServer: {
              ...state.unreadCountByServer,
              [serverId]: {
                ...serverUnread,
                [contactId]: (serverUnread[contactId] || 0) + 1,
              },
            },
          };
        }),

      setActiveChat: (contactId) => set({ activeChatId: contactId }),

      getUnreadCount: (serverId, contactId) =>
        get().unreadCountByServer[serverId]?.[contactId] || 0,

      getAllUnreadForServer: (serverId) =>
        get().unreadCountByServer[serverId] || {},
    }),
    { name: 'voidchat-chat' },
  ),
);
