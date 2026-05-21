# VoidChat Desktop

> E2E encrypted messenger — desktop client for Windows, Linux, and macOS.

Built with **Tauri v2 + React + TypeScript**. Binary size ~8 MB, RAM usage ~60 MB.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Tauri v2** (Rust backend + OS WebView) |
| Frontend | **React 19 + TypeScript** |
| Build tool | **Vite 6** |
| Styling | **Tailwind CSS 4** |
| State | **Zustand 5** (persist middleware) |
| Routing | **React Router v7** |
| Socket | **socket.io-client v4** |
| Crypto | **tweetnacl** (X25519 + XSalsa20-Poly1305) |
| WebRTC | Native browser APIs (RTCPeerConnection) |
| QR | **qrcode** library |

## Project Structure

```
voidchat-desktop/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Root component + routing
│   ├── index.css             # Global styles + Tailwind + theme
│   ├── vite-env.d.ts
│   ├── types/
│   │   ├── index.ts          # Domain types, call types, utilities
│   │   └── socket-events.ts  # Typed Socket.IO events
│   ├── constants.ts          # App-wide constants
│   ├── services/
│   │   ├── crypto.ts         # E2E encryption (tweetnacl)
│   │   ├── socket.ts         # Socket.IO client service
│   │   └── WebRTCService.ts  # WebRTC peer connection manager
│   ├── stores/
│   │   ├── index.ts          # Store re-exports
│   │   ├── serverStore.ts    # Multi-server management
│   │   ├── authStore.ts      # User keys & authentication
│   │   ├── contactsStore.ts  # Contacts & presence
│   │   ├── chatStore.ts      # Messages & unread counts
│   │   ├── callStore.ts      # Call state & history
│   │   └── notificationStore.ts  # Toasts & incoming call
│   ├── components/
│   │   ├── Layout.tsx         # Page layout wrapper
│   │   ├── PageHeader.tsx     # Page title + back button
│   │   ├── BackButton.tsx     # Navigation back
│   │   ├── ContactItem.tsx    # Contact row in list
│   │   ├── CallButton.tsx     # Voice call button
│   │   ├── EmptyState.tsx     # Empty list placeholder
│   │   ├── Modal.tsx          # Reusable modal dialog
│   │   ├── ConfirmAlert.tsx   # Confirmation dialog
│   │   ├── Toast.tsx          # Toast notification system
│   │   ├── NotificationBanner.tsx  # Message notification
│   │   └── IncomingCallBanner.tsx  # Incoming call UI
│   └── pages/
│       ├── WelcomePage.tsx    # Server list / first launch
│       ├── AddServerPage.tsx  # Add new server form
│       ├── HomePage.tsx       # Main screen (contacts list)
│       ├── AddFriendPage.tsx  # Send friend request
│       ├── ShareIdPage.tsx    # Share your user ID + QR
│       ├── ChatPage.tsx       # E2E encrypted chat
│       └── CallPage.tsx       # Full-screen call UI
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs            # Tauri app setup + plugins
│   │   └── main.rs           # Entry point
│   ├── Cargo.toml            # Rust dependencies
│   ├── build.rs              # Tauri build script
│   ├── tauri.conf.json       # Tauri configuration
│   ├── capabilities/
│   │   └── default.json      # Permissions
│   └── icons/                # App icons
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── .gitignore
```

## Development

### Prerequisites

- **Node.js** >= 22.11.0
- **Rust** >= 1.75 (install via `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- **Tauri CLI**: `cargo install tauri-cli --version "^2.0"`

### Setup

```bash
cd voidchat-desktop
npm install
```

### Run (development mode)

```bash
npm run tauri dev
```

This starts Vite dev server on port 1420 and opens the Tauri window.

### Build (production)

```bash
npm run tauri build
```

Builds the app and creates platform-specific installers:
- **Windows**: `.msi` / `.exe`
- **macOS**: `.dmg` / `.app`
- **Linux**: `.AppImage` / `.deb`

Output in `src-tauri/target/release/bundle/`.

### Available scripts

```bash
npm run dev        # Vite dev server only (no Tauri window)
npm run build      # TypeScript check + Vite production build
npm run tauri      # Run any Tauri CLI command
npm run lint       # ESLint
npm run format     # Prettier
```

## Features

### Multi-Server

Add multiple VoidChat servers. Each server has its own:
- User identity (keypair)
- Contacts list
- Message history
- Unread counts

Switch between servers from the Home screen header.

### E2E Encryption

- **Algorithm:** X25519 key exchange + XSalsa20-Poly1305 symmetric encryption
- **Library:** tweetnacl (pure JS, no native deps)
- **Keys:** Keypair generated per-server, private key never leaves the device
- **Compatible:** Binary-compatible with VoidChat mobile (React Native) client

### Voice Calls

- **Protocol:** WebRTC P2P (audio only, Opus 32kbps + RED/FEC)
- **Signaling:** Socket.IO relay (server never sees media)
- **STUN:** Google public STUN servers
- **TURN:** Optional coturn server (fetched from server on connect)
- **ICE restart:** Automatic renegotiation on connection drop

### Message Queuing

- Offline messages are queued on the server and delivered on next connection
- Pending friend requests are also queued

## Architecture Decisions

### Why Tauri instead of Electron?

| Criteria | Tauri | Electron |
|---|---|---|
| Binary size | ~8 MB | ~150-250 MB |
| RAM usage | ~60 MB | ~200-500 MB |
| Performance | Native WebView | Chromium |
| Security | Sandboxed by default | Full Node access |
| Cross-platform | Win/Linux/Mac | Win/Linux/Mac |

### Why Zustand instead of MobX?

- Zustand is lighter (~2 KB vs ~15 KB)
- No decorators/annotations needed
- Built-in `persist` middleware for localStorage
- Works seamlessly with React hooks
- Familiar patterns for React Native developers

## Compatibility

- **Server:** Tested with voidchat-server v1.2.0+
- **Mobile:** Fully compatible with VoidChatApp (React Native)
- **Desktop platforms:** Windows 10+, macOS 12+, Linux (Ubuntu 20.04+)

## Known Limitations

- [ ] `IncomingCallBanner` component is a placeholder (TODO)
- [ ] `NotificationBanner` component is a placeholder (TODO)
- [ ] Speaker toggle in CallPage is UI-only (no native audio routing)
- [ ] No tray/minimize-to-tray support yet
- [ ] No auto-start on system boot
- [ ] No keyboard shortcuts (Ctrl+K search, etc.)
