import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { WsJwtGuard } from '@common/guards/ws-jwt.guard';
import { CallsService } from './calls.service';

interface CallSignalData {
  callId: string;
  signal: any; // SDP offer/answer or ICE candidate
  type: 'offer' | 'answer' | 'ice-candidate';
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CallsGateway.name);
  private callParticipants = new Map<string, Set<string>>(); // callId -> Set of socketIds

  constructor(
    @Inject(forwardRef(() => CallsService))
    private readonly callsService: CallsService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to calls: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from calls: ${client.id}`);

    // Remove client from all call rooms
    this.callParticipants.forEach((participants, callId) => {
      if (participants.has(client.id)) {
        participants.delete(client.id);

        // Notify other participants
        this.server.to(`call:${callId}`).emit('call:participant:left', {
          callId,
          userId: client.data?.user?.id,
        });

        if (participants.size === 0) {
          this.callParticipants.delete(callId);
        }
      }
    });
  }

  /**
   * Join a call room for WebRTC signaling
   */
  @SubscribeMessage('call:join')
  async handleJoinCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string },
  ) {
    const { callId } = data;
    const userId = client.data?.user?.id;

    if (!userId) {
      return { error: 'Unauthorized' };
    }

    this.logger.log(`User ${userId} joining call ${callId}`);

    // Join the call room
    client.join(`call:${callId}`);

    // Track participant
    if (!this.callParticipants.has(callId)) {
      this.callParticipants.set(callId, new Set());
    }
    this.callParticipants.get(callId)?.add(client.id);

    // Notify other participants
    client.to(`call:${callId}`).emit('call:participant:joined', {
      callId,
      userId,
      username: client.data?.user?.username,
    });

    return { success: true, callId };
  }

  /**
   * Leave a call room
   */
  @SubscribeMessage('call:leave')
  async handleLeaveCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string },
  ) {
    const { callId } = data;
    const userId = client.data?.user?.id;

    this.logger.log(`User ${userId} leaving call ${callId}`);

    // Leave the call room
    client.leave(`call:${callId}`);

    // Remove from participants
    this.callParticipants.get(callId)?.delete(client.id);

    // Notify other participants
    client.to(`call:${callId}`).emit('call:participant:left', {
      callId,
      userId,
    });

    return { success: true };
  }

  /**
   * Send WebRTC offer
   */
  @SubscribeMessage('call:offer')
  async handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; targetUserId: string; offer: RTCSessionDescriptionInit },
  ) {
    const { callId, targetUserId, offer } = data;
    const userId = client.data?.user?.id;

    this.logger.log(`User ${userId} sending offer to ${targetUserId} in call ${callId}`);

    // Forward offer to target user
    this.emitToUser(targetUserId, 'call:offer:received', {
      callId,
      fromUserId: userId,
      fromUsername: client.data?.user?.username,
      offer,
    });

    return { success: true };
  }

  /**
   * Send WebRTC answer
   */
  @SubscribeMessage('call:answer')
  async handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; targetUserId: string; answer: RTCSessionDescriptionInit },
  ) {
    const { callId, targetUserId, answer } = data;
    const userId = client.data?.user?.id;

    this.logger.log(`User ${userId} sending answer to ${targetUserId} in call ${callId}`);

    // Forward answer to target user
    this.emitToUser(targetUserId, 'call:answer:received', {
      callId,
      fromUserId: userId,
      answer,
    });

    return { success: true };
  }

  /**
   * Send ICE candidate
   */
  @SubscribeMessage('call:ice-candidate')
  async handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; targetUserId: string; candidate: RTCIceCandidateInit },
  ) {
    const { callId, targetUserId, candidate } = data;
    const userId = client.data?.user?.id;

    this.logger.log(`User ${userId} sending ICE candidate to ${targetUserId}`);

    // Forward ICE candidate to target user
    this.emitToUser(targetUserId, 'call:ice-candidate:received', {
      callId,
      fromUserId: userId,
      candidate,
    });

    return { success: true };
  }

  /**
   * Toggle video/audio status
   */
  @SubscribeMessage('call:media:toggle')
  async handleMediaToggle(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; mediaType: 'audio' | 'video'; enabled: boolean },
  ) {
    const { callId, mediaType, enabled } = data;
    const userId = client.data?.user?.id;

    this.logger.log(`User ${userId} toggled ${mediaType} to ${enabled} in call ${callId}`);

    // Notify all participants in the call
    client.to(`call:${callId}`).emit('call:media:toggled', {
      callId,
      userId,
      mediaType,
      enabled,
    });

    return { success: true };
  }

  /**
   * Screen sharing started
   */
  @SubscribeMessage('call:screen:start')
  async handleScreenShareStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string },
  ) {
    const { callId } = data;
    const userId = client.data?.user?.id;

    this.logger.log(`User ${userId} started screen sharing in call ${callId}`);

    // Notify all participants
    client.to(`call:${callId}`).emit('call:screen:started', {
      callId,
      userId,
      username: client.data?.user?.username,
    });

    return { success: true };
  }

  /**
   * Screen sharing stopped
   */
  @SubscribeMessage('call:screen:stop')
  async handleScreenShareStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string },
  ) {
    const { callId } = data;
    const userId = client.data?.user?.id;

    this.logger.log(`User ${userId} stopped screen sharing in call ${callId}`);

    // Notify all participants
    client.to(`call:${callId}`).emit('call:screen:stopped', {
      callId,
      userId,
    });

    return { success: true };
  }

  /**
   * Emit event to a specific user (all their sockets)
   */
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit event to all participants in a call
   */
  emitToCall(callId: string, event: string, data: any) {
    this.server.to(`call:${callId}`).emit(event, data);
  }
}
