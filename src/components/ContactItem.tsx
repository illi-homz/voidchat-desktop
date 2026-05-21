import { maskUserId } from '../types';

interface ContactItemProps {
  userId: string;
  publicKey: string;
  nickname?: string;
  online: boolean;
  unread?: number;
  onClick?: () => void;
  onContextMenu?: () => void;
}

export function ContactItem({
  userId,
  nickname,
  online,
  unread = 0,
  onClick,
  onContextMenu,
}: ContactItemProps) {
  const displayName = nickname || maskUserId(userId);
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.();
      }}
      className='flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 no-select'
      style={{ borderBottom: '1px solid var(--color-border)' }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = 'transparent')
      }
    >
      {/* Avatar */}
      <div className='relative flex-shrink-0'>
        <div
          className='w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold'
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
        >
          {initials}
        </div>

        {/* Online dot */}
        <div
          className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2'
          style={{
            backgroundColor: online
              ? 'var(--color-online)'
              : 'var(--color-text-muted)',
            borderColor: 'var(--color-surface)',
          }}
        />
      </div>

      {/* Name and masked ID */}
      <div className='flex-1 min-w-0'>
        <div className='text-sm font-medium truncate'>{displayName}</div>
        <div className='text-xs truncate' style={{ color: 'var(--color-text-muted)' }}>
          {maskUserId(userId)}
        </div>
      </div>

      {/* Unread badge */}
      {unread > 0 && (
        <div
          className='flex-shrink-0 min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 text-xs font-bold'
          style={{ backgroundColor: 'var(--color-error)', color: '#FFFFFF' }}
        >
          {unread > 99 ? '99+' : unread}
        </div>
      )}
    </div>
  );
}
