import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../stores';
import { maskUserId } from '../types';

/**
 * Баннер уведомления о входящем сообщении.
 * Показывается, когда сообщение приходит от контакта, чат с которым не открыт.
 * Тап — переход в чат с отправителем.
 *
 * TODO: Подключить к socket-событиям `message` для отображения.
 */
export function NotificationBanner() {
  const navigate = useNavigate();
  const addToast = useNotificationStore((s) => s.addToast);

  // Плейсхолдер. Логика будет добавлена при интеграции сокета:
  // 1. Слушать `incomingMessage` из socket-сервиса
  // 2. Если чат с отправителем не открыт — показывать баннер
  // 3. По тапу — navigate(`/chat/${contactId}`)
  //
  // Пример использования:
  // const [banner, setBanner] = useState<{ contactId: string; text: string } | null>(null);
  // if (!banner) return null;
  //
  // return (
  //   <div
  //     onClick={() => { navigate(`/chat/${banner.contactId}`); setBanner(null); }}
  //     className='fixed top-16 left-1/2 -translate-x-1/2 z-40 animate-slide-down
  //                px-4 py-3 rounded-lg text-sm cursor-pointer shadow-lg max-w-sm w-[calc(100%-32px)]'
  //     style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
  //   >
  //     {banner.text}
  //   </div>
  // );

  return null;
}
