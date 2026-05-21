import { useNavigate } from 'react-router-dom';

/**
 * Кнопка «Назад».
 * Использует `navigate(-1)` для возврата на предыдущую страницу в стеке роутера.
 */
export function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className='p-2 -ml-2 rounded-lg transition-colors duration-150'
      style={{ color: 'var(--color-text)' }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = 'transparent')
      }
      aria-label='Назад'
    >
      <svg
        width='24'
        height='24'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M19 12H5M12 19l-7-7 7-7' />
      </svg>
    </button>
  );
}
