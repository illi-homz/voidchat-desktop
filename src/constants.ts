export const HEARTBEAT_INTERVAL = 30000; // ms
export const MAX_RECONNECT_ATTEMPTS = 5;
export const RECONNECT_DELAY = 1000; // ms
export const RECONNECT_DELAY_MAX = 5000; // ms
export const CALL_TIMEOUT = 60000; // ms - 60 seconds
export const PRESENCE_CLEANUP_INTERVAL = 60000; // ms
export const CALL_DISCONNECTED_TIMEOUT = 5000; // ms
export const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];
export const MAX_CALL_DURATION_FOR_RECORD = 0; // don't record calls shorter than this (0 = always record)
