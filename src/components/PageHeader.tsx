import { ReactNode } from 'react';
import { BackButton } from './BackButton';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  onBack?: () => void;
}

/**
 * Шапка страницы.
 * - Слева: опциональная кнопка «Назад» + заголовок.
 * - Справа: опциональная зона для действий (например, CallButton, MenuButton).
 */
export function PageHeader({
  title,
  showBack = true,
  rightAction,
}: PageHeaderProps) {
  return (
    <div
      className='flex items-center justify-between px-4 py-3 flex-shrink-0'
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <div className='flex items-center gap-2 min-w-0'>
        {showBack && <BackButton />}
        <h1 className='text-lg font-semibold truncate'>{title}</h1>
      </div>

      {rightAction && <div className='flex items-center flex-shrink-0'>{rightAction}</div>}
    </div>
  );
}
