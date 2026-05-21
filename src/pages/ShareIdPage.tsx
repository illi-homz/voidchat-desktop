import { useEffect, useState } from 'react';
import { useServerStore, useAuthStore } from '../stores';
import { PageHeader } from '../components/PageHeader';
import { useNotificationStore } from '../stores';

export function ShareIdPage() {
  const activeServer = useServerStore((s) => s.getActiveServer());
  const getUser = useAuthStore((s) => s.getUser);
  const addToast = useNotificationStore((s) => s.addToast);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const serverId = useServerStore((s) => s.activeServerId);
  const user = serverId ? getUser(serverId) : undefined;

  useEffect(() => {
    // Generate QR code dynamically
    if (user) {
      import('qrcode').then((QRCode) => {
        QRCode.toDataURL(user.userId, {
          width: 256,
          margin: 2,
          color: { dark: '#F0C040', light: '#0D1117' },
        }).then(setQrDataUrl);
      });
    }
  }, [user]);

  const handleCopyId = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.userId);
      addToast('User ID copied!', 'success');
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  if (!user || !activeServer) {
    return (
      <div className='h-full flex flex-col'>
        <PageHeader title='Share ID' />
        <div className='flex-1 flex items-center justify-center'>
          <p className='text-sm' style={{ color: 'var(--color-text-muted)' }}>No server selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full flex flex-col'>
      <PageHeader title='Share ID' />
      <div className='flex-1 flex flex-col items-center justify-center px-8 gap-6'>
        {/* QR Code */}
        <div
          className='rounded-2xl p-4'
          style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
        >
          {qrDataUrl ? (
            <img src={qrDataUrl} alt='User ID QR Code' className='w-48 h-48' />
          ) : (
            <div className='w-48 h-48 flex items-center justify-center'>
              <div
                className='w-8 h-8 rounded-full animate-spin border-2 border-t-transparent'
                style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
              />
            </div>
          )}
        </div>

        {/* User ID */}
        <div className='w-full max-w-xs'>
          <p className='text-xs font-medium mb-1.5 text-center' style={{ color: 'var(--color-text-muted)' }}>
            Your User ID
          </p>
          <div
            onClick={handleCopyId}
            className='w-full px-4 py-3 rounded-xl text-sm text-center cursor-pointer transition-colors duration-150 font-mono break-all'
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
          >
            {user.userId}
          </div>
          <p className='text-xs mt-2 text-center' style={{ color: 'var(--color-text-muted)' }}>
            Tap to copy • Share this with friends
          </p>
        </div>

        {/* Server info */}
        <p className='text-xs text-center' style={{ color: 'var(--color-text-secondary)' }}>
          Server: {activeServer.name}
        </p>
      </div>
    </div>
  );
}
