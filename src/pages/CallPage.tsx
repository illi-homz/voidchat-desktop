import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCallStore, useNotificationStore } from '../stores';
import { socketService } from '../services/socket';
import { webrtcService } from '../services/WebRTCService';
import { maskUserId } from '../types';

export function CallPage() {
  const navigate = useNavigate();
  const callStore = useCallStore();
  const notificationStore = useNotificationStore();
  const [showEnded, setShowEnded] = useState(false);

  const callIdRef = useRef<string | null>(null);
  const cleanupRef = useRef<Array<() => void>>([]);
  const isMountedRef = useRef(true);

  const contactId = callStore.contactId;
  const contactName =
    callStore.contactName || (contactId ? maskUserId(contactId) : 'Unknown');

  // Собираем cleanup при размонтировании
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      for (const cleanup of cleanupRef.current) cleanup();
      cleanupRef.current = [];
    };
  }, []);

  // Генерируем callId для исходящего звонка, используем существующий для входящего
  useEffect(() => {
    if (callStore.status === 'calling') {
      callIdRef.current = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    } else if (callStore.status === 'ringing' && callStore.callId) {
      callIdRef.current = callStore.callId;
    }
  }, [callStore.status, callStore.callId]);

  // Инициализация WebRTC (исходящий или входящий звонок)
  useEffect(() => {
    const status = callStore.status;
    const cId = callIdRef.current;
    const contact = contactId;

    if (!cId || !contact) return;

    if (status === 'calling') {
      // Исходящий звонок
      webrtcService.setTargetUserId(contact);
      webrtcService.startCall(cId, contact).then(sdp => {
        if (sdp && cId && isMountedRef.current) {
          socketService.sendCallOffer(contact, sdp, cId);
          callStore.setCallId(cId);
        }
      });
    } else if (status === 'ringing') {
      // Входящий звонок
      const incomingCall = notificationStore.incomingCall;
      if (incomingCall) {
        webrtcService.setTargetUserId(contact);
        webrtcService.startCall(cId, contact, incomingCall.sdp).then(sdp => {
          if (sdp && isMountedRef.current) {
            socketService.sendCallAccept(cId, sdp);
            callStore.setCallId(cId);
          }
        });
      } else {
        // Нет данных о входящем звонке — показываем ошибку
        callStore.setFailed('No incoming call data');
        setShowEnded(true);
        setTimeout(() => {
          if (isMountedRef.current) {
            callStore.reset();
            navigate('/home');
          }
        }, 2000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Socket event handlers
  useEffect(() => {
    const cleanupAccepted = socketService.onCallAccepted(data => {
      if (data.callId === callIdRef.current) {
        webrtcService.setRemoteAnswer(data.sdp).then(() => {
          if (isMountedRef.current) {
            callStore.setConnected();
          }
        });
      }
    });
    cleanupRef.current.push(cleanupAccepted);

    const cleanupIce = socketService.onIceCandidate(data => {
      if (data.callId === callIdRef.current) {
        webrtcService.addIceCandidate(data.candidate);
      }
    });
    cleanupRef.current.push(cleanupIce);

    const cleanupEnded = socketService.onCallEnded(data => {
      if (data.callId === callIdRef.current && isMountedRef.current) {
        webrtcService.stopCall();
        callStore.endCall();
        setShowEnded(true);
        setTimeout(() => {
          if (isMountedRef.current) {
            callStore.reset();
            navigate('/home');
          }
        }, 2000);
      }
    });
    cleanupRef.current.push(cleanupEnded);

    const cleanupDeclined = socketService.onCallDeclined(data => {
      if (data.callId === callIdRef.current && isMountedRef.current) {
        webrtcService.stopCall();
        callStore.setFailed('Call declined');
        setShowEnded(true);
        setTimeout(() => {
          if (isMountedRef.current) {
            callStore.reset();
            navigate('/home');
          }
        }, 2000);
      }
    });
    cleanupRef.current.push(cleanupDeclined);

    const cleanupTimedOut = socketService.onCallTimedOut(data => {
      if (data.callId === callIdRef.current && isMountedRef.current) {
        webrtcService.stopCall();
        callStore.setFailed('No answer');
        setShowEnded(true);
        setTimeout(() => {
          if (isMountedRef.current) {
            callStore.reset();
            navigate('/home');
          }
        }, 2000);
      }
    });
    cleanupRef.current.push(cleanupTimedOut);

    const cleanupOfferSent = socketService.onCallOfferSent(data => {
      if (data.callId === callIdRef.current && isMountedRef.current) {
        callStore.setCallId(data.callId);
      }
    });
    cleanupRef.current.push(cleanupOfferSent);

    webrtcService.onDisconnected(() => {
      if (isMountedRef.current) {
        webrtcService.stopCall();
        callStore.setFailed('Connection lost');
        setShowEnded(true);
        setTimeout(() => {
          if (isMountedRef.current) {
            callStore.reset();
            navigate('/home');
          }
        }, 2000);
      }
    });

    return () => {
      for (const cleanup of cleanupRef.current) cleanup();
      cleanupRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEndCall = () => {
    if (callIdRef.current) {
      socketService.sendCallHangup(callIdRef.current);
    }
    webrtcService.stopCall();
    callStore.endCall();
    setShowEnded(true);
    setTimeout(() => {
      if (isMountedRef.current) {
        callStore.reset();
        navigate('/home');
      }
    }, 1500);
  };

  const handleToggleMute = () => {
    webrtcService.toggleMute();
    callStore.toggleMute();
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const statusText = showEnded
    ? 'Call ended'
    : callStore.status === 'calling'
      ? 'Calling...'
      : callStore.status === 'ringing'
        ? 'Incoming call...'
        : callStore.status === 'connected'
          ? formatDuration(callStore.duration)
          : callStore.status === 'failed'
            ? callStore.error || 'Call failed'
            : '';

  return (
    <div
      className='h-full w-full flex flex-col'
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Remote video placeholder (audio only — show avatar) */}
      <div className='flex-1 flex flex-col items-center justify-center gap-4'>
        <div
          className='w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold'
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
        >
          {contactName.charAt(0).toUpperCase()}
        </div>
        <h2 className='text-xl font-semibold'>{contactName}</h2>
        <p className='text-sm' style={{ color: 'var(--color-text-muted)' }}>
          {statusText}
        </p>
      </div>

      {/* Controls */}
      <div className='flex items-center justify-center gap-8 py-12'>
        {/* Mute button */}
        <button
          onClick={handleToggleMute}
          className='w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-150'
          style={{
            backgroundColor: callStore.isMuted
              ? 'var(--color-error)'
              : 'var(--color-surface)',
          }}
        >
          <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='white'
            strokeWidth='2'
          >
            {callStore.isMuted ? (
              <>
                <path d='M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' />
                <path d='M17 9v3a5 5 0 0 1-10 0V9' />
                <line x1='2' y1='2' x2='22' y2='22' />
              </>
            ) : (
              <>
                <path d='M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' />
                <path d='M17 9v3a5 5 0 0 1-10 0V9' />
                <path d='M19 10v1a7 7 0 0 1-14 0v-1' />
              </>
            )}
          </svg>
        </button>

        {/* End call button */}
        <button
          onClick={handleEndCall}
          className='w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-150'
          style={{ backgroundColor: 'var(--color-error)' }}
        >
          <svg
            width='28'
            height='28'
            viewBox='0 0 24 24'
            fill='none'
            stroke='white'
            strokeWidth='2'
          >
            <path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' />
          </svg>
        </button>

        {/* Speaker button */}
        <button
          onClick={callStore.toggleSpeaker}
          className='w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-150'
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='white'
            strokeWidth='2'
          >
            <polygon points='11 5 6 9 2 9 2 15 6 15 11 19 11 5' />
            <path d='M15.54 8.46a5 5 0 0 1 0 7.07' />
            <path d='M19.07 4.93a10 10 0 0 1 0 14.14' />
          </svg>
        </button>
      </div>
    </div>
  );
}
