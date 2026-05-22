# VoidChat Desktop 🦜

> **Шифруем всё, лодки не жгём!**
> E2E-защифрованный мессенджер для Windows, Linux и macOS.

Собран на **Tauri v2 + React + TypeScript**. Весит ~8 МБ, жрёт ~60 МБ RAM.
Ваш десктоп даже не заметит — будет чавкать и радоваться.

---

## 🚀 Одна команда — новый релиз

```bash
npm run release   # поднять версию → commit → tag → push → CI сборка → релиз
```

Всё: `npm run release` делает сам:
1.  Поднимает версию в `package.json` и `tauri.conf.json`
2.  Создаёт git commit + аннотированный tag
3.  Пушит в GitHub
4.  → GitHub Actions собирает под **Windows, macOS, Linux**
5.  → Публикует в **Releases**

Ещё варианты:
```bash
npm run release:patch   # 0.1.31 → 0.1.32 (фикс)
npm run release:minor   # 0.1.31 → 0.2.0  (фича)
npm run release:major   # 0.1.31 → 1.0.0  (крупное)
```

---

## 📂 Что внутри?

```
voidchat-desktop/
├── src/
│   ├── main.tsx           # Входная дверь (React)
│   ├── App.tsx            # Диспетчерская (роутинг)
│   ├── index.css          # Причепуриться (стили)
│   ├── types/             # Описания типов
│   ├── constants.ts       # Циферки-константки
│   ├── services/
│   │   ├── crypto.ts      # Шифровальная машинка (tweetnacl)
│   │   ├── socket.ts      # Свисток Socket.IO
│   │   └── WebRTCService.ts  # Телефонная трубка (WebRTC)
│   ├── stores/            # Кладовки с состоянием (Zustand)
│   ├── components/        # Кубики-кирпичики (10 шт)
│   └── pages/             # Странички-экраны (7 шт)
├── src-tauri/             # Ржавый движок (Rust)
├── .github/workflows/     # CI/CD магия
└── scripts/               # Скрипт релиза
```

---

## 🛠 Стек

| Слой | Технология |
|---|---|
| 🏗 **Каркас** | **Tauri v2** (Rust + WebView) |
| ⚛️ **Фронт** | **React 19 + TypeScript** |
| ⚡ **Сборка** | **Vite 6** |
| 🎨 **Стили** | **Tailwind CSS 4** (тёмная тема) |
| 📦 **Стейт** | **Zustand 5** (persist) |
| 🗺 **Роутинг** | **React Router v7** |
| 📡 **Сокеты** | **socket.io-client** |
| 🔐 **Крипта** | **tweetnacl** (X25519 + XSalsa20-Poly1305) |
| 📞 **Звонки** | Нативный WebRTC (P2P) |

---

## 💻 Разработка

### Что нужно

| Инструмент | Версия | Установка |
|---|---|---|
| **Node.js** | >= 22.11.0 | `nvm install 22` |
| **Rust** | >= 1.75 | `curl https://sh.rustup.rs \| sh` |

Tauri CLI ставить отдельно не надо — он в npm-зависимостях.

### Запуск

```bash
cd voidchat-desktop
npm install          # поставить зависимости
npm run tauri dev    # запустить дев-режим (окно 390×844)
```

### Команды

```bash
npm run dev          # Vite сервер (без окошка)
npm run build        # TypeScript + Vite сборка
npm run tauri build  # production сборка (бинарник)
npm run lint         # ESLint
npm run format       # Prettier
```

---

## 🎯 Фичи

### 🗄 Multi-Server

Добавляй сколько хочешь серверов. У каждого свои ключи, контакты, сообщения и непрочитанные.

### 🔒 E2E-шифрование

**X25519 + XSalsa20-Poly1305** через tweetnacl. Полная бинарная совместимость с VoidChat мобилкой. Зашифровал на десктопе — расшифровал на телефоне.

### 📞 Голосовые звонки

WebRTC P2P, только аудио. STUN от Google, опциональный TURN для NAT. ICE restart при обрыве.

### 📬 Офлайн-сообщения

Сообщения и заявки в друзья ждут в очереди на сервере, доставляются при следующем подключении.

---

## 📦 Сборка под платформы

### Локально

```bash
npm run tauri build
```

| Платформа | Формат |
|---|---|
| 🪟 **Windows** | `.msi` / `.exe` |
| 🍏 **macOS** | `.dmg` / `.app` |
| 🐧 **Linux** | `.deb` + `.AppImage` |

### Через CI (GitHub Actions)

Пушнули тег — CI сам собирает всё и выкладывает:

```bash
npm run release   # одной командой
```

→ раздел **Releases** на GitHub

---

## 🔌 Подключение к серверу

При добавлении сервера указывай адрес с **HTTP** (сервер без TLS):

```
138.16.224.63:9001     # OK, клиент сам добавит http://
http://example.com     # OK
https://example.com    # только если есть HTTPS
```

Подробнее про сервер — в `AGENTS.md` проекта

---

## 🏛 Почему Tauri, а не Electron?

| Параметр | Tauri 🦀 | Electron 🐘 |
|---|---|---|
| 📦 **Вес** | **~8 МБ** | ~150-250 МБ |
| 🐏 **RAM** | **~60 МБ** | ~200-500 МБ |
| 🛡 **Безопасность** | Песочница | Полный доступ к Node |

---

## 🐛 Известные ограничения

- [ ] 🚫 **IncomingCallBanner** — заглушка
- [ ] 🚫 **NotificationBanner** — заглушка
- [ ] 🔊 **Speaker toggle** — только иконка (нет нативного API)
- [ ] 🗑 **Tray** — нет сворачивания в трей
- [ ] ⏰ **Автозапуск** — нет
- [ ] ⌨ **Хоткеи** — нет
- [ ] 🔒 **HTTPS** — сервер без TLS, клиент через http://

---

## 🦜 Лицензия

Пиратский код. Бери, форкай, пользуйся.
