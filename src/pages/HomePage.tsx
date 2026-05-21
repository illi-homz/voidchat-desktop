import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServerStore, useAuthStore, useContactsStore, useChatStore, useNotificationStore } from '../stores';
import { socketService } from '../services/socket';
import { ContactItem } from '../components/ContactItem';
import { EmptyState } from '../components/EmptyState';
import { ToastContainer } from '../components/Toast';
import { ConfirmAlert } from '../components/ConfirmAlert';
import { maskUserId } from '../types';

export function HomePage() {
  const navigate = useNavigate();
  const activeServer = useServerStore((s) => s.getActiveServer());
  const servers = useServerStore((s) => s.servers);
  const setActiveServer = useServerStore((s) => s.setActiveServer);
  const activeServerId = useServerStore((s) => s.activeServerId);
  const getUser = useAuthStore((s) => s.getUser);
  const contacts = useContactsStore((s) => activeServerId ? s.getContacts(activeServerId) : []);
  const addContact = useContactsStore((s) => s.addContact);
  const removeContact = useContactsStore((s) => s.removeContact);
  const updateContactPublicKey = useContactsStore((s) => s.updateContactPublicKey);
  const updatePresence = useContactsStore((s) => s.updatePresence);
  const presenceMap = useContactsStore((s) => s.presenceMap);
  const addMessage = useChatStore((s) => s.addMessage);
  const incrementUnread = useChatStore((s) => s.incrementUnread);
  const getUnreadCount = useChatStore((s) => s.getUnreadCount);
  const getAllUnreadForServer = useChatStore((s) => s.getAllUnreadForServer);
  const addToast = useNotificationStore((s) => s.addToast);
  const showIncomingCall = useNotificationStore((s) => s.showIncomingCall);

  const [connected, setConnected] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [friendRequest, setFriendRequest] = useState<{ fromUserId: string; fromPublicKey: string | null } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const user = activeServerId ? getUser(activeServerId) : undefined;

  // Connect to server
  useEffect(() => {
    if (!activeServer || !user) return;

    socketService.connect(activeServer.url, user.userId, user.publicKey)
      .then(() => {
        setConnected(true);
        // Check presence for all contacts
        const contactIds = contacts.map(c => c.userId);
        if (contactIds.length > 0) {
          socketService.checkPresence(contactIds);
        }
      })
      .catch((err) => {
        addToast(`Connection failed: ${err.message}`, 'error');
      });

    return () => {
      socketService.disconnect();
    };
  }, [activeServer?.id]);

  // Socket event listeners
  useEffect(() => {
    if (!connected) return;

    const cleanupMessage = socketService.onMessage((msg) => {
      if (!activeServerId) return;
      // Decrypt will happen in ChatPage, just store encrypted
      const message: import('../types').Message = {
        id: crypto.randomUUID(),
        from: msg.from,
        ciphertext: msg.ciphertext,
        nonce: msg.nonce,
        timestamp: msg.timestamp,
        read: false,
      };
      addMessage(activeServerId, msg.from, message);
      const contact = contacts.find(c => c.userId === msg.from);
      if (contact) {
        incrementUnread(activeServerId, msg.from);
        addToast(`New message from ${contact.nickname || maskUserId(msg.from)}`, 'info');
      }
    });

    const cleanupCallIncoming = socketService.onCallIncoming((data) => {
      const contact = contacts.find(c => c.userId === data.fromUserId);
      const name = contact?.nickname || maskUserId(data.fromUserId);
      showIncomingCall(data.fromUserId, data.callId, data.sdp, name);
    });

    socketService.onFriendRequest((data) => {
      setFriendRequest(data);
    });

    socketService.onFriendAccepted((data) => {
      if (activeServerId && data.fromPublicKey) {
        addContact(activeServerId, {
          userId: data.fromUserId,
          publicKey: data.fromPublicKey,
          createdAt: Date.now(),
        });
        addToast(`Friend request accepted!`, 'success');
      }
    });

    socketService.onFriendConfirmed((data) => {
      if (activeServerId && data.targetPublicKey) {
        addContact(activeServerId, {
          userId: data.targetUserId,
          publicKey: data.targetPublicKey,
          createdAt: Date.now(),
        });
        addToast('Friend added!', 'success');
      }
    });

    socketService.onFriendDeclined((fromUserId) => {
      addToast('Friend request declined', 'info');
    });

    socketService.onPresence((data) => {
      updatePresence(data.userId, data.online);
    });

    socketService.onKicked((data) => {
      addToast(data.message, 'error');
      setConnected(false);
      navigate('/');
    });

    return () => {
      cleanupMessage();
      cleanupCallIncoming();
      socketService.offFriendRequest();
      socketService.offFriendAccepted();
      socketService.offFriendDeclined();
      socketService.offFriendRequestSent();
      socketService.offFriendConfirmed();
      socketService.offPresence();
      socketService.offKicked();
    };
  }, [connected, activeServerId, contacts]);

  const handleAcceptFriend = () => {
    if (!friendRequest) return;
    socketService.acceptFriend(friendRequest.fromUserId);
    setFriendRequest(null);
  };

  const handleDeclineFriend = () => {
    if (!friendRequest) return;
    socketService.declineFriend(friendRequest.fromUserId);
    setFriendRequest(null);
  };

  const handleDeleteContact = (userId: string) => {
    if (!activeServerId) return;
    removeContact(activeServerId, userId);
    setShowDeleteConfirm(null);
  };

  const unreadAll = activeServerId ? getAllUnreadForServer(activeServerId) : {};

  return (
    <div className='h-full flex flex-col'>
      <ToastContainer />

      {/* Header */}
      <div
        className='flex items-center justify-between px-4 py-3 flex-shrink-0'
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold'
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}>
            V
          </div>
          <div>
            <div
              className='text-sm font-semibold cursor-pointer flex items-center gap-1'
              onClick={() => setShowServerMenu(!showServerMenu)}
            >
              {activeServer?.name || 'Select Server'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-text-muted)' }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
            <div className='flex items-center gap-1.5'>
              <div
                className='w-1.5 h-1.5 rounded-full'
                style={{ backgroundColor: connected ? 'var(--color-online)' : 'var(--color-error)' }}
              />
              <span className='text-xs' style={{ color: 'var(--color-text-muted)' }}>
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-1'>
          <button
            onClick={() => navigate('/add-friend')}
            className='p-2 rounded-lg transition-colors duration-150'
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title='Add Friend'
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <path d="M20 8v6M23 11h-6"/>
            </svg>
          </button>
          <button
            onClick={() => navigate('/share-id')}
            className='p-2 rounded-lg transition-colors duration-150'
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title='Share ID'
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Server dropdown menu */}
      {showServerMenu && (
        <div
          className='absolute top-14 left-4 right-4 z-30 rounded-xl shadow-xl overflow-hidden'
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {servers.map((server) => (
            <div
              key={server.id}
              onClick={() => {
                setActiveServer(server.id);
                setShowServerMenu(false);
              }}
              className='px-4 py-3 cursor-pointer transition-colors duration-150 text-sm'
              style={{
                backgroundColor: server.id === activeServerId ? 'var(--color-surface-hover)' : 'transparent',
                borderBottom: '1px solid var(--color-border-light)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = server.id === activeServerId ? 'var(--color-surface-hover)' : 'transparent'}
            >
              <div className='font-medium'>{server.name}</div>
              <div className='text-xs' style={{ color: 'var(--color-text-muted)' }}>{server.url}</div>
            </div>
          ))}
          <div
            onClick={() => { navigate('/add-server'); setShowServerMenu(false); }}
            className='px-4 py-3 cursor-pointer transition-colors duration-150 text-sm flex items-center gap-2'
            style={{ color: 'var(--color-primary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Server
          </div>
        </div>
      )}

      {/* Incoming friend request modal */}
      {friendRequest && (
        <div
          className='absolute inset-0 z-20 flex items-center justify-center'
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <div
            className='rounded-xl p-6 mx-4 w-full max-w-sm animate-fade-in'
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <h3 className='text-lg font-semibold mb-2'>Friend Request</h3>
            <p className='text-sm mb-6' style={{ color: 'var(--color-text-muted)' }}>
              {maskUserId(friendRequest.fromUserId)} wants to add you as a contact
            </p>
            <div className='flex gap-3'>
              <button
                onClick={handleDeclineFriend}
                className='flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors'
                style={{ backgroundColor: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Decline
              </button>
              <button
                onClick={handleAcceptFriend}
                className='flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors'
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete contact confirmation */}
      <ConfirmAlert
        open={showDeleteConfirm !== null}
        title='Delete Contact'
        message='Are you sure you want to remove this contact? The conversation will be deleted.'
        confirmText='Delete'
        onConfirm={() => showDeleteConfirm && handleDeleteContact(showDeleteConfirm)}
        onCancel={() => setShowDeleteConfirm(null)}
        destructive
      />

      {/* Contact list */}
      <div className='flex-1 overflow-y-auto'>
        {contacts.length === 0 ? (
          <EmptyState
            title='No contacts yet'
            description='Add friends by sharing your ID or sending a friend request.'
            action={{ label: 'Add Friend', onClick: () => navigate('/add-friend') }}
          />
        ) : (
          contacts.map((contact) => (
            <ContactItem
              key={contact.userId}
              userId={contact.userId}
              publicKey={contact.publicKey}
              nickname={contact.nickname}
              online={presenceMap[contact.userId] || false}
              unread={activeServerId ? getUnreadCount(activeServerId, contact.userId) : 0}
              onClick={() => navigate(`/chat/${contact.userId}`)}
              onContextMenu={() => setShowDeleteConfirm(contact.userId)}
            />
          ))
        )}
      </div>
    </div>
  );
}
