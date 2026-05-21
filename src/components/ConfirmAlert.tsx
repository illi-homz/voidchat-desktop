import { Modal } from './Modal';

interface ConfirmAlertProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

/**
 * Модалка подтверждения действия.
 * - Если `destructive` — кнопка подтверждения красная.
 * - По Esc и отмене закрывается.
 */
export function ConfirmAlert({
  open,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
  destructive,
}: ConfirmAlertProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className='text-sm mb-6' style={{ color: 'var(--color-text-muted)' }}>
        {message}
      </p>

      <div className='flex gap-3'>
        {/* Cancel */}
        <button
          onClick={onCancel}
          className='flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150'
          style={{
            backgroundColor: 'transparent',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
        >
          {cancelText}
        </button>

        {/* Confirm */}
        <button
          onClick={onConfirm}
          className='flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150'
          style={{
            backgroundColor: destructive
              ? 'var(--color-error)'
              : 'var(--color-primary)',
            color: destructive ? '#FFFFFF' : 'var(--color-bg)',
          }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
