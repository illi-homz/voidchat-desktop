# VoidChat Desktop — AGENTS.md 🦜

> Десктопный клиент VoidChat — E2E-зашифрованный мессенджер.
> Не дай прочитать свои секреты никому. Даже себе (ну, почти).

**Платформы:** Windows, Linux, macOS (Tauri v2).

---

## 🏃‍♂️ Быстрый старт

```bash
npm install              # Завариваем чай, ставим зависимости
npm run dev              # Vite сервер на порту 1420
npm run tauri dev        # Vite + Tauri окошко (как надо!)
npm run tauri build      # Сборка под все платформы
npm run lint             # ESLint — вычесываем блох
npm run format           # Prettier — причесываем код
```

---

## 🏗 Архитектура

### 📚 Стек технологий

| Технология | Версия | Зачем |
|---|---|---|
| 🦀 **Tauri v2** | ^2.0 | Ржавый бэкенд + хромовая морда |
| ⚛️ **React** | 19 | Компонентный подход |
| 📘 **TypeScript** | 5.8 | Чтобы баги не прятались |
| ⚡ **Vite** | 6 | Быстро, очень быстро |
| 🎨 **Tailwind CSS 4** | 4.1 | Красиво, темно, уютно |
| 📦 **Zustand** | 5 | Стейт-менеджмент на минималках |
| 🗺 **React Router** | 7 | Куда тыкнул — туда пришёл |
| 📡 **socket.io-client** | 4.8 | Реалтайм-свисток |
| 🔐 **tweetnacl** | 1.0 | Шифровальная машинка |
| 📱 **qrcode** | 1.5 | QR-коды, красивости |

### 🪟 Окно приложения

| Параметр | Значение |
|---|---|
| 📐 **Размер по умолчанию** | 390×844 (как Android) |
| 📏 **Минимальный размер** | 360×600 |
| 🔄 **Ресайз** | Можно растягивать |
| 🎯 **Появление** | По центру экрана |
| 🎭 **Тема** | Тёмная (белого не ждите) |

### 🎨 Цветовая гамма

Всё в CSS-переменных, тёмная тема по уши:

```
--color-bg:          #0D1117    (космический черный)
--color-surface:     #1C2128    (мокрый асфальт)
--color-primary:     #F0C040    (золотой пиастр)
--color-error:       #F85149    (красная тревога)
--color-success:     #3FB950    (зеленый свет)
--color-text:        #F0F6FC    (белый, но не слепит)
```

---

## 📦 Сторы (Zustand)

| Стор | Файл | Сохраняется? | Зачем |
|---|---|---|---|
| 🗄 `useServerStore` | `serverStore.ts` | ✅ localStorage | Список серверов |
| 🔑 `useAuthStore` | `authStore.ts` | ✅ localStorage | Ключи юзера |
| 👥 `useContactsStore` | `contactsStore.ts` | ✅ localStorage | Контакты + кто онлайн |
| 💬 `useChatStore` | `chatStore.ts` | ✅ localStorage | Сообщения + непрочитанное |
| 📞 `useCallStore` | `callStore.ts` | ❌ Только пока звонок | Состояние звонка |
| 🔔 `useNotificationStore` | `notificationStore.ts` | ❌ Только пока живёт | Тосты + входящий звонок |

---

## ⚙️ Сервисы

### 📡 Socket-сервис (`socket.ts`)

Однорукого бандита не будет — здесь всё честно:

- **Класс-одиночка** `SocketService` — один на всё приложение
- **Система колбэков** с буферизацией — опоздал на событие? Не беда, буфер подождёт
- **Пульс** каждые 30 секунд (heartbeat)
- **Переподключение** до 5 попыток с задержкой 1-5 секунд
- **TURN-конфиг** — подтягивается с сервера после подключения

### 🔐 Крипто-сервис (`crypto.ts`)

Тот же tweetnacl, что и в мобилке — **полная совместимость**:

| Функция | Что делает |
|---|---|
| `generateKeyPair()` | Создаёт X25519 ключи |
| `deriveSharedSecret(pub, priv)` | Вычисляет общий секрет |
| `encryptMessage(msg, secret)` | Шифрует (XSalsa20-Poly1305) |
| `decryptMessage(cipher, nonce, secret)` | Дешифрует |

Зашифровал на десктопе — мобилка расшифрует. И наоборот. Магия, да.

### 📞 WebRTC-сервис (`WebRTCService.ts`)

Нативный браузерный WebRTC, без понтов:

- `RTCPeerConnection` — мозг звонка
- Буферизация ICE-кандидатов — пока remoteDescription не готов, кандидаты ждут в очереди
- Автоматический ICE restart — если соединение упало
- Поддержка TURN — если NAT не пускает

---

## 📡 Socket.IO события

Полный список с типами — `src/types/socket-events.ts`.

### Клиент → Сервер (что шлём)

```
register, heartbeat, get_presence,
friend_request, friend_accept, friend_decline,
message, messages_read,
call_offer, call_accept, call_decline, call_hangup,
ice_candidate
```

### Сервер → Клиент (что получаем)

```
registered, error, kicked,
presence, presence_batch,
friend_request, friend_request_sent,
friend_accepted, friend_confirmed, friend_declined,
message, message_sent, message_failed, messages_read,
call_incoming, call_offer_sent, call_accepted,
call_declined, call_ended, call_timedout,
ice_candidate
```

---

## 🗺 Маршруты (роуты)

| Путь | Страница | Что там |
|---|---|---|
| `/` | **WelcomePage** | Выбор сервера / первый запуск |
| `/home` | **HomePage** | Список контактов |
| `/chat/:contactId` | **ChatPage** | E2E-чат с контактом |
| `/add-server` | **AddServerPage** | Добавить сервер |
| `/add-friend` | **AddFriendPage** | Отправить заявку в друзья |
| `/share-id` | **ShareIdPage** | Показать QR + User ID |
| `/call` | **CallPage** | Звонок (полный экран) |

---

## 🗄 Изоляция данных между серверами

Каждый сервер — свой мир:

- 🆔 **Свои ключи** (userId + X25519 пара)
- 👥 **Свои контакты**
- 💬 **Свои сообщения** (префикс `{serverId}_{contactId}`)
- 🔴 **Свои непрочитанные**

Переключаешь сервер — переключаешь реальность. Почти.

---

## 🔐 Криптосовместимость

С мобильным VoidChat — **бинарная совместимость**:

| Параметр | Значение |
|---|---|
| 🔑 Обмен ключами | X25519 (`nacl.box.before`) |
| 🔒 Шифрование | XSalsa20-Poly1305 (`nacl.secretbox`) |
| 📝 Кодировка | Base64 (ключи, nonce, шифротекст) |
| 🤝 Итог | Шифруй на компе — читай на телефоне |

---

## 🚀 Релиз

### Вручную

```bash
npm run tauri build
```

### Через CI/CD (GitHub Actions)

```bash
npm run release:patch   # 0.1.0 → 0.1.1
npm run release:minor   # 0.1.0 → 0.2.0
npm run release:major   # 0.1.0 → 1.0.0

git push --follow-tags  # CI сам соберёт под Win/Mac/Linux
```

### Что получим

| Платформа | Формат |
|---|---|
| 🪟 Windows | `src-tauri/target/release/bundle/msi/*.msi` |
| 🍏 macOS | `src-tauri/target/release/bundle/dmg/*.dmg` |
| 🐧 Linux | `src-tauri/target/release/bundle/appimage/*.AppImage` |

---

## 🐛 Известные баги (TODO)

1. 🚫 **IncomingCallBanner** — заглушка, звонок принимается только с CallPage
2. 🚫 **NotificationBanner** — заглушка, всплывающие уведомления не работают
3. 🔊 **Speaker toggle** — UI есть, реального переключения нет
4. 🔕 **Pop-up уведомления** — когда приложение свёрнуто, не приходят
5. 🔒 **HTTPS** — сервер без TLS, клиент использует http://. Нужно: настроить nginx + Let's Encrypt на сервере → переключить клиент на https://

---

## 🦜 Философия проекта

- **Приватность** — не обсуждается. E2E или ничего.
- **Простота** — минимум кнопок, максимум дела.
- **Совместимость** — десктоп, мобилка, сервер — всё вяжется в один узел.

Вопросы? Баги? Идеи? 🦜
