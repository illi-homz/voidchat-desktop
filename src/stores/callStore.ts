import { create } from 'zustand';
import type { CallStatus, CallRecord } from '../types';

interface CallState {
  status: CallStatus;
  callId: string | null;
  contactId: string | null;
  contactName: string;
  direction: 'outgoing' | 'incoming';
  duration: number;
  isMuted: boolean;
  isSpeakerOn: boolean;
  error: string | null;
  callRecords: CallRecord[];

  startOutgoingCall: (contactId: string, contactName?: string) => void;
  startIncomingCall: (
    contactId: string,
    callId: string,
    contactName?: string,
  ) => void;
  setCallId: (callId: string) => void;
  setConnected: () => void;
  endCall: () => void;
  setFailed: (error: string) => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  reset: () => void;
  addCallRecord: (record: CallRecord) => void;
  clearCallRecords: () => void;
}

const initialState = {
  status: 'idle' as CallStatus,
  callId: null as string | null,
  contactId: null as string | null,
  contactName: '',
  direction: 'outgoing' as 'outgoing' | 'incoming',
  duration: 0,
  isMuted: false,
  isSpeakerOn: false,
  error: null as string | null,
};

export const useCallStore = create<CallState>()((set, get) => {
  let durationInterval: ReturnType<typeof setInterval> | null = null;

  const startDurationTimer = () => {
    stopDurationTimer();
    durationInterval = setInterval(() => {
      set((state) => ({ duration: state.duration + 1 }));
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (durationInterval) {
      clearInterval(durationInterval);
      durationInterval = null;
    }
  };

  return {
    ...initialState,
    callRecords: [],

    startOutgoingCall: (contactId, contactName = '') =>
      set({
        status: 'calling',
        contactId,
        contactName,
        direction: 'outgoing',
        duration: 0,
        isMuted: false,
        isSpeakerOn: false,
        error: null,
      }),

    startIncomingCall: (contactId, callId, contactName = '') =>
      set({
        status: 'ringing',
        callId,
        contactId,
        contactName,
        direction: 'incoming',
        duration: 0,
        isMuted: false,
        isSpeakerOn: false,
        error: null,
      }),

    setCallId: (callId) => set({ callId }),

    setConnected: () => {
      startDurationTimer();
      set({ status: 'connected' });
    },

    endCall: () => {
      const state = get();
      stopDurationTimer();
      if (state.contactId && state.status === 'connected') {
        const record: CallRecord = {
          contactId: state.contactId,
          direction: state.direction,
          duration: state.duration,
          timestamp: Date.now(),
          status: 'completed',
        };
        set((s) => ({
          status: 'ended',
          duration: 0,
          callRecords: [...s.callRecords, record],
        }));
      } else {
        set({ ...initialState, callRecords: get().callRecords });
      }
    },

    setFailed: (error) => {
      stopDurationTimer();
      set({ status: 'failed', error });
    },

    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

    toggleSpeaker: () =>
      set((state) => ({ isSpeakerOn: !state.isSpeakerOn })),

    reset: () => {
      stopDurationTimer();
      set({ ...initialState, callRecords: get().callRecords });
    },

    addCallRecord: (record) =>
      set((state) => ({
        callRecords: [record, ...state.callRecords],
      })),

    clearCallRecords: () => set({ callRecords: [] }),
  };
});
