import { STUN_SERVERS, CALL_DISCONNECTED_TIMEOUT } from '../constants';
import { socketService } from './socket';

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentCallId: string | null = null;
  private targetUserId: string | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onDisconnectedCallback: (() => void) | null = null;
  private iceCandidateBuffer: RTCIceCandidate[] = [];
  private negotiationInProgress = false;
  private disconnectedTimer: ReturnType<typeof setTimeout> | null = null;
  private remoteDescriptionSet = false;

  private peerConfig: RTCConfiguration = {
    iceServers: [...STUN_SERVERS],
    iceCandidatePoolSize: 10,
  };

  async requestAudioPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately — we just wanted permission
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Инициирует/принимает звонок.
   * @param callId — уникальный ID звонка
   * @param targetUserId — ID собеседника (нужен для renegotiation)
   * @param sdpOffer — если передан, это входящий звонок (устанавливаем remote description)
   * @returns SDP (offer для исходящего, answer для входящего) или null при ошибке
   */
  async startCall(
    callId: string,
    targetUserId: string,
    sdpOffer?: string,
  ): Promise<string | null> {
    await this.cleanup();

    this.currentCallId = callId;
    this.targetUserId = targetUserId;

    // Добавляем TURN если доступен
    const turnConfig = socketService.getTurnConfig();
    if (turnConfig) {
      this.peerConfig.iceServers = [...STUN_SERVERS, turnConfig];
    }

    this.peerConnection = new RTCPeerConnection(this.peerConfig);
    this.setupPeerConnection();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.localStream = stream;
      stream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, stream);
      });
    } catch {
      // Нет разрешения на микрофон — продолжаем без локального потока
    }

    if (sdpOffer) {
      // Входящий звонок — устанавливаем remote description из offer
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: 'offer', sdp: sdpOffer }),
      );
      this.remoteDescriptionSet = true;

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Отправляем буферизированные ICE candidates
      this.flushIceCandidateBuffer();

      return answer.sdp ?? null;
    } else {
      // Исходящий звонок — создаём offer
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
      });
      await this.peerConnection.setLocalDescription(offer);
      return offer.sdp ?? null;
    }
  }

  /**
   * Устанавливает remote description из answer SDP (для исходящего звонка
   * после получения call_accepted от собеседника).
   */
  async setRemoteAnswer(sdp: string): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: 'answer', sdp }),
      );
      this.remoteDescriptionSet = true;

      // Отправляем буферизированные ICE candidates
      this.flushIceCandidateBuffer();
    } catch (err) {
      console.warn('[webrtc] Failed to set remote answer:', err);
    }
  }

  /**
   * Обрабатывает renegotiation offer (ICE restart).
   */
  async handleRenegotiationOffer(sdpOffer: string): Promise<string | null> {
    if (!this.peerConnection) return null;

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription({ type: 'offer', sdp: sdpOffer }),
    );
    this.remoteDescriptionSet = true;

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    this.flushIceCandidateBuffer();
    return answer.sdp ?? null;
  }

  /**
   * Устанавливает targetUserId для renegotiation.
   * Вызывается при получении входящего звонка перед startCall.
   */
  setTargetUserId(userId: string): void {
    this.targetUserId = userId;
  }

  async addIceCandidate(candidate: string): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const iceCandidate = new RTCIceCandidate(JSON.parse(candidate));

      if (!this.remoteDescriptionSet) {
        // Буферизируем кандидатов, если remote description ещё не установлен
        this.iceCandidateBuffer.push(iceCandidate);
        return;
      }

      await this.peerConnection.addIceCandidate(iceCandidate);
    } catch (err) {
      console.warn('[webrtc] Failed to add ICE candidate:', err);
    }
  }

  private flushIceCandidateBuffer(): void {
    for (const candidate of this.iceCandidateBuffer) {
      this.peerConnection?.addIceCandidate(candidate).catch(() => {});
    }
    this.iceCandidateBuffer = [];
  }

  iceRestart(): void {
    if (!this.peerConnection) return;
    this.peerConnection.restartIce();
  }

  toggleMute(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  stopCall(): void {
    this.cleanup();
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback;
  }

  onDisconnected(callback: () => void): void {
    this.onDisconnectedCallback = callback;
  }

  private setupPeerConnection(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = event => {
      if (event.candidate && this.currentCallId) {
        socketService.sendIceCandidate(
          this.currentCallId,
          JSON.stringify(event.candidate.toJSON()),
        );
      }
    };

    this.peerConnection.ontrack = event => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.onRemoteStreamCallback?.(event.streams[0]);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      if (state === 'disconnected' || state === 'failed') {
        // Таймер перед объявлением разрыва (даём шанс на восстановление)
        if (!this.disconnectedTimer) {
          this.disconnectedTimer = setTimeout(() => {
            this.onDisconnectedCallback?.();
          }, CALL_DISCONNECTED_TIMEOUT);
        }
      } else if (state === 'connected') {
        // Соединение восстановлено — отменяем таймер
        if (this.disconnectedTimer) {
          clearTimeout(this.disconnectedTimer);
          this.disconnectedTimer = null;
        }
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      if (state === 'failed') {
        // Пробуем ICE restart при фатальной ошибке ICE
        this.iceRestart();
      }
    };

    this.peerConnection.onnegotiationneeded = async () => {
      if (this.negotiationInProgress || !this.currentCallId || !this.targetUserId) return;
      this.negotiationInProgress = true;

      try {
        const offer = await this.peerConnection?.createOffer({
          offerToReceiveAudio: true,
        });
        if (offer) {
          await this.peerConnection?.setLocalDescription(offer);
          socketService.sendCallOffer(
            this.targetUserId,
            offer.sdp,
            this.currentCallId,
          );
        }
      } catch (err) {
        console.warn('[webrtc] Negotiation failed:', err);
      } finally {
        this.negotiationInProgress = false;
      }
    };

    this.peerConnection.onicecandidateerror = event => {
      console.warn(
        '[webrtc] ICE candidate error:',
        (event as RTCPeerConnectionIceErrorEvent).errorText || event,
      );
    };
  }

  private async cleanup(): Promise<void> {
    this.iceCandidateBuffer = [];
    this.remoteDescriptionSet = false;
    this.negotiationInProgress = false;

    if (this.disconnectedTimer) {
      clearTimeout(this.disconnectedTimer);
      this.disconnectedTimer = null;
    }

    if (this.peerConnection) {
      this.peerConnection.onicecandidate = null;
      this.peerConnection.ontrack = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.oniceconnectionstatechange = null;
      this.peerConnection.onnegotiationneeded = null;
      this.peerConnection.onicecandidateerror = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }

    this.remoteStream = null;
    this.currentCallId = null;
    this.targetUserId = null;
    this.onRemoteStreamCallback = null;
    this.onDisconnectedCallback = null;
  }
}

export const webrtcService = new WebRTCService();
