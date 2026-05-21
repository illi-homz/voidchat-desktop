import { useNavigate } from 'react-router-dom';
import { useServerStore } from '../stores';

export function WelcomePage() {
  const navigate = useNavigate();
  const servers = useServerStore((s) => s.servers);
  const setActiveServer = useServerStore((s) => s.setActiveServer);

  const handleSelectServer = (serverId: string) => {
    setActiveServer(serverId);
    navigate('/home');
  };

  return (
    <div className='h-full flex flex-col'>
      {/* Header */}
      <div className='px-4 py-6 pt-12 flex flex-col items-center'>
        <div className='text-4xl mb-2'>🦜</div>
        <h1 className='text-2xl font-bold mb-1'>VoidChat</h1>
        <p className='text-sm' style={{ color: 'var(--color-text-muted)' }}>
          E2E encrypted messenger
        </p>
      </div>

      {/* Server list or empty state */}
      <div className='flex-1 px-4 overflow-y-auto'>
        {servers.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <p className='text-sm mb-6' style={{ color: 'var(--color-text-muted)' }}>
              No servers yet. Add your first server to start chatting.
            </p>
            <button
              onClick={() => navigate('/add-server')}
              className='px-6 py-3 rounded-xl text-sm font-semibold transition-colors duration-150'
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
            >
              Add Server
            </button>
          </div>
        ) : (
          <div className='flex flex-col gap-2 pt-4'>
            {servers.map((server) => (
              <div
                key={server.id}
                onClick={() => handleSelectServer(server.id)}
                className='flex items-center gap-3 px-4 py-4 rounded-xl cursor-pointer transition-colors duration-150'
                style={{ backgroundColor: 'var(--color-surface)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
              >
                <div
                  className='w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0'
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
                >
                  {server.name.charAt(0).toUpperCase()}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='font-medium truncate'>{server.name}</div>
                  <div className='text-xs truncate' style={{ color: 'var(--color-text-muted)' }}>
                    {server.url}
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-text-muted)' }}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            ))}
            <button
              onClick={() => navigate('/add-server')}
              className='flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed transition-colors duration-150 mt-2'
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span className='text-sm font-medium'>Add Server</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
