// Socket.IO event type maps for type-safe event handling
import type {
  ServerMessage, FriendRequest, PresenceUpdate,
  CallOffer, CallOfferSent, CallAnswer, CallDeclined, CallEnded, CallTimedOut, CallIceCandidate,
} from './index';

// Events emitted by Client -> Server
export interface ClientEvents {
  register: (data: { userId: string; publicKey?: string }) => void;
  heartbeat: () => void;
  get_presence: (data: { userIds: string[] }) => void;
  friend_request: (data: { targetUserId: string }) => void;
  friend_accept: (data: { targetUserId: string }) => void;
  friend_decline: (data: { targetUserId: string }) => void;
  message: (data: { to: string; ciphertext: string; nonce: string }) => void;
  messages_read: (data: { from: string; contactId: string }) => void;
  call_offer: (data: { targetUserId: string; sdp: string; callId?: string }) => void;
  call_accept: (data: { callId: string; sdp: string }) => void;
  call_decline: (data: { callId: string }) => void;
  call_hangup: (data: { callId: string }) => void;
  ice_candidate: (data: { callId: string; candidate: string }) => void;
}

// Events emitted by Server -> Client
export interface ServerEvents {
  registered: (data: { userId: string }) => void;
  error: (data: { message: string }) => void;
  kicked: (data: { message: string }) => void;
  presence: (data: PresenceUpdate) => void;
  presence_batch: (data: Record<string, boolean>) => void;
  friend_request: (data: FriendRequest) => void;
  friend_request_sent: (data: { targetUserId: string; targetPublicKey: string | null }) => void;
  friend_accepted: (data: FriendRequest) => void;
  friend_confirmed: (data: { targetUserId: string; targetPublicKey: string | null }) => void;
  friend_declined: (data: { fromUserId: string }) => void;
  message: (data: ServerMessage) => void;
  message_sent: (data: { to: string; ciphertext: string; nonce: string; timestamp: number }) => void;
  message_failed: (data: { to: string; nonce: string; reason: string }) => void;
  messages_read: (data: { readBy: string }) => void;
  call_incoming: (data: CallOffer) => void;
  call_offer_sent: (data: CallOfferSent) => void;
  call_accepted: (data: CallAnswer) => void;
  call_declined: (data: CallDeclined) => void;
  call_ended: (data: CallEnded) => void;
  call_timedout: (data: CallTimedOut) => void;
  ice_candidate: (data: CallIceCandidate) => void;
}
