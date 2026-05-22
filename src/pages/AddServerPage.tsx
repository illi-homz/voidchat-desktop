import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServerStore, useAuthStore } from '../stores';
import { socketService } from '../services/socket';
import { PageHeader } from '../components/PageHeader';

export function AddServerPage() {
  const navigate = useNavigate();
  const addServer = useServerStore((s) => s.addServer);
  const generateKeys = useAuthStore((s) => s.generateKeys);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) {
      setError('Please fill in both fields');
      return;
    }

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `http://${normalizedUrl}`;
    }
    normalizedUrl = normalizedUrl.replace(/\/$/, '');

    setConnecting(true);
    setError(null);

    try {
      const serverId = crypto.randomUUID();
      const user = generateKeys(serverId);
      setUser(serverId, user);

      await socketService.connect(normalizedUrl, user.userId, user.publicKey);
      socketService.disconnect();

      addServer({
        id: serverId,
        name: name.trim(),
        url: normalizedUrl,
        addedAt: Date.now(),
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className='h-full flex flex-col'>
      <PageHeader title='Add Server' />
      <div className='flex-1 px-4 pt-6 overflow-y-auto'>
        <div className='flex flex-col gap-4'>
          <div>
            <label className='text-xs font-medium mb-1.5 block' style={{ color: 'var(--color-text-muted)' }}>
              Server Name
            </label>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='My Server'
              className='w-full px-4 py-3 rounded-xl text-sm transition-colors duration-150'
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
            />
          </div>

          <div>
            <label className='text-xs font-medium mb-1.5 block' style={{ color: 'var(--color-text-muted)' }}>
              Server URL
            </label>
            <input
              type='text'
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder='voidchat.example.com:9001'
              className='w-full px-4 py-3 rounded-xl text-sm transition-colors duration-150'
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
            />
          </div>

          {error && (
            <div className='text-sm px-4 py-3 rounded-xl' style={{ backgroundColor: 'rgba(248,81,73,0.1)', color: 'var(--color-error)' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={connecting}
            className='w-full px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 disabled:opacity-50'
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
          >
            {connecting ? 'Connecting...' : 'Add & Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}
