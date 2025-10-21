/**
 * WebRTC Service for Video/Audio Calls
 * Handles peer connections, media streams, and signaling
 */

import { socketService } from '../websocket/socket';

export interface MediaStreamConfig {
  video: boolean;
  audio: boolean;
}

export interface PeerConnectionConfig {
  callId: string;
  userId: string;
  isInitiator: boolean;
}

class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();

  // ICE servers configuration
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  /**
   * Initialize local media stream (camera and microphone)
   */
  async initializeLocalStream(config: MediaStreamConfig = { video: true, audio: true }): Promise<MediaStream> {
    try {
      console.log('[WebRTC] Initializing local stream with config:', config);

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: config.video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
        audio: config.audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } : false,
      });

      console.log('[WebRTC] Local stream initialized:', this.localStream.id);
      return this.localStream;
    } catch (error) {
      console.error('[WebRTC] Failed to initialize local stream:', error);
      throw new Error('Failed to access camera/microphone. Please check permissions.');
    }
  }

  /**
   * Create peer connection for a specific user
   */
  async createPeerConnection(
    config: PeerConnectionConfig,
    onRemoteStream: (stream: MediaStream) => void,
  ): Promise<RTCPeerConnection> {
    const { callId, userId, isInitiator } = config;

    console.log(`[WebRTC] Creating peer connection for user ${userId} in call ${callId}`);

    const peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
    });

    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`[WebRTC] Sending ICE candidate to user ${userId}`);
        socketService.emit('call:ice-candidate', {
          callId,
          targetUserId: userId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track from user ${userId}:`, event.streams[0].id);
      const remoteStream = event.streams[0];
      this.remoteStreams.set(userId, remoteStream);
      onRemoteStream(remoteStream);
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${userId}:`, peerConnection.connectionState);

      if (peerConnection.connectionState === 'disconnected' ||
          peerConnection.connectionState === 'failed') {
        console.log(`[WebRTC] Peer connection with ${userId} ${peerConnection.connectionState}`);
        this.closePeerConnection(userId);
      }
    };

    // Store peer connection
    this.peerConnections.set(userId, peerConnection);

    // If initiator, create and send offer
    if (isInitiator) {
      await this.createOffer(callId, userId, peerConnection);
    }

    return peerConnection;
  }

  /**
   * Create and send offer
   */
  private async createOffer(
    callId: string,
    userId: string,
    peerConnection: RTCPeerConnection,
  ): Promise<void> {
    try {
      console.log(`[WebRTC] Creating offer for user ${userId}`);

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socketService.emit('call:offer', {
        callId,
        targetUserId: userId,
        offer: offer.toJSON(),
      });

      console.log(`[WebRTC] Offer sent to user ${userId}`);
    } catch (error) {
      console.error(`[WebRTC] Failed to create offer for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming offer
   */
  async handleOffer(
    callId: string,
    fromUserId: string,
    offer: RTCSessionDescriptionInit,
    onRemoteStream: (stream: MediaStream) => void,
  ): Promise<void> {
    try {
      console.log(`[WebRTC] Handling offer from user ${fromUserId}`);

      let peerConnection = this.peerConnections.get(fromUserId);

      if (!peerConnection) {
        peerConnection = await this.createPeerConnection(
          { callId, userId: fromUserId, isInitiator: false },
          onRemoteStream,
        );
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socketService.emit('call:answer', {
        callId,
        targetUserId: fromUserId,
        answer: answer.toJSON(),
      });

      console.log(`[WebRTC] Answer sent to user ${fromUserId}`);
    } catch (error) {
      console.error(`[WebRTC] Failed to handle offer from user ${fromUserId}:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(
    fromUserId: string,
    answer: RTCSessionDescriptionInit,
  ): Promise<void> {
    try {
      console.log(`[WebRTC] Handling answer from user ${fromUserId}`);

      const peerConnection = this.peerConnections.get(fromUserId);
      if (!peerConnection) {
        console.error(`[WebRTC] No peer connection found for user ${fromUserId}`);
        return;
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log(`[WebRTC] Answer processed from user ${fromUserId}`);
    } catch (error) {
      console.error(`[WebRTC] Failed to handle answer from user ${fromUserId}:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(
    fromUserId: string,
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    try {
      const peerConnection = this.peerConnections.get(fromUserId);
      if (!peerConnection) {
        console.warn(`[WebRTC] No peer connection found for ICE candidate from user ${fromUserId}`);
        return;
      }

      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log(`[WebRTC] ICE candidate added from user ${fromUserId}`);
    } catch (error) {
      console.error(`[WebRTC] Failed to add ICE candidate from user ${fromUserId}:`, error);
    }
  }

  /**
   * Toggle local audio (mute/unmute)
   */
  toggleAudio(enabled: boolean): void {
    if (!this.localStream) return;

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });

    console.log(`[WebRTC] Audio ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Toggle local video (on/off)
   */
  toggleVideo(enabled: boolean): void {
    if (!this.localStream) return;

    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });

    console.log(`[WebRTC] Video ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(): Promise<MediaStream> {
    try {
      console.log('[WebRTC] Starting screen share');

      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
        },
        audio: false,
      });

      // Replace video track in all peer connections
      const videoTrack = this.screenStream.getVideoTracks()[0];

      this.peerConnections.forEach((peerConnection) => {
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Handle screen share stop
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      console.log('[WebRTC] Screen share started');
      return this.screenStream;
    } catch (error) {
      console.error('[WebRTC] Failed to start screen share:', error);
      throw new Error('Failed to start screen sharing');
    }
  }

  /**
   * Stop screen sharing
   */
  stopScreenShare(): void {
    if (!this.screenStream) return;

    console.log('[WebRTC] Stopping screen share');

    // Stop all screen share tracks
    this.screenStream.getTracks().forEach((track) => track.stop());

    // Restore camera video track in all peer connections
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];

      this.peerConnections.forEach((peerConnection) => {
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });
    }

    this.screenStream = null;
    console.log('[WebRTC] Screen share stopped');
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream for a specific user
   */
  getRemoteStream(userId: string): MediaStream | null {
    return this.remoteStreams.get(userId) || null;
  }

  /**
   * Close peer connection for a specific user
   */
  closePeerConnection(userId: string): void {
    const peerConnection = this.peerConnections.get(userId);

    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);
      this.remoteStreams.delete(userId);
      console.log(`[WebRTC] Closed peer connection with user ${userId}`);
    }
  }

  /**
   * Cleanup all connections and streams
   */
  cleanup(): void {
    console.log('[WebRTC] Cleaning up all connections and streams');

    // Close all peer connections
    this.peerConnections.forEach((_, userId) => {
      this.closePeerConnection(userId);
    });

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Stop screen stream
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    // Clear maps
    this.peerConnections.clear();
    this.remoteStreams.clear();

    console.log('[WebRTC] Cleanup complete');
  }
}

// Export singleton instance
export const webrtcService = new WebRTCService();
