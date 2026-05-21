export interface Contact {
  userId: string;
  publicKey: string;
  createdAt: number;
  nickname?: string;
}

export interface Message {
  id: string;
  from: string;
  ciphertext: string;
  nonce: string;
  timestamp: number;
  read: boolean;
}

export interface Chat {
  contactId: string;
  messages: Message[];
}

export interface User {
  userId: string;
  publicKey: string;
  privateKey: string;
}

export interface FriendRequest {
  fromUserId: string;
  fromPublicKey: string | null;
}

export interface ServerMessage {
  from: string;
  ciphertext: string;
  nonce: string;
  timestamp: number;
}

export interface PresenceUpdate {
  userId: string;
  online: boolean;
}

export interface EncryptedPayload {
  ciphertext: string;
  nonce: string;
}

export interface ServerConfig {
  id: string;
  name: string;
  url: string;
  addedAt: number;
}

// ---- Call types ----

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'failed';

export interface CallOffer {
  callId: string;
  fromUserId: string;
  sdp: string;
}

export interface CallOfferSent {
  callId: string;
  targetUserId: string;
}

export interface CallAnswer {
  callId: string;
  sdp: string;
}

export interface CallIceCandidate {
  callId: string;
  candidate: string;
}

export interface CallEnded {
  callId: string;
  duration: number;
  endedBy: string;
}

export interface CallDeclined {
  callId: string;
  reason: string;
}

export interface CallTimedOut {
  callId: string;
  reason: 'no_answer' | 'offline';
}

export interface CallRecord {
  contactId: string;
  direction: 'outgoing' | 'incoming';
  duration: number;
  timestamp: number;
  status: 'missed' | 'completed' | 'declined';
}

// ---- Helpers ----

/** Маскирует userId для отображения: первые 4 и последние 4 символа, остальное — точки. */
export function maskUserId(userId: string): string {
  if (userId.length <= 12) {
    return userId.slice(0, 4) + '...' + userId.slice(-4);
  }
  return userId.slice(0, 6) + '...' + userId.slice(-6);
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error';
}
