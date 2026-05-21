# VoidChat Desktop — AGENTS.md

> Desktop client for VoidChat — E2E encrypted messenger.

**Platform:** Windows, Linux, macOS (Tauri v2).

## Development

```bash
npm install            # Install JS dependencies
npm run dev            # Vite dev server (port 1420)
npm run tauri dev      # Vite + Tauri window
npm run tauri build    # Production build
npm run lint           # ESLint src/
npm run format         # Prettier --write src/
```

## Architecture

### Stack
- **Tauri v2** — Rust backend + OS webview (Chromium on all platforms)
- **React 19 + TypeScript** — UI framework
- **Vite 6** — build tool
- **Tailwind CSS 4** — styles (`@import "tailwindcss"`)
- **Zustand 5** — state management with persist middleware
- **React Router v7** — client-side routing
- **socket.io-client v4** — WebSocket communication
- **tweetnacl v1** — E2E encryption (X25519 + XSalsa20-Poly1305)
- **qrcode v1** — QR code generation

### Window
- Default size: 390×844 (mobile-first form factor)
- Min size: 360×600
- Resizable, centered on launch

### Theme
- Dark theme only (`--color-bg: #0D1117`)
- CSS variables for all colors
- Custom scrollbars

## State Management (Zustand)

| Store | File | Persist | Purpose |
|---|---|---|---|
| `useServerStore` | `serverStore.ts` | ✅ localStorage | Multi-server list, active server |
| `useAuthStore` | `authStore.ts` | ✅ localStorage | User keys per server |
| `useContactsStore` | `contactsStore.ts` | ✅ localStorage | Contacts list + presence |
| `useChatStore` | `chatStore.ts` | ✅ localStorage | Messages + unread counts |
| `useCallStore` | `callStore.ts` | ❌ (ephemeral) | Active call state + records |
| `useNotificationStore` | `notificationStore.ts` | ❌ (ephemeral) | Toasts + incoming call |

## Services

### Socket service (`src/services/socket.ts`)
- Singleton class `SocketService`
- Handles all Socket.IO communication
- Callback-based event system with buffering
- Automatic heartbeat (30s), reconnection (5 attempts)
- TURN config fetch on connect

### Crypto service (`src/services/crypto.ts`)
- TweetNaCl-based E2E encryption
- `generateKeyPair()` — X25519 key pair
- `deriveSharedSecret()` — compute shared key
- `encryptMessage()` / `decryptMessage()` — XSalsa20-Poly1305

### WebRTC service (`src/services/WebRTCService.ts`)
- Browser-native `RTCPeerConnection` API
- ICE candidate buffering (before remote description set)
- Automatic ICE restart on connection failure
- TURN server support

## Socket.IO Events

See `src/types/socket-events.ts` for typed event maps.

### Client → Server
register, heartbeat, get_presence, friend_request, friend_accept, friend_decline,
message, messages_read, call_offer, call_accept, call_decline, call_hangup, ice_candidate

### Server → Client
registered, error, kicked, presence, presence_batch, friend_request, friend_request_sent,
friend_accepted, friend_confirmed, friend_declined, message, message_sent, message_failed,
messages_read, call_incoming, call_offer_sent, call_accepted, call_declined, call_ended,
call_timedout, ice_candidate

## Routes

| Path | Page | Description |
|---|---|---|
| `/` | WelcomePage | Server selection / first launch |
| `/home` | HomePage | Contacts list |
| `/chat/:contactId` | ChatPage | E2E encrypted conversation |
| `/add-server` | AddServerPage | Add new server |
| `/add-friend` | AddFriendPage | Send friend request |
| `/share-id` | ShareIdPage | Show QR + user ID |
| `/call` | CallPage | Full-screen voice call |

## Multi-Server Data Isolation

Each server has its own:
- **User identity** (userId + X25519 keypair)
- **Contacts** (stored with server context)
- **Messages** (stored with `{serverId}_{contactId}` pattern)
- **Unread counts**

## Crypto Compatibility

Binary-compatible with VoidChat mobile app:
- Same key exchange (X25519 via `nacl.box.before`)
- Same encryption (XSalsa20-Poly1305 via `nacl.secretbox`)
- Same encoding (Base64 for keys, nonces, ciphertext)
- Messages encrypted on desktop are decryptable on mobile

## Release

```bash
npm run tauri build
```

Output platforms:
- **Windows**: `src-tauri/target/release/bundle/msi/*.msi`
- **macOS**: `src-tauri/target/release/bundle/dmg/*.dmg`
- **Linux**: `src-tauri/target/release/bundle/appimage/*.AppImage`

## Known Issues

1. IncomingCallBanner and NotificationBanner are placeholders (return null)
2. Speaker toggle in CallPage is visual-only
3. No popup notifications when app is in background
