# VoidChat Desktop — AGENTS.md 🦜

> Десктопный клиент VoidChat — E2E-зашифрованный мессенджер.
> **Платформы:** Windows, Linux, macOS (Tauri v2).

---

## 🚀 Релиз одной командой

```bash
npm run release         # 0.x.y → 0.x.y+1 + tag + push → CI → Releases
npm run release:patch   # явно patch
npm run release:minor   # явно minor
npm run release:major   # явно major
```

Скрипт (`scripts/bump-version.sh`):
1. Инкрементит версию в `package.json` + `src-tauri/tauri.conf.json`
2. Создаёт аннотированный git tag `vX.Y.Z`
3. Пушит в GitHub → Actions собирает Win/Mac/Linux → публикует в Releases

---

## 🏗 Архитектура

### Стек

| Технология | Зачем |
|---|---|
| 🦀 **Tauri v2** | Ржавый бэкенд + хромовая морда, 8 МБ |
| ⚛️ **React 19 + TS** | Компоненты |
| ⚡ **Vite 6** | Быстрый сборщик |
| 🎨 **Tailwind CSS 4** | Тёмная тема, CSS-переменные |
| 📦 **Zustand 5** | Стейт с persist в localStorage |
| 🗺 **React Router 7** | 7 страниц-маршрутов |
| 📡 **socket.io-client 4** | Вебсокеты |
| 🔐 **tweetnacl** | X25519 + XSalsa20-Poly1305 |
| 📞 **WebRTC** | P2P аудиозвонки |

### Окно

- 390×844 (как Android), минимум 360×600
- Ресайзится, центрируется
- Тёмная тема (`--color-bg: #0D1117`)

---

## 📦 Сторы (Zustand)

| Стор | Файл | Persist | Суть |
|---|---|---|---|
| 🗄 `useServerStore` | `serverStore.ts` | ✅ | Список серверов |
| 🔑 `useAuthStore` | `authStore.ts` | ✅ | Ключи E2E по серверам |
| 👥 `useContactsStore` | `contactsStore.ts` | ✅ | Контакты + онлайн |
| 💬 `useChatStore` | `chatStore.ts` | ✅ | Сообщения + unread |
| 📞 `useCallStore` | `callStore.ts` | ❌ | Состояние звонка |
| 🔔 `useNotificationStore` | `notificationStore.ts` | ❌ | Тосты + входящий звонок |

---

## ⚙️ Сервисы

### 📡 Socket (`socket.ts`)
- `connect(url, userId, publicKey)` → register + heartbeat
- Буферизация событий до подписки
- Переподключение (5 попыток)
- TURN config fetch после registered

### 🔐 Crypto (`crypto.ts`)
- `generateKeyPair()` — X25519
- `deriveSharedSecret(pub, priv)` — общий секрет
- `encryptMessage(msg, secret)` / `decryptMessage(cipher, nonce, secret)`
- **Полная совместимость** с VoidChat мобилкой

### 📞 WebRTC (`WebRTCService.ts`)
- Нативный браузерный `RTCPeerConnection`
- Буферизация ICE-кандидатов
- ICE restart при обрыве
- TURN поддержка

---

## 📡 Socket.IO события

### Client → Server
register, heartbeat, get_presence, friend_request, friend_accept, friend_decline,
message, messages_read, call_offer, call_accept, call_decline, call_hangup, ice_candidate

### Server → Client
registered, error, kicked, presence, presence_batch, friend_request, friend_request_sent,
friend_accepted, friend_confirmed, friend_declined, message, message_sent, message_failed,
messages_read, call_incoming, call_offer_sent, call_accepted, call_declined, call_ended,
call_timedout, ice_candidate

---

## 🗺 Маршруты

| Путь | Страница |
|---|---|
| `/` | WelcomePage — выбор сервера |
| `/home` | HomePage — список контактов |
| `/chat/:contactId` | ChatPage — E2E-чат |
| `/add-server` | AddServerPage — добавить сервер |
| `/add-friend` | AddFriendPage — добавить друга |
| `/share-id` | ShareIdPage — QR + UserID |
| `/call` | CallPage — звонок (fullscreen) |

---

## 🐛 Известные баги

1. 🚫 **IncomingCallBanner** — заглушка
2. 🚫 **NotificationBanner** — заглушка
3. 🔊 **Speaker toggle** — UI без нативного API
4. 🔕 **Pop-up уведомления** — нет в фоне
5. 🔒 **HTTPS** — сервер без TLS, http://

---

## 🦜 Философия

**Приватность** — E2E или ничего. **Совместимость** — десктоп + мобилка + сервер.
