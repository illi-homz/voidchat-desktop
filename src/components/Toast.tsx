import { useNotificationStore } from '../stores';

/**
 * Toast-контейнер.
 * Рендерит все активные toast-уведомления в верхней части экрана.
 * Автоматически удаляет toast через 4 секунды (логика в сторе).
 */
export function ToastContainer() {
  const toasts = useNotificationStore((s) => s.toasts);
  const removeToast = useNotificationStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className='fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-32px)] max-w-sm pointer-events-none'>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className='animate-fade-in px-4 py-3 rounded-lg text-sm cursor-pointer shadow-lg pointer-events-auto'
          style={{
            backgroundColor:
              toast.type === 'error'
                ? 'var(--color-error)'
                : toast.type === 'success'
                  ? 'var(--color-success)'
                  : 'var(--color-surface)',
            color:
              toast.type === 'info' ? 'var(--color-text)' : '#FFFFFF',
            border:
              toast.type === 'info'
                ? '1px solid var(--color-border)'
                : 'none',
          }}
        >
          {toast.text}
        </div>
      ))}
    </div>
  );
}
