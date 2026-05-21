import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServerStore, useAuthStore, useContactsStore, useChatStore, useCallStore } from '../stores';
import { socketService } from '../services/socket';
import { deriveSharedSecret, encryptMessage, decryptMessage } from '../services/crypto';
import { PageHeader } from '../components/PageHeader';
import { CallButton } from '../components/CallButton';
import { ToastContainer } from '../components/Toast';
import { maskUserId } from '../types';
import type { Message } from '../types';

export function ChatPage() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const [sharedSecret, setSharedSecret] = useState<string | null>(null);
  const [decryptedMessages, setDecryptedMessages] = useState<Array<Message & { decryptedText?: string }>>([]);

  const activeServerId = useServerStore((s) => s.activeServerId);
  const getUser = useAuthStore((s) => s.getUser);
  const getContact = useContactsStore((s) => activeServerId ? s.getContact(activeServerId, contactId || '') : undefined);
  const getMessages = useChatStore((s) => s.getMessages);
  const markAsRead = useChatStore((s) => s.markAsRead);
  const addMessage = useChatStore((s) => s.addMessage);
  const presenceMap = useContactsStore((s) => s.presenceMap);

  const user = activeServerId ? getUser(activeServerId) : undefined;
  const contact = getContact;
  const messages = activeServerId && contactId ? getMessages(activeServerId, contactId) : [];

  // Derive shared secret
  useEffect(() => {
    if (contact && user) {
      try {
        const secret = deriveSharedSecret(contact.publicKey, user.privateKey);
        setSharedSecret(secret);
      } catch {
        console.error('Failed to derive shared secret');
      }
    }
  }, [contact?.publicKey]);

  // Mark messages as read when entering chat
  useEffect(() => {
    if (activeServerId && contactId) {
      markAsRead(activeServerId, contactId);
      socketService.sendMessageRead(contactId);
    }
  }, [activeServerId, contactId]);

  // Decrypt messages when they change
  useEffect(() => {
    if (!sharedSecret) return;
    const decrypted = messages.map((msg) => {
      try {
        const text = decryptMessage(msg.ciphertext, msg.nonce, sharedSecret);
        return { ...msg, decryptedText: text };
      } catch {
        return { ...msg, decryptedText: '[Decryption failed]' };
      }
    });
    setDecryptedMessages(decrypted);
  }, [messages, sharedSecret]);

  // Listen for incoming messages
  useEffect(() => {
    if (!activeServerId || !contactId) return;

    const cleanup = socketService.onMessage((msg) => {
      if (msg.from === contactId) {
        const message: Message = {
          id: crypto.randomUUID(),
          from: msg.from,
          ciphertext: msg.ciphertext,
          nonce: msg.nonce,
          timestamp: msg.timestamp,
          read: true,
        };
        addMessage(activeServerId, contactId, message);
      }
    });

    socketService.onMessageSent((data) => {
      // message sent confirmation - could update status
    });

    return cleanup;
  }, [activeServerId, contactId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [decryptedMessages]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !sharedSecret || !activeServerId || !contactId) return;

    const payload = encryptMessage(inputText.trim(), sharedSecret);
    const message: Message = {
      id: crypto.randomUUID(),
      from: user?.userId || '',
      ciphertext: payload.ciphertext,
      nonce: payload.nonce,
      timestamp: Date.now(),
      read: true,
    };

    addMessage(activeServerId, contactId, message);
    socketService.sendMessage(contactId, payload);
    setInputText('');
  }, [inputText, sharedSecret, activeServerId, contactId, user]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCall = () => {
    if (!contactId) return;
    useCallStore.getState().startOutgoingCall(contactId, contact?.nickname);
    navigate('/call');
  };

  const displayName = contact?.nickname || (contactId ? maskUserId(contactId) : '');
  const online = contactId ? presenceMap[contactId] || false : false;

  return (
    <div className='h-full flex flex-col'>
      <ToastContainer />

      {/* Header */}
      <PageHeader
        title={displayName}
        rightAction={
          <div className='flex items-center gap-1'>
            <div className='flex items-center gap-1.5 mr-2'>
              <div
                className='w-2 h-2 rounded-full'
                style={{ backgroundColor: online ? 'var(--color-online)' : 'var(--color-text-muted)' }}
              />
              <span className='text-xs' style={{ color: 'var(--color-text-muted)' }}>
                {online ? 'Online' : 'Offline'}
              </span>
            </div>
            <CallButton onClick={handleCall} disabled={!online} />
          </div>
        }
      />

      {/* Messages */}
      <div className='flex-1 overflow-y-auto px-4 py-2'>
        {decryptedMessages.length === 0 ? (
          <div className='flex items-center justify-center h-full'>
            <p className='text-sm' style={{ color: 'var(--color-text-muted)' }}>
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          <div className='flex flex-col gap-2 py-2'>
            {decryptedMessages.map((msg) => {
              const isMine = msg.from === user?.userId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className='max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed'
                    style={{
                      backgroundColor: isMine ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: isMine ? 'var(--color-bg)' : 'var(--color-text)',
                      borderTopLeftRadius: isMine ? '16px' : '4px',
                      borderTopRightRadius: isMine ? '4px' : '16px',
                    }}
                  >
                    <div className='whitespace-pre-wrap break-words'>
                      {msg.decryptedText || '<encrypted>'}
                    </div>
                    <div
                      className={`text-[10px] mt-1 ${isMine ? 'text-right' : 'text-left'}`}
                      style={{ opacity: 0.6 }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className='flex items-end gap-2 px-4 py-3 flex-shrink-0'
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <div className='flex-1 relative'>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Message...'
            rows={1}
            className='w-full px-4 py-3 rounded-xl text-sm resize-none transition-colors duration-150'
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              maxHeight: '120px',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
            onInput={(e) => {
              const target = e.currentTarget;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || !sharedSecret}
          className='p-3 rounded-xl transition-colors duration-150 flex-shrink-0 disabled:opacity-50'
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
