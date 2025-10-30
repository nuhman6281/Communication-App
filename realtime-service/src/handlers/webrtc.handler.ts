import { Server, Socket } from 'socket.io';
import { RoomService } from '../services/room.service';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

// WebRTC type definitions for Node.js environment
interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback';
  sdp?: string;
}

interface RTCIceCandidateInit {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

interface CallData {
  callId: string;
  conversationId: string;
  callType: 'audio' | 'video';
  participants: string[];
  initiatorId: string;
  initiatorName: string;
  status: 'initiated' | 'ringing' | 'ongoing' | 'ended' | 'missed' | 'declined' | 'failed';
  startedAt?: Date;
  endedAt?: Date;
}

interface SignalingData {
  callId: string;
  from: string;
  to: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export class WebRTCHandler {
  private roomService: RoomService;
  private activeCalls: Map<string, CallData>;
  private userSocketMap: Map<string, Set<string>>; // userId -> socketIds
  private callTimeouts: Map<string, NodeJS.Timeout>;
  private totalCallsCount: number = 0;

  constructor(private io: Server) {
    this.roomService = new RoomService(io);
    this.activeCalls = new Map();
    this.userSocketMap = new Map();
    this.callTimeouts = new Map();
  }

  /**
   * Initiate a new call
   */
  async handleCallInitiate(
    socket: Socket,
    data: {
      conversationId: string;
      callType: 'audio' | 'video';
      participants: string[];
    }
  ) {
    try {
      const callId = this.generateCallId();
      const callData: CallData = {
        callId,
        conversationId: data.conversationId,
        callType: data.callType,
        participants: [socket.data.userId, ...data.participants],
        initiatorId: socket.data.userId,
        initiatorName: socket.data.username,
        status: 'ringing',
        startedAt: new Date(),
      };

      // Check participant limit
      if (callData.participants.length > config.MAX_PARTICIPANTS_PER_CALL) {
        socket.emit('call:error', {
          message: `Maximum ${config.MAX_PARTICIPANTS_PER_CALL} participants allowed`,
        });
        return;
      }

      this.activeCalls.set(callId, callData);
      this.totalCallsCount++;

      // Create room for the call
      await this.roomService.createRoom(callId, callData.participants);

      // Join the initiator to the call room
      socket.join(`call:${callId}`);
      this.addUserSocket(socket.data.userId, socket.id);

      // Get ICE servers configuration
      const iceServers = this.getIceServers();

      // Notify other participants about incoming call
      logger.info(`Notifying ${data.participants.length} participants about call ${callId}: ${JSON.stringify(data.participants)}`);
      for (const participantId of data.participants) {
        logger.info(`Emitting call:incoming to user:${participantId}`);
        this.emitToUser(participantId, 'call:incoming', {
          callId,
          from: {
            userId: socket.data.userId,
            username: socket.data.username,
          },
          conversationId: data.conversationId,
          callType: data.callType,
          iceServers,
        });
      }

      // Set timeout for missed call
      const timeout = setTimeout(() => {
        this.handleMissedCall(callId);
      }, 30000); // 30 seconds ring timeout

      this.callTimeouts.set(callId, timeout);

      logger.info(`Call initiated: ${callId} by ${socket.data.username} (${socket.data.userId})`);

      // Acknowledge to initiator
      socket.emit('call:initiated', {
        callId,
        status: 'ringing',
        iceServers,
      });
    } catch (error) {
      logger.error(`Failed to initiate call: ${error}`);
      socket.emit('call:error', { message: 'Failed to initiate call' });
    }
  }

  /**
   * Accept incoming call
   */
  async handleCallAccept(
    socket: Socket,
    data: { callId: string }
  ) {
    try {
      const callData = this.activeCalls.get(data.callId);
      if (!callData) {
        socket.emit('call:error', { message: 'Call not found' });
        return;
      }

      // Clear ring timeout
      const timeout = this.callTimeouts.get(data.callId);
      if (timeout) {
        clearTimeout(timeout);
        this.callTimeouts.delete(data.callId);
      }

      // Update call status
      callData.status = 'ongoing';

      // Join the call room
      socket.join(`call:${data.callId}`);
      this.addUserSocket(socket.data.userId, socket.id);

      // Get ICE servers
      const iceServers = this.getIceServers();

      // Notify all participants that call is accepted
      this.io.to(`call:${data.callId}`).emit('call:accepted', {
        callId: data.callId,
        userId: socket.data.userId,
        username: socket.data.username,
        acceptedBy: {
          userId: socket.data.userId,
          username: socket.data.username,
        },
        iceServers,
      });

      logger.info(`Call accepted: ${data.callId} by ${socket.data.username}`);
    } catch (error) {
      logger.error(`Failed to accept call: ${error}`);
      socket.emit('call:error', { message: 'Failed to accept call' });
    }
  }

  /**
   * Handle WebRTC offer
   */
  async handleOffer(socket: Socket, data: SignalingData) {
    try {
      const { callId, to, sdp } = data;

      if (!this.activeCalls.has(callId)) {
        socket.emit('call:error', { message: 'Call not found' });
        return;
      }

      // Forward offer to the recipient
      this.emitToUser(to, 'webrtc:offer', {
        callId,
        userId: socket.data.userId,
        offer: sdp,
      });

      logger.debug(`Offer forwarded from ${socket.data.userId} to ${to} for call ${callId}`);
    } catch (error) {
      logger.error(`Failed to handle offer: ${error}`);
      socket.emit('call:error', { message: 'Failed to send offer' });
    }
  }

  /**
   * Handle WebRTC answer
   */
  async handleAnswer(socket: Socket, data: SignalingData) {
    try {
      const { callId, to, sdp } = data;

      if (!this.activeCalls.has(callId)) {
        socket.emit('call:error', { message: 'Call not found' });
        return;
      }

      // Forward answer to the caller
      this.emitToUser(to, 'webrtc:answer', {
        callId,
        userId: socket.data.userId,
        answer: sdp,
      });

      logger.debug(`Answer forwarded from ${socket.data.userId} to ${to} for call ${callId}`);
    } catch (error) {
      logger.error(`Failed to handle answer: ${error}`);
      socket.emit('call:error', { message: 'Failed to send answer' });
    }
  }

  /**
   * Handle ICE candidates
   */
  async handleIceCandidate(socket: Socket, data: SignalingData) {
    try {
      const { callId, to, candidate } = data;

      if (!this.activeCalls.has(callId)) {
        return; // Silently ignore if call doesn't exist
      }

      // Forward ICE candidate to the peer
      this.emitToUser(to, 'webrtc:ice-candidate', {
        callId,
        userId: socket.data.userId,
        candidate,
      });

      logger.debug(`ICE candidate forwarded from ${socket.data.userId} to ${to}`);
    } catch (error) {
      logger.error(`Failed to handle ICE candidate: ${error}`);
    }
  }

  /**
   * Handle call rejection
   */
  async handleCallReject(
    socket: Socket,
    data: { callId: string; reason?: string }
  ) {
    try {
      const { callId, reason } = data;
      const callData = this.activeCalls.get(callId);

      if (!callData) {
        return;
      }

      // Clear timeout
      const timeout = this.callTimeouts.get(callId);
      if (timeout) {
        clearTimeout(timeout);
        this.callTimeouts.delete(callId);
      }

      callData.status = 'declined';
      callData.endedAt = new Date();

      // Notify all participants
      this.io.to(`call:${callId}`).emit('call:rejected', {
        callId,
        rejectedBy: {
          userId: socket.data.userId,
          username: socket.data.username,
        },
        reason: reason || 'Call declined',
      });

      // Clean up
      await this.cleanupCall(callId);

      logger.info(`Call rejected: ${callId} by ${socket.data.username}`);
    } catch (error) {
      logger.error(`Failed to reject call: ${error}`);
    }
  }

  /**
   * Handle call end
   */
  async handleCallEnd(socket: Socket, data: { callId: string }) {
    try {
      const { callId } = data;
      const callData = this.activeCalls.get(callId);

      if (!callData) {
        logger.warn(`Call end requested for non-existent call: ${callId}`);
        return;
      }

      // Clear timeout if exists
      const timeout = this.callTimeouts.get(callId);
      if (timeout) {
        clearTimeout(timeout);
        this.callTimeouts.delete(callId);
      }

      callData.status = 'ended';
      callData.endedAt = new Date();

      // Calculate call duration
      const duration = callData.startedAt
        ? Math.floor((callData.endedAt.getTime() - callData.startedAt.getTime()) / 1000)
        : 0;

      const endedByData = {
        userId: socket.data.userId,
        username: socket.data.username,
      };

      logger.info(`Call ended: ${callId} by ${socket.data.username} (duration: ${duration}s)`);
      logger.info(`Notifying ${callData.participants.length} participants: ${JSON.stringify(callData.participants)}`);

      // CRITICAL FIX: Notify ALL participants individually
      // We can't rely on room broadcasts because receivers might not have joined the room yet
      // (they only join when accepting the call)
      for (const participantId of callData.participants) {
        // Skip the person who ended the call - they'll handle it locally
        if (participantId === socket.data.userId) {
          logger.debug(`Skipping call:ended emit to ${participantId} (they ended it)`);
          continue;
        }

        logger.info(`Emitting call:ended to user:${participantId}`);
        this.emitToUser(participantId, 'call:ended', {
          callId,
          endedBy: endedByData,
          duration,
        });
      }

      // ALSO emit to the room for any participants who DID join (active call scenario)
      // This ensures we catch anyone in the room who might not be in the participants list
      this.io.to(`call:${callId}`).emit('call:ended', {
        callId,
        endedBy: endedByData,
        duration,
      });

      logger.info(`✅ call:ended emitted to all participants for call ${callId}`);

      // Clean up
      await this.cleanupCall(callId);
    } catch (error) {
      logger.error(`Failed to end call: ${error}`);
    }
  }

  /**
   * Handle audio toggle
   */
  handleToggleAudio(
    socket: Socket,
    data: { callId: string; enabled: boolean }
  ) {
    const { callId, enabled } = data;

    if (!this.activeCalls.has(callId)) {
      return;
    }

    socket.to(`call:${callId}`).emit('peer:audio-toggled', {
      peerId: socket.data.userId,
      peerName: socket.data.username,
      enabled,
    });

    logger.debug(`Audio ${enabled ? 'enabled' : 'disabled'} by ${socket.data.username} in call ${callId}`);
  }

  /**
   * Handle video toggle
   */
  handleToggleVideo(
    socket: Socket,
    data: { callId: string; enabled: boolean }
  ) {
    const { callId, enabled } = data;

    if (!this.activeCalls.has(callId)) {
      return;
    }

    socket.to(`call:${callId}`).emit('peer:video-toggled', {
      peerId: socket.data.userId,
      peerName: socket.data.username,
      enabled,
    });

    logger.debug(`Video ${enabled ? 'enabled' : 'disabled'} by ${socket.data.username} in call ${callId}`);
  }

  /**
   * Handle screen share start
   */
  handleScreenShareStart(socket: Socket, data: { callId: string }) {
    const { callId } = data;

    if (!this.activeCalls.has(callId)) {
      return;
    }

    socket.to(`call:${callId}`).emit('screen:sharing-started', {
      peerId: socket.data.userId,
      peerName: socket.data.username,
    });

    logger.info(`Screen sharing started by ${socket.data.username} in call ${callId}`);
  }

  /**
   * Handle screen share stop
   */
  handleScreenShareStop(socket: Socket, data: { callId: string }) {
    const { callId } = data;

    if (!this.activeCalls.has(callId)) {
      return;
    }

    socket.to(`call:${callId}`).emit('screen:sharing-stopped', {
      peerId: socket.data.userId,
      peerName: socket.data.username,
    });

    logger.info(`Screen sharing stopped by ${socket.data.username} in call ${callId}`);
  }

  /**
   * Handle missed call (timeout)
   */
  private async handleMissedCall(callId: string) {
    const callData = this.activeCalls.get(callId);
    if (!callData || callData.status !== 'ringing') {
      return;
    }

    callData.status = 'missed';
    callData.endedAt = new Date();

    this.io.to(`call:${callId}`).emit('call:missed', {
      callId,
      reason: 'No answer',
    });

    await this.cleanupCall(callId);
    logger.info(`Call missed: ${callId}`);
  }

  /**
   * Clean up call resources
   */
  private async cleanupCall(callId: string) {
    // Remove from active calls
    this.activeCalls.delete(callId);

    // Clear timeout
    const timeout = this.callTimeouts.get(callId);
    if (timeout) {
      clearTimeout(timeout);
      this.callTimeouts.delete(callId);
    }

    // Delete room
    await this.roomService.deleteRoom(callId);

    // Make all participants leave the room
    const sockets = await this.io.in(`call:${callId}`).fetchSockets();
    for (const socket of sockets) {
      socket.leave(`call:${callId}`);
    }
  }

  /**
   * Get ICE servers configuration
   */
  private getIceServers(): RTCIceServer[] {
    const servers: RTCIceServer[] = [
      {
        urls: config.STUN_SERVER_URL,
      },
    ];

    if (config.TURN_ENABLED) {
      servers.push({
        urls: config.TURN_SERVER_URL,
        username: config.TURN_USERNAME,
        credential: config.TURN_PASSWORD,
      });
    }

    return servers;
  }

  /**
   * Helper to emit to specific user
   */
  private emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Track user socket connections
   */
  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSocketMap.has(userId)) {
      this.userSocketMap.set(userId, new Set());
    }
    this.userSocketMap.get(userId)!.add(socketId);
  }

  /**
   * Remove user socket on disconnect
   */
  public removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSocketMap.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSocketMap.delete(userId);
      }
    }
  }

  /**
   * Generate unique call ID
   */
  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics
   */
  public getActiveCallsCount(): number {
    return this.activeCalls.size;
  }

  public getTotalCallsCount(): number {
    return this.totalCallsCount;
  }
}