import { useNotificationStore } from '../stores';

/**
 * Баннер входящего звонка.
 * Показывается поверх всех экранов при получении события `call_incoming`.
 *
 * TODO: Подключить к WebRTC/CallService:
 * 1. При нажатии «Ответить» — запустить принятие звонка и перейти на CallPage.
 * 2. При нажатии «Отклонить» — отправить `call_decline`.
 */
export function IncomingCallBanner() {
  const incomingCall = useNotificationStore((s) => s.incomingCall);
  const hideIncomingCall = useNotificationStore((s) => s.hideIncomingCall);

  if (!incomingCall) return null;

  // Плейсхолдер. Когда сервис звонков будет готов, заменить на:
  //
  // return (
  //   <div className='fixed top-0 left-0 right-0 z-50 animate-slide-down p-4'
  //        style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
  //     <div className='flex items-center gap-3'>
  //       <div className='flex-1'>
  //         <div className='text-sm font-medium'>Входящий звонок</div>
  //         <div className='text-xs' style={{ color: 'var(--color-text-muted)' }}>
  //           {maskUserId(incomingCall.fromUserId)}
  //         </div>
  //       </div>
  //       <button onClick={...answer} className='...'>Ответить</button>
  //       <button onClick={...decline} className='...'>Отклонить</button>
  //     </div>
  //   </div>
  // );

  return null;
}
