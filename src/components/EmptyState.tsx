interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

/**
 * Пустое состояние для списков (контакты, сообщения, серверы).
 * - Иконка, заголовок, описание, опциональная кнопка действия.
 * - Исползуется, когда список пуст (например, нет контактов).
 */
export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
      <div className='text-4xl mb-4 opacity-50'>&#128172;</div>

      <h3 className='text-lg font-medium mb-1'>{title}</h3>

      {description && (
        <p className='text-sm mb-4' style={{ color: 'var(--color-text-muted)' }}>
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className='px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150'
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
