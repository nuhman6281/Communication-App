import { realtimeSocket } from '../websocket/realtime-socket';
import { useCallStore } from '../stores/call.store';
import { useAuthStore } from '../stores';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize?: number;
}

export interface MediaConstraints {
  audio: boolean | MediaTrackConstraints;
  video: boolean | MediaTrackConstraints;
}

export interface CallParticipant {
  userId: string;
  username: string;
  avatarUrl?: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  stream?: MediaStream;
  peerConnection?: RTCPeerConnection;
}

class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private config: WebRTCConfig;
  private pendingCandidates: Map<string, RTCIceCandidate[]> = new Map();
  private initialized: boolean = false;

  constructor() {

    // Default STUN/TURN configuration
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // TURN servers will be provided by the signaling server
      ],
      iceCandidatePoolSize: 10,
    };

    // Don't initialize handlers here - wait for socket connection
  }

  /**
   * Initialize WebRTC service socket handlers
   * Must be called after realtime socket is connected
   */
  public initialize() {
    if (this.initialized) {
      console.log('[WebRTC] Already initialized');
      return;
    }

    if (!realtimeSocket.isConnected()) {
      console.warn('[WebRTC] Realtime socket not connected yet, deferring initialization');
      return;
    }

    console.log('[WebRTC] Initializing service with socket handlers');
    this.initializeSocketHandlers();
    this.initialized = true;
  }

  private initializeSocketHandlers() {
    console.log('[WebRTC] 🎯 Registering socket event handlers...');

    // Call initiated - receive server-generated callId
    realtimeSocket.on('call:initiated', (data: any) => {
      console.log('[WebRTC] 📞 EVENT: call:initiated received');
      console.log('[WebRTC] Call initiated by server:', data);
      const { callId, iceServers } = data;

      console.log('[WebRTC] 🔄 Updating store with server callId:', callId);

      // Update the active call with server's callId
      useCallStore.getState().setCallId(callId);

      // Update ICE servers if provided
      if (iceServers && iceServers.length > 0) {
        console.log('[WebRTC] 🌐 Updating ICE servers, count:', iceServers.length);
        this.config.iceServers = iceServers;
      }

      console.log('[WebRTC] ✅ CallId set to:', callId);
    });

    // Incoming call
    realtimeSocket.on('call:incoming', (data: any) => {
      console.log('[WebRTC] 📞 EVENT: call:incoming received');
      console.log('[WebRTC] Incoming call data:', data);
      const { callId, from, conversationId, callType } = data;

      console.log('[WebRTC] 🔔 Incoming', callType, 'call from:', from.username, '(', from.userId, ')');
      console.log('[WebRTC] CallId:', callId, '| ConversationId:', conversationId);

      console.log('[WebRTC] 🔄 Storing incoming call in state...');
      useCallStore.getState().receiveIncomingCall({
        callId,
        conversationId,
        callType,
        from,
        receivedAt: new Date(),
      });

      console.log('[WebRTC] ✅ Incoming call modal should now appear');
    });

    // Call accepted by remote peer
    realtimeSocket.on('call:accepted', async (data: any) => {
      console.log('[WebRTC] 📞 EVENT: call:accepted received');
      console.log('[WebRTC] Call accepted data:', data);
      const { callId, userId, acceptedBy } = data;

      console.log('[WebRTC] ✅ User', userId, 'accepted the call');

      const activeCall = useCallStore.getState().activeCall;
      if (!activeCall) {
        console.error('[WebRTC] ❌ Call accepted but no active call exists in store');
        return;
      }

      console.log('[WebRTC] 🔍 Validating callId match...');
      console.log('[WebRTC]   Expected:', activeCall.callId);
      console.log('[WebRTC]   Received:', callId);

      if (activeCall.callId !== callId) {
        console.error('[WebRTC] ❌ CallId mismatch!');
        console.error('[WebRTC]   Expected:', activeCall.callId);
        console.error('[WebRTC]   Received:', callId);
        return;
      }

      console.log('[WebRTC] ✅ CallId match confirmed:', callId);

      // Add the accepting user as a participant
      console.log('[WebRTC] 👤 Adding participant:', userId);
      useCallStore.getState().addParticipant(userId, {
        userId,
        username: data.username || acceptedBy?.username || 'Unknown',
        avatarUrl: data.avatarUrl || acceptedBy?.avatarUrl,
        isAudioEnabled: true,
        isVideoEnabled: activeCall.callType === 'video',
        isScreenSharing: false,
      });

      // If we are the initiator, create and send offer to the accepting peer
      const { user } = useAuthStore.getState();
      console.log('[WebRTC] 🔍 Checking if we are the initiator...');
      console.log('[WebRTC]   Our userId:', user?.id);
      console.log('[WebRTC]   Initiator userId:', activeCall.initiatorId);

      if (user && activeCall.initiatorId === user.id) {
        console.log('[WebRTC] ✅ We are the initiator - creating offer for:', userId);
        await this.createOffer(userId);
      } else {
        console.log('[WebRTC] ℹ️ We are NOT the initiator - waiting for offer');
      }
    });

    // Call rejected
    realtimeSocket.on('call:rejected', (data: any) => {
      console.log('[WebRTC] 📞 ========================================');
      console.log('[WebRTC] ❌ EVENT: call:rejected received');
      console.log('[WebRTC] ========================================');
      console.log('[WebRTC] Call rejected data:', data);
      const { callId, rejectedBy, reason } = data;

      console.log('[WebRTC] CallId:', callId);
      console.log('[WebRTC] Rejected by:', rejectedBy);
      console.log('[WebRTC] Reason:', reason);

      // Clear incoming call if we're the receiver
      const incomingCall = useCallStore.getState().incomingCall;
      console.log('[WebRTC] Current incomingCall:', incomingCall?.callId);

      if (incomingCall && incomingCall.callId === callId) {
        console.log('[WebRTC] 🔔 Clearing incoming call');
        useCallStore.getState().rejectCall(callId);
      }

      // End active call if we're in one
      const activeCall = useCallStore.getState().activeCall;
      console.log('[WebRTC] Current activeCall:', activeCall?.callId);

      if (activeCall && activeCall.callId === callId) {
        console.log('[WebRTC] 📞 Ending active call');
        this.endCall();
      }

      console.log('[WebRTC] ✅ Call rejected handled');
    });

    // Call ended
    realtimeSocket.on('call:ended', (data: any) => {
      console.log('[WebRTC] 📞 ========================================');
      console.log('[WebRTC] 🔴 EVENT: call:ended received');
      console.log('[WebRTC] ========================================');
      console.log('[WebRTC] Call ended data:', data);
      const { callId, endedBy } = data;

      console.log('[WebRTC] Call ended by:', endedBy);
      console.log('[WebRTC] CallId:', callId);

      // Check if we ended the call ourselves
      const { user } = useAuthStore.getState();
      const weEndedIt = endedBy?.userId === user?.id;
      console.log('[WebRTC] Did we end this call?', weEndedIt);

      if (weEndedIt) {
        console.log('[WebRTC] ℹ️ We ended this call, ignoring our own call:ended event');
        return;
      }

      // Check if we already handled this call end (prevent duplicate handling)
      // Server emits to both user:id and call:id rooms, so we might receive it twice
      const incomingCall = useCallStore.getState().incomingCall;
      const activeCall = useCallStore.getState().activeCall;

      console.log('[WebRTC] Current incomingCall:', incomingCall?.callId);
      console.log('[WebRTC] Current activeCall:', activeCall?.callId);

      // Check if we have ANY call with this callId
      const hasCall = (incomingCall?.callId === callId) || (activeCall?.callId === callId);

      if (!hasCall) {
        console.log('[WebRTC] ℹ️ Call already ended or not found, ignoring duplicate event');
        return;
      }

      // Clear incoming call if we're the receiver
      if (incomingCall && incomingCall.callId === callId) {
        console.log('[WebRTC] 🔔 Clearing incoming call modal');
        useCallStore.getState().rejectCall(callId);
        console.log('[WebRTC] ✅ Incoming call cleared');
        return;
      }

      // End active call if we're in one
      if (activeCall && activeCall.callId === callId) {
        console.log('[WebRTC] 📞 Other user ended the call, ending our side');
        this.endCall();
        console.log('[WebRTC] ✅ Active call ended');
        return;
      }
    });

    // Call missed
    realtimeSocket.on('call:missed', (data: any) => {
      console.log('[WebRTC] 📞 ========================================');
      console.log('[WebRTC] ⏰ EVENT: call:missed received');
      console.log('[WebRTC] ========================================');
      console.log('[WebRTC] Call missed data:', data);
      const { callId } = data;

      console.log('[WebRTC] CallId:', callId);

      // Clear incoming call
      const incomingCall = useCallStore.getState().incomingCall;
      console.log('[WebRTC] Current incomingCall:', incomingCall?.callId);

      if (incomingCall && incomingCall.callId === callId) {
        console.log('[WebRTC] 🔔 Clearing missed incoming call');
        useCallStore.getState().rejectCall(callId);
        console.log('[WebRTC] ✅ Incoming call cleared');
      } else {
        console.warn('[WebRTC] ⚠️ No matching incoming call to clear');
      }
    });

    // WebRTC signaling
    realtimeSocket.on('webrtc:offer', async (data: any) => {
      console.log('[WebRTC] 🔄 EVENT: webrtc:offer received');
      console.log('[WebRTC] Offer from:', data.userId);
      console.log('[WebRTC] Offer SDP type:', data.offer?.type);
      console.log('[WebRTC] 📦 Processing offer...');
      await this.handleOffer(data.userId, data.offer);
      console.log('[WebRTC] ✅ Offer processed, answer should be sent');
    });

    realtimeSocket.on('webrtc:answer', async (data: any) => {
      console.log('[WebRTC] 🔄 EVENT: webrtc:answer received');
      console.log('[WebRTC] Answer from:', data.userId);
      console.log('[WebRTC] Answer SDP type:', data.answer?.type);
      console.log('[WebRTC] 📦 Processing answer...');
      await this.handleAnswer(data.userId, data.answer);
      console.log('[WebRTC] ✅ Answer processed, peer connection should establish');
    });

    realtimeSocket.on('webrtc:ice-candidate', async (data: any) => {
      console.log('[WebRTC] 🧊 EVENT: webrtc:ice-candidate received');
      console.log('[WebRTC] ICE candidate from:', data.userId);
      console.log('[WebRTC] Candidate type:', data.candidate?.candidate ? 'valid' : 'end-of-candidates');
      console.log('[WebRTC] 📦 Adding ICE candidate...');
      await this.handleIceCandidate(data.userId, data.candidate);
      console.log('[WebRTC] ✅ ICE candidate added');
    });

    // Participant events
    realtimeSocket.on('call:participant:joined', (data: any) => {
      console.log('[WebRTC] Participant joined:', data);
      const { userId, username, avatarUrl } = data;

      useCallStore.getState().addParticipant(userId, {
        userId,
        username,
        avatarUrl,
        isAudioEnabled: true,
        isVideoEnabled: true,
        isScreenSharing: false,
      });

      // Create peer connection for new participant
      this.createPeerConnection(userId);
    });

    realtimeSocket.on('call:participant:left', (data: any) => {
      console.log('[WebRTC] Participant left:', data);
      const { userId } = data;

      this.closePeerConnection(userId);
      useCallStore.getState().removeParticipant(userId);
    });

    realtimeSocket.on('call:participant:media-toggle', (data: any) => {
      console.log('[WebRTC] Participant media toggle:', data);
      const { userId, mediaType, enabled } = data;

      const updates: any = {};
      if (mediaType === 'audio') updates.isAudioEnabled = enabled;
      if (mediaType === 'video') updates.isVideoEnabled = enabled;
      if (mediaType === 'screen') updates.isScreenSharing = enabled;

      useCallStore.getState().updateParticipant(userId, updates);
    });

    // TURN server credentials
    realtimeSocket.on('turn:credentials', (data: any) => {
      console.log('[WebRTC] Received TURN credentials');
      if (data.iceServers) {
        this.config.iceServers = [...this.config.iceServers, ...data.iceServers];
      }
    });
  }

  async initiateCall(conversationId: string, callType: 'audio' | 'video', participants: string[]) {
    try {
      console.log('[WebRTC] 📞 ========================================');
      console.log('[WebRTC] 🚀 INITIATING CALL');
      console.log('[WebRTC] ========================================');
      console.log('[WebRTC] ConversationId:', conversationId);
      console.log('[WebRTC] Call type:', callType);
      console.log('[WebRTC] Participants:', participants);

      // Get current user
      console.log('[WebRTC] 🔍 Getting authenticated user...');
      const { user } = useAuthStore.getState();
      if (!user) {
        console.error('[WebRTC] ❌ No authenticated user found');
        return false;
      }
      console.log('[WebRTC] ✅ User:', user.username, '(', user.id, ')');

      // Get local media stream
      console.log('[WebRTC] 🎥 Requesting local media stream...');
      console.log('[WebRTC]   Audio: true');
      console.log('[WebRTC]   Video:', callType === 'video');
      await this.getLocalStream(callType === 'video');
      console.log('[WebRTC] ✅ Local media stream acquired');

      // Update store FIRST to set initiatorId
      console.log('[WebRTC] 🔄 Creating call in store (callId will be pending)...');
      useCallStore.getState().initiateCall(conversationId, callType, participants);

      // Set initiator ID
      const activeCall = useCallStore.getState().activeCall;
      if (activeCall) {
        activeCall.initiatorId = user.id;
        activeCall.initiatorName = user.username || user.firstName || 'You';
        console.log('[WebRTC] ✅ Set initiator:', activeCall.initiatorName);
      }

      // Emit call initiation to signaling server
      console.log('[WebRTC] 📡 Emitting call:initiate to server...');
      realtimeSocket.emit('call:initiate', {
        conversationId,
        callType,
        participants,
      });
      console.log('[WebRTC] ✅ call:initiate emitted');
      console.log('[WebRTC] ⏳ Waiting for server to generate callId...');

      return true;
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to initiate call:', error);
      console.error('[WebRTC] Error stack:', (error as Error).stack);
      this.endCall();
      return false;
    }
  }

  async acceptCall(callId: string) {
    try {
      console.log('[WebRTC] 📞 ========================================');
      console.log('[WebRTC] ✅ ACCEPTING CALL');
      console.log('[WebRTC] ========================================');
      console.log('[WebRTC] CallId:', callId);

      console.log('[WebRTC] 🔍 Getting incoming call from store...');
      const incomingCall = useCallStore.getState().incomingCall;
      if (!incomingCall) {
        console.error('[WebRTC] ❌ No incoming call found in store');
        return false;
      }
      console.log('[WebRTC] ✅ Found incoming call from:', incomingCall.from.username);
      console.log('[WebRTC]   Call type:', incomingCall.callType);

      // Get local media stream
      console.log('[WebRTC] 🎥 Requesting local media stream...');
      console.log('[WebRTC]   Audio: true');
      console.log('[WebRTC]   Video:', incomingCall.callType === 'video');
      await this.getLocalStream(incomingCall.callType === 'video');
      console.log('[WebRTC] ✅ Local media stream acquired');

      // Accept the call in store
      console.log('[WebRTC] 🔄 Accepting call in store...');
      useCallStore.getState().acceptCall(callId);
      console.log('[WebRTC] ✅ Call accepted in store, overlay should appear');

      // Add the initiator as a participant
      console.log('[WebRTC] 👤 Adding initiator as participant:', incomingCall.from.userId);
      useCallStore.getState().addParticipant(incomingCall.from.userId, {
        userId: incomingCall.from.userId,
        username: incomingCall.from.username,
        avatarUrl: incomingCall.from.avatarUrl,
        isAudioEnabled: true,
        isVideoEnabled: incomingCall.callType === 'video',
        isScreenSharing: false,
      });

      // Create peer connection for the initiator
      console.log('[WebRTC] 🔗 Creating peer connection for initiator...');
      this.createPeerConnection(incomingCall.from.userId);
      console.log('[WebRTC] ✅ Peer connection created, waiting for offer');

      // Notify signaling server
      console.log('[WebRTC] 📡 Emitting call:accept to server...');
      realtimeSocket.emit('call:accept', { callId });
      console.log('[WebRTC] ✅ call:accept emitted');
      console.log('[WebRTC] ⏳ Waiting for offer from initiator...');

      return true;
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to accept call:', error);
      console.error('[WebRTC] Error stack:', (error as Error).stack);
      this.rejectCall(callId);
      return false;
    }
  }

  rejectCall(callId: string) {
    console.log('[WebRTC] 📞 ========================================');
    console.log('[WebRTC] ❌ REJECTING CALL');
    console.log('[WebRTC] ========================================');
    console.log('[WebRTC] CallId:', callId);

    console.log('[WebRTC] 📡 Notifying server of call rejection...');
    realtimeSocket.emit('call:reject', { callId });
    console.log('[WebRTC] ✅ call:reject event emitted');

    console.log('[WebRTC] 🧹 Clearing incoming call from store...');
    useCallStore.getState().rejectCall(callId);
    console.log('[WebRTC] ✅ Call rejected successfully');
  }

  async getLocalStream(video: boolean = true): Promise<MediaStream> {
    if (this.localStream) {
      console.log('[WebRTC] Reusing existing local stream');
      return this.localStream;
    }

    try {
      console.log('[WebRTC] Requesting user media - Video:', video);

      const constraints: MediaConstraints = {
        audio: true,
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
      };

      console.log('[WebRTC] Media constraints:', constraints);

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      const audioTracks = this.localStream.getAudioTracks();
      const videoTracks = this.localStream.getVideoTracks();

      console.log('[WebRTC] ✅ Local stream acquired successfully');
      console.log('[WebRTC] Audio tracks:', audioTracks.length, audioTracks.map(t => t.label));
      console.log('[WebRTC] Video tracks:', videoTracks.length, videoTracks.map(t => t.label));

      useCallStore.getState().setLocalStream(this.localStream);

      return this.localStream;
    } catch (error: any) {
      console.error('[WebRTC] ❌ Failed to get local stream:', error);
      console.error('[WebRTC] Error name:', error.name);
      console.error('[WebRTC] Error message:', error.message);

      // Provide user-friendly error messages
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        console.error('[WebRTC] Camera/microphone permission denied by user');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        console.error('[WebRTC] No camera/microphone found on device');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        console.error('[WebRTC] Camera/microphone already in use by another application');
      }

      throw error;
    }
  }

  private createPeerConnection(userId: string): RTCPeerConnection {
    if (this.peerConnections.has(userId)) {
      console.log('[WebRTC] ℹ️ Peer connection already exists for:', userId);
      return this.peerConnections.get(userId)!;
    }

    console.log('[WebRTC] 🔗 ========================================');
    console.log('[WebRTC] 🔗 CREATING PEER CONNECTION');
    console.log('[WebRTC] ========================================');
    console.log('[WebRTC] Target user:', userId);
    console.log('[WebRTC] ICE servers configured:', this.config.iceServers.length);

    const pc = new RTCPeerConnection(this.config);

    // Add local stream tracks
    console.log('[WebRTC] 📹 Adding local tracks to peer connection...');
    if (this.localStream) {
      const tracks = this.localStream.getTracks();
      console.log('[WebRTC]   Adding', tracks.length, 'tracks');
      tracks.forEach((track, index) => {
        console.log('[WebRTC]   Track', index + 1, ':', track.kind, '-', track.label);
        pc.addTrack(track, this.localStream!);
      });
      console.log('[WebRTC] ✅ Local tracks added');
    } else {
      console.warn('[WebRTC] ⚠️ No local stream available to add tracks');
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('[WebRTC] 📺 ========================================');
      console.log('[WebRTC] 📺 RECEIVED REMOTE TRACK');
      console.log('[WebRTC] ========================================');
      console.log('[WebRTC] From:', userId);
      console.log('[WebRTC] Track kind:', event.track.kind);
      console.log('[WebRTC] Track label:', event.track.label);
      console.log('[WebRTC] Stream count:', event.streams.length);

      const [remoteStream] = event.streams;
      console.log('[WebRTC] Remote stream tracks:', remoteStream.getTracks().length);
      remoteStream.getTracks().forEach((track, index) => {
        console.log('[WebRTC]   Track', index + 1, ':', track.kind, '-', track.label);
      });

      console.log('[WebRTC] 🔄 Updating participant with remote stream...');

      // CRITICAL FIX: Clone the stream to create a new object reference
      // This ensures React's useEffect in VideoTile detects the change
      console.log('[WebRTC] Creating new MediaStream with cloned tracks to trigger React re-render');
      const clonedStream = new MediaStream(remoteStream.getTracks());
      console.log('[WebRTC] Cloned stream ID:', clonedStream.id);
      console.log('[WebRTC] Cloned stream tracks:', clonedStream.getTracks().length);

      // Check if video track is present and update isVideoEnabled accordingly
      const hasVideo = clonedStream.getVideoTracks().length > 0;
      console.log('[WebRTC] Stream has video track:', hasVideo);

      const updates: Partial<CallParticipant> = {
        stream: clonedStream,
      };

      // Update isVideoEnabled if video track is present
      if (hasVideo) {
        const videoTrack = clonedStream.getVideoTracks()[0];
        console.log('[WebRTC] Video track found - updating isVideoEnabled to true');
        console.log('[WebRTC] Video track enabled state:', videoTrack.enabled);
        updates.isVideoEnabled = videoTrack.enabled;
      }

      useCallStore.getState().updateParticipant(userId, updates);
      console.log('[WebRTC] ✅ Remote stream set for participant with new reference');
      if (hasVideo) {
        console.log('[WebRTC] ✅ Participant isVideoEnabled updated to:', updates.isVideoEnabled);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] Sending ICE candidate to:', userId);

        // Get active call for callId
        const activeCall = useCallStore.getState().activeCall;
        if (!activeCall || !activeCall.callId || activeCall.callId === 'pending') {
          console.error('[WebRTC] Cannot send ICE candidate - no valid callId');
          return;
        }

        realtimeSocket.emit('webrtc:ice-candidate', {
          callId: activeCall.callId,
          to: userId,
          candidate: event.candidate,
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = async () => {
      console.log('[WebRTC] 🔌 ========================================');
      console.log('[WebRTC] 🔌 CONNECTION STATE CHANGE');
      console.log('[WebRTC] ========================================');
      console.log('[WebRTC] User:', userId);
      console.log('[WebRTC] New state:', pc.connectionState);

      if (pc.connectionState === 'connected') {
        console.log('[WebRTC] ✅ ========================================');
        console.log('[WebRTC] ✅ PEER CONNECTION ESTABLISHED!');
        console.log('[WebRTC] ✅ ========================================');
        console.log('[WebRTC] Peer:', userId);
        console.log('[WebRTC] 🎉 Media should now be flowing!');
      } else if (pc.connectionState === 'failed') {
        console.error('[WebRTC] ❌ ========================================');
        console.error('[WebRTC] ❌ CONNECTION FAILED');
        console.error('[WebRTC] ❌ ========================================');
        console.error('[WebRTC] Peer:', userId);
        console.warn('[WebRTC] 🔄 Attempting ICE restart...');

        // Attempt ICE restart
        try {
          const offer = await pc.createOffer({ iceRestart: true });
          await pc.setLocalDescription(offer);

          // Get active call for callId
          const activeCall = useCallStore.getState().activeCall;
          if (!activeCall || !activeCall.callId || activeCall.callId === 'pending') {
            console.error('[WebRTC] Cannot send ICE restart offer - no valid callId');
            return;
          }

          console.log('[WebRTC] Sending ICE restart offer to:', userId, 'for call:', activeCall.callId);

          realtimeSocket.emit('webrtc:offer', {
            callId: activeCall.callId,
            to: userId,
            sdp: offer,
          });

          console.log('[WebRTC] ICE restart offer sent to:', userId);
        } catch (error) {
          console.error('[WebRTC] ICE restart failed:', error);
        }
      } else if (pc.connectionState === 'disconnected') {
        console.log('[WebRTC] Peer disconnected:', userId, '- Monitoring...');

        // Wait a bit to see if it reconnects
        setTimeout(() => {
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            console.warn('[WebRTC] Connection still down, attempting reconnection');
            this.renegotiate(userId);
          }
        }, 5000); // Wait 5 seconds before attempting reconnection
      } else if (pc.connectionState === 'closed') {
        console.log('[WebRTC] Peer connection closed:', userId);
        this.closePeerConnection(userId);
      }
    };

    // Monitor ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state for ${userId}:`, pc.iceConnectionState);

      if (pc.iceConnectionState === 'failed') {
        console.error('[WebRTC] ICE connection failed for:', userId);
      } else if (pc.iceConnectionState === 'disconnected') {
        console.warn('[WebRTC] ICE disconnected for:', userId);
      }
    };

    this.peerConnections.set(userId, pc);

    // Process pending ICE candidates
    const pending = this.pendingCandidates.get(userId);
    if (pending) {
      pending.forEach(candidate => {
        pc.addIceCandidate(candidate).catch(console.error);
      });
      this.pendingCandidates.delete(userId);
    }

    return pc;
  }

  private async createOffer(userId: string) {
    const pc = this.createPeerConnection(userId);

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await pc.setLocalDescription(offer);

      // Get active call for callId
      const activeCall = useCallStore.getState().activeCall;
      if (!activeCall || !activeCall.callId || activeCall.callId === 'pending') {
        console.error('[WebRTC] Cannot send offer - no valid callId');
        return;
      }

      console.log('[WebRTC] Sending offer to:', userId, 'for call:', activeCall.callId);

      realtimeSocket.emit('webrtc:offer', {
        callId: activeCall.callId,
        to: userId,
        sdp: offer,
      });
    } catch (error) {
      console.error('[WebRTC] Failed to create offer:', error);
    }
  }

  private async handleOffer(userId: string, offer: RTCSessionDescriptionInit) {
    const pc = this.createPeerConnection(userId);

    try {
      await pc.setRemoteDescription(offer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Get active call for callId
      const activeCall = useCallStore.getState().activeCall;
      if (!activeCall || !activeCall.callId || activeCall.callId === 'pending') {
        console.error('[WebRTC] Cannot send answer - no valid callId');
        return;
      }

      console.log('[WebRTC] Sending answer to:', userId, 'for call:', activeCall.callId);

      realtimeSocket.emit('webrtc:answer', {
        callId: activeCall.callId,
        to: userId,
        sdp: answer,
      });
    } catch (error) {
      console.error('[WebRTC] Failed to handle offer:', error);
    }
  }

  private async handleAnswer(userId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(userId);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(answer);
    } catch (error) {
      console.error('[WebRTC] Failed to handle answer:', error);
    }
  }

  private async handleIceCandidate(userId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(userId);

    if (!pc) {
      // Store candidate for later
      if (!this.pendingCandidates.has(userId)) {
        this.pendingCandidates.set(userId, []);
      }
      this.pendingCandidates.get(userId)!.push(new RTCIceCandidate(candidate));
      return;
    }

    try {
      await pc.addIceCandidate(candidate);
    } catch (error) {
      console.error('[WebRTC] Failed to add ICE candidate:', error);
    }
  }

  async toggleAudio() {
    console.log('[WebRTC] 🎤 toggleAudio() called');

    if (!this.localStream) {
      console.error('[WebRTC] ❌ Cannot toggle audio: localStream is null');
      console.error('[WebRTC] This usually means the stream is still initializing');
      return;
    }

    const audioTracks = this.localStream.getAudioTracks();
    console.log('[WebRTC] Found', audioTracks.length, 'audio tracks');

    if (audioTracks.length === 0) {
      console.error('[WebRTC] ❌ No audio tracks found in localStream');
      return;
    }

    const isEnabled = !audioTracks[0].enabled;
    console.log('[WebRTC] Toggling audio:', audioTracks[0].enabled ? 'OFF' : 'ON');

    audioTracks.forEach(track => {
      track.enabled = isEnabled;
      console.log('[WebRTC] Audio track', track.label, '- enabled:', track.enabled);
    });

    useCallStore.getState().toggleAudio();
    console.log('[WebRTC] Store updated with audio state:', isEnabled);

    // Notify other participants
    const activeCall = useCallStore.getState().activeCall;
    if (activeCall) {
      console.log('[WebRTC] 📡 Notifying server of audio toggle...');
      realtimeSocket.emit('call:media-toggle', {
        callId: activeCall.callId,
        mediaType: 'audio',
        enabled: isEnabled,
      });
      console.log('[WebRTC] ✅ Server notified');
    }
  }

  async toggleVideo() {
    console.log('[WebRTC] 📹 toggleVideo() called');

    if (!this.localStream) {
      console.error('[WebRTC] ❌ Cannot toggle video: localStream is null');
      console.error('[WebRTC] This usually means the stream is still initializing');
      return;
    }

    const videoTracks = this.localStream.getVideoTracks();
    console.log('[WebRTC] Found', videoTracks.length, 'video tracks');

    if (videoTracks.length === 0) {
      console.error('[WebRTC] ❌ No video tracks found in localStream');
      return;
    }

    const isEnabled = !videoTracks[0].enabled;
    console.log('[WebRTC] Toggling video:', videoTracks[0].enabled ? 'OFF' : 'ON');

    videoTracks.forEach(track => {
      track.enabled = isEnabled;
      console.log('[WebRTC] Video track', track.label, '- enabled:', track.enabled);
    });

    useCallStore.getState().toggleVideo();
    console.log('[WebRTC] Store updated with video state:', isEnabled);

    // Notify other participants
    const activeCall = useCallStore.getState().activeCall;
    if (activeCall) {
      console.log('[WebRTC] 📡 Notifying server of video toggle...');
      realtimeSocket.emit('call:media-toggle', {
        callId: activeCall.callId,
        mediaType: 'video',
        enabled: isEnabled,
      });
      console.log('[WebRTC] ✅ Server notified');
    }
  }

  /**
   * Switch from audio to video call
   * Adds video track to existing audio call
   */
  async switchToVideo() {
    try {
      console.log('[WebRTC] 📹 ========================================');
      console.log('[WebRTC] 📹 SWITCHING TO VIDEO CALL');
      console.log('[WebRTC] 📹 ========================================');

      const activeCall = useCallStore.getState().activeCall;
      if (!activeCall) {
        console.warn('[WebRTC] ❌ No active call to switch');
        return false;
      }

      console.log('[WebRTC] Current call type:', activeCall.callType);
      console.log('[WebRTC] Current callId:', activeCall.callId);
      console.log('[WebRTC] Number of peer connections:', this.peerConnections.size);

      // If already video call, just enable video
      if (activeCall.callType === 'video') {
        console.log('[WebRTC] ℹ️ Already a video call, just enabling video track');
        const videoTracks = this.localStream?.getVideoTracks() || [];
        console.log('[WebRTC] Video tracks found:', videoTracks.length);
        if (videoTracks.length > 0) {
          videoTracks.forEach(track => {
            console.log('[WebRTC] Enabling video track:', track.label);
            track.enabled = true;
          });
          useCallStore.getState().toggleVideo();
          return true;
        }
      }

      console.log('[WebRTC] 🎥 Requesting video track from camera...');
      // Get video track
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        }
      });

      const videoTrack = videoStream.getVideoTracks()[0];
      console.log('[WebRTC] ✅ Video track acquired:', videoTrack.label);
      console.log('[WebRTC] Video track enabled:', videoTrack.enabled);
      console.log('[WebRTC] Video track readyState:', videoTrack.readyState);

      // Add video track to local stream
      if (this.localStream) {
        console.log('[WebRTC] 📹 Adding video track to local stream...');
        console.log('[WebRTC] Local stream tracks before:', this.localStream.getTracks().length);
        this.localStream.addTrack(videoTrack);
        console.log('[WebRTC] Local stream tracks after:', this.localStream.getTracks().length);
        console.log('[WebRTC] ✅ Video track added to local stream');
      } else {
        console.error('[WebRTC] ❌ No local stream to add video track to!');
        return false;
      }

      // Add video track to all peer connections
      console.log('[WebRTC] 🔗 Adding video track to peer connections...');
      let peerCount = 0;
      this.peerConnections.forEach((pc, userId) => {
        console.log('[WebRTC] Adding video track to peer:', userId);
        console.log('[WebRTC]   Connection state:', pc.connectionState);
        console.log('[WebRTC]   Signaling state:', pc.signalingState);

        const sender = pc.addTrack(videoTrack, this.localStream!);
        console.log('[WebRTC]   Sender track:', sender.track?.kind, sender.track?.label);

        peerCount++;
      });
      console.log('[WebRTC] ✅ Video track added to', peerCount, 'peer connection(s)');

      // Update call type
      console.log('[WebRTC] 🔄 Updating call type from', activeCall.callType, 'to video');
      activeCall.callType = 'video';

      // CRITICAL FIX: Clone local stream to trigger React re-render
      console.log('[WebRTC] 🔄 Cloning local stream to create new reference for React');
      const clonedLocalStream = new MediaStream(this.localStream.getTracks());
      this.localStream = clonedLocalStream;  // Update internal reference
      console.log('[WebRTC] Cloned local stream ID:', clonedLocalStream.id);
      console.log('[WebRTC] Cloned local stream tracks:', clonedLocalStream.getTracks().length);

      useCallStore.getState().setLocalStream(clonedLocalStream);
      console.log('[WebRTC] ✅ Local stream updated with new reference - should trigger local video display');
      console.log('[WebRTC] ✅ Call type updated to video');

      // Update store to show video is enabled
      console.log('[WebRTC] 🔄 Updating store to enable video...');
      const currentState = useCallStore.getState().activeCall;
      if (currentState && !currentState.isVideoEnabled) {
        useCallStore.getState().toggleVideo();
        console.log('[WebRTC] ✅ Video enabled in store');
      }

      // Renegotiate with all peers
      console.log('[WebRTC] 🔄 Starting renegotiation with all peers...');
      let renegotiateCount = 0;
      for (const [userId, pc] of this.peerConnections) {
        console.log('[WebRTC] Renegotiating with peer:', userId);
        await this.renegotiate(userId);
        renegotiateCount++;
        console.log('[WebRTC] ✅ Renegotiation', renegotiateCount, 'of', this.peerConnections.size, 'completed');
      }

      console.log('[WebRTC] ✅ ========================================');
      console.log('[WebRTC] ✅ SUCCESSFULLY SWITCHED TO VIDEO CALL');
      console.log('[WebRTC] ✅ ========================================');
      console.log('[WebRTC] Local stream now has video:', this.localStream.getVideoTracks().length > 0);
      console.log('[WebRTC] Renegotiation completed for', renegotiateCount, 'peer(s)');
      return true;
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to switch to video:', error);
      console.error('[WebRTC] Error stack:', (error as Error).stack);
      return false;
    }
  }

  /**
   * Renegotiate peer connection (create new offer/answer)
   */
  private async renegotiate(userId: string) {
    console.log('[WebRTC] 🔄 ========================================');
    console.log('[WebRTC] 🔄 RENEGOTIATING PEER CONNECTION');
    console.log('[WebRTC] 🔄 ========================================');
    console.log('[WebRTC] Target user:', userId);

    const pc = this.peerConnections.get(userId);
    if (!pc) {
      console.error('[WebRTC] ❌ No peer connection found for user:', userId);
      return;
    }

    console.log('[WebRTC] Peer connection state:', pc.connectionState);
    console.log('[WebRTC] Signaling state:', pc.signalingState);

    try {
      console.log('[WebRTC] 📝 Creating new offer...');
      const offer = await pc.createOffer();
      console.log('[WebRTC] ✅ Offer created');
      console.log('[WebRTC] Offer type:', offer.type);
      console.log('[WebRTC] Offer SDP length:', offer.sdp?.length || 0);

      console.log('[WebRTC] 📝 Setting local description...');
      await pc.setLocalDescription(offer);
      console.log('[WebRTC] ✅ Local description set');
      console.log('[WebRTC] New signaling state:', pc.signalingState);

      // Get active call for callId
      const activeCall = useCallStore.getState().activeCall;
      if (!activeCall || !activeCall.callId || activeCall.callId === 'pending') {
        console.error('[WebRTC] ❌ Cannot renegotiate - no valid callId');
        return;
      }

      console.log('[WebRTC] 📡 Sending renegotiation offer to:', userId);
      console.log('[WebRTC] Call ID:', activeCall.callId);

      realtimeSocket.emit('webrtc:offer', {
        callId: activeCall.callId,
        to: userId,
        sdp: offer,
      });

      console.log('[WebRTC] ✅ Renegotiation offer sent successfully');
      console.log('[WebRTC] ⏳ Waiting for answer from:', userId);
    } catch (error) {
      console.error('[WebRTC] ❌ Failed to renegotiate:', error);
      console.error('[WebRTC] Error details:', (error as Error).message);
      console.error('[WebRTC] Error stack:', (error as Error).stack);
    }
  }

  async toggleScreenShare() {
    const activeCall = useCallStore.getState().activeCall;
    if (!activeCall) return;

    try {
      if (this.screenStream) {
        // Stop screen sharing
        this.screenStream.getTracks().forEach(track => track.stop());
        this.screenStream = null;

        // Replace screen track with camera track
        const videoTrack = this.localStream?.getVideoTracks()[0];
        if (videoTrack) {
          this.peerConnections.forEach((pc, userId) => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          });
        }

        useCallStore.getState().toggleScreenShare();

        realtimeSocket.emit('call:media-toggle', {
          callId: activeCall.callId,
          mediaType: 'screen',
          enabled: false,
        });
      } else {
        // Start screen sharing
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        const screenTrack = this.screenStream.getVideoTracks()[0];

        // Replace camera track with screen track
        this.peerConnections.forEach((pc, userId) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        // Handle screen share end
        screenTrack.onended = () => {
          this.toggleScreenShare();
        };

        useCallStore.getState().toggleScreenShare();

        realtimeSocket.emit('call:media-toggle', {
          callId: activeCall.callId,
          mediaType: 'screen',
          enabled: true,
        });
      }
    } catch (error) {
      console.error('[WebRTC] Failed to toggle screen share:', error);
    }
  }

  private closePeerConnection(userId: string) {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }
  }

  /**
   * Monitor connection quality for debugging and diagnostics
   * Logs detailed statistics about peer connections
   */
  async getConnectionStats(userId: string): Promise<void> {
    const pc = this.peerConnections.get(userId);
    if (!pc) {
      console.warn('[WebRTC] No peer connection found for:', userId);
      return;
    }

    try {
      const stats = await pc.getStats();
      const statsReport: any = {
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        iceGatheringState: pc.iceGatheringState,
        signalingState: pc.signalingState,
        audio: { inbound: {}, outbound: {} },
        video: { inbound: {}, outbound: {} },
        connection: {},
      };

      stats.forEach((report) => {
        // Audio/Video stats
        if (report.type === 'inbound-rtp') {
          const mediaType = report.kind === 'audio' ? 'audio' : 'video';
          statsReport[mediaType].inbound = {
            packetsReceived: report.packetsReceived,
            packetsLost: report.packetsLost,
            jitter: report.jitter,
            bytesReceived: report.bytesReceived,
          };
        } else if (report.type === 'outbound-rtp') {
          const mediaType = report.kind === 'audio' ? 'audio' : 'video';
          statsReport[mediaType].outbound = {
            packetsSent: report.packetsSent,
            bytesSent: report.bytesSent,
          };
        } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          statsReport.connection = {
            currentRoundTripTime: report.currentRoundTripTime,
            availableOutgoingBitrate: report.availableOutgoingBitrate,
            availableIncomingBitrate: report.availableIncomingBitrate,
          };
        }
      });

      console.log(`[WebRTC] Connection stats for ${userId}:`, statsReport);

      // Warn about quality issues
      if (statsReport.connection.currentRoundTripTime > 0.3) {
        console.warn('[WebRTC] High latency detected:', statsReport.connection.currentRoundTripTime);
      }

      if (statsReport.audio.inbound.packetsLost > 0) {
        const lossRate = statsReport.audio.inbound.packetsLost / statsReport.audio.inbound.packetsReceived;
        if (lossRate > 0.05) {
          console.warn('[WebRTC] High packet loss detected:', (lossRate * 100).toFixed(2) + '%');
        }
      }
    } catch (error) {
      console.error('[WebRTC] Failed to get connection stats:', error);
    }
  }

  /**
   * Start periodic connection monitoring
   * Useful for production debugging and quality assurance
   */
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  startConnectionMonitoring(userId: string, intervalMs: number = 10000) {
    // Clear existing monitor if any
    this.stopConnectionMonitoring(userId);

    console.log('[WebRTC] Starting connection monitoring for:', userId, 'every', intervalMs, 'ms');

    const interval = setInterval(() => {
      this.getConnectionStats(userId);
    }, intervalMs);

    this.monitoringIntervals.set(userId, interval);
  }

  stopConnectionMonitoring(userId: string) {
    const interval = this.monitoringIntervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(userId);
      console.log('[WebRTC] Stopped connection monitoring for:', userId);
    }
  }

  endCall() {
    console.log('[WebRTC] 📞 ========================================');
    console.log('[WebRTC] 🔴 ENDING CALL');
    console.log('[WebRTC] ========================================');

    // Stop all connection monitoring
    console.log('[WebRTC] 🛑 Stopping connection monitoring...');
    this.monitoringIntervals.forEach((interval, userId) => {
      this.stopConnectionMonitoring(userId);
    });

    // Close all peer connections
    console.log('[WebRTC] 🔌 Closing peer connections...');
    this.peerConnections.forEach((pc, userId) => {
      this.closePeerConnection(userId);
    });

    // Stop local streams
    console.log('[WebRTC] 📹 Stopping local media streams...');
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    // Clear pending candidates
    this.pendingCandidates.clear();

    // Notify server - IMPORTANT: Do this BEFORE clearing the store
    const activeCall = useCallStore.getState().activeCall;
    const incomingCall = useCallStore.getState().incomingCall;

    // Determine which callId to use
    const callIdToEnd = activeCall?.callId || incomingCall?.callId;

    if (callIdToEnd && callIdToEnd !== 'pending') {
      console.log('[WebRTC] 📡 Notifying server of call end:', callIdToEnd);
      realtimeSocket.emit('call:end', { callId: callIdToEnd });
      console.log('[WebRTC] ✅ call:end event emitted to server');
    } else {
      console.warn('[WebRTC] ⚠️ No valid callId to end, skipping server notification');
    }

    // Clear both active call and incoming call from store
    console.log('[WebRTC] 🧹 Clearing call state from store...');
    if (activeCall) {
      useCallStore.getState().endCall('');
    }
    if (incomingCall) {
      useCallStore.getState().rejectCall(incomingCall.callId);
    }

    console.log('[WebRTC] ✅ Call ended successfully');
  }
}

// Export singleton instance
export const webrtcService = new WebRTCService();