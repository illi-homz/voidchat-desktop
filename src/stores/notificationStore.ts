import { create } from 'zustand';
import type { ToastMessage } from '../types';

interface IncomingCallData {
  contactId: string;
  contactName: string;
  callId: string;
  sdp: string;
}

interface NotificationState {
  toasts: ToastMessage[];
  incomingCall: IncomingCallData | null;

  addToast: (text: string, type?: 'info' | 'success' | 'error') => void;
  removeToast: (id: string) => void;
  showIncomingCall: (contactId: string, callId: string, sdp: string, contactName?: string) => void;
  hideIncomingCall: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  toasts: [],
  incomingCall: null,

  addToast: (text, type = 'info') => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, text, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  showIncomingCall: (contactId, callId, sdp, contactName = '') =>
    set({ incomingCall: { contactId, contactName, callId, sdp } }),

  hideIncomingCall: () => set({ incomingCall: null }),
}));
