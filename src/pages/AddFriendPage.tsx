import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../services/socket';
import { PageHeader } from '../components/PageHeader';
import { useNotificationStore } from '../stores';

export function AddFriendPage() {
  const navigate = useNavigate();
  const addToast = useNotificationStore((s) => s.addToast);
  const [userId, setUserId] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendRequest = async () => {
    if (!userId.trim()) return;
    setSending(true);
    try {
      socketService.sendFriendRequest(userId.trim());
      addToast('Friend request sent!', 'success');
      navigate('/home');
    } catch {
      addToast('Failed to send friend request', 'error');
    } finally {
      setSending(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUserId(text);
    } catch {
      addToast('Cannot access clipboard', 'error');
    }
  };

  return (
    <div className='h-full flex flex-col'>
      <PageHeader title='Add Friend' />
      <div className='flex-1 px-4 pt-6 overflow-y-auto'>
        <div className='flex flex-col gap-4'>
          <div>
            <label className='text-xs font-medium mb-1.5 block' style={{ color: 'var(--color-text-muted)' }}>
              User ID
            </label>
            <div className='flex gap-2'>
              <input
                type='text'
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder='Paste user ID here'
                className='flex-1 px-4 py-3 rounded-xl text-sm transition-colors duration-150'
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
              />
              <button
                onClick={handlePaste}
                className='px-3 py-3 rounded-xl transition-colors duration-150'
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                title='Paste'
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="8" y="2" width="12" height="18" rx="2"/>
                  <path d="M16 2h2a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2h2"/>
                  <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>
                </svg>
              </button>
            </div>
          </div>

          <button
            onClick={handleSendRequest}
            disabled={sending || !userId.trim()}
            className='w-full px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 disabled:opacity-50'
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
          >
            {sending ? 'Sending...' : 'Send Friend Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
