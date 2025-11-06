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
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageReactionDto } from './dto/message-reaction.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this properly in production
    credentials: true,
  },
  // No namespace - using root namespace for simpler connection
})
@UseGuards(WsJwtGuard)
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private userSockets = new Map<string, string[]>(); // userId -> [socketIds]

  constructor(
    @Inject(forwardRef(() => MessagesService))
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connected: ${client.id}`);

      // Manually verify JWT token (guards don't run on lifecycle hooks)
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(`No token provided for socket ${client.id}`);
        client.disconnect();
        return;
      }

      // Verify the token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Attach user info to socket
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
      };

      const userId = payload.sub;

      this.logger.log(`WebSocket authenticated: ${payload.username} (${userId})`);

      // Track user's socket connections
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)?.push(client.id);

      // Join user's personal room for direct messages/notifications
      client.join(`user:${userId}`);

      this.logger.log(`User ${userId} (${client.data.user.username}) connected with socket ${client.id}`);

      // Emit connection success
      client.emit('connected', { userId, socketId: client.id });

      // Broadcast user online status to all clients
      this.server.emit('presence:update', {
        userId,
        status: 'online',
        customStatus: null,
      });

      this.logger.log(`Broadcasted online presence for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error in handleConnection: ${error.message}`);
      client.disconnect();
    }
  }

  private extractToken(client: Socket): string | null {
    // Try multiple token locations
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      return authToken;
    }

    const queryToken = client.handshake.query?.token as string;
    if (queryToken) {
      return queryToken;
    }

    const authHeader = client.handshake.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const userId = client.data.user?.id;

    // Remove socket from user's sockets
    this.userSockets.forEach((sockets, uid) => {
      const index = sockets.indexOf(client.id);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(uid);

          // Broadcast user offline status when last socket disconnects
          if (uid === userId) {
            this.server.emit('presence:update', {
              userId: uid,
              status: 'offline',
              customStatus: null,
            });

            this.logger.log(`Broadcasted offline presence for user ${uid}`);
          }
        }
      }
    });
  }

  /**
   * Send message (real-time)
   */
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; message: CreateMessageDto },
  ) {
    try {
      const message = await this.messagesService.sendMessage(
        data.userId,
        data.message,
      );

      // Broadcast to conversation room
      this.server
        .to(`conversation:${data.message.conversationId}`)
        .emit('message:new', message);

      return { success: true, data: message };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Join conversation room
   */
  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
    this.logger.log(
      `Client ${client.id} joined conversation ${data.conversationId}`,
    );
    return { success: true, message: 'Joined conversation' };
  }

  /**
   * Leave conversation room
   */
  @SubscribeMessage('conversation:leave')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    this.logger.log(
      `Client ${client.id} left conversation ${data.conversationId}`,
    );
    return { success: true, message: 'Left conversation' };
  }

  /**
   * Typing indicator
   */
  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.user.id;
    const username = client.data.user.username;

    // Broadcast typing start to other users in conversation
    client
      .to(`conversation:${data.conversationId}`)
      .emit('typing:start', {
        userId,
        username,
        conversationId: data.conversationId,
        avatarUrl: null, // Can be added from user data
      });

    return { success: true };
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.user.id;

    // Broadcast typing stop to other users in conversation
    client
      .to(`conversation:${data.conversationId}`)
      .emit('typing:stop', {
        userId,
        conversationId: data.conversationId,
      });

    return { success: true };
  }

  /**
   * Presence: Update user's presence status
   */
  @SubscribeMessage('presence:update')
  async handlePresenceUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { status: string; customStatus?: string },
  ) {
    const userId = client.data.user.id;

    this.logger.log(`Presence update from ${userId}: ${data.status}`);

    // Broadcast presence update to all connected clients
    this.server.emit('presence:update', {
      userId,
      status: data.status,
      customStatus: data.customStatus || null,
    });

    return { success: true };
  }

  /**
   * Presence: Subscribe to specific users' presence updates
   */
  @SubscribeMessage('presence:subscribe')
  async handlePresenceSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userIds: string[] },
  ) {
    const userId = client.data.user.id;

    this.logger.log(`User ${userId} subscribing to presence for ${data.userIds.length} users`);

    // Send current presence status for subscribed users
    // In a real implementation, you would query the database for current presence
    // For now, we'll send online status for all connected users
    const presenceUpdates = data.userIds
      .filter(uid => this.userSockets.has(uid))
      .map(uid => ({
        userId: uid,
        status: 'online',
        customStatus: null,
      }));

    if (presenceUpdates.length > 0) {
      client.emit('presence:batch', presenceUpdates);
    }

    return { success: true, subscribedCount: data.userIds.length };
  }

  /**
   * Presence: Unsubscribe from presence updates
   */
  @SubscribeMessage('presence:unsubscribe')
  async handlePresenceUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userIds: string[] },
  ) {
    const userId = client.data.user.id;

    this.logger.log(`User ${userId} unsubscribing from presence for ${data.userIds.length} users`);

    return { success: true, unsubscribedCount: data.userIds.length };
  }

  /**
   * Message reaction (real-time)
   */
  @SubscribeMessage('message:react')
  async handleMessageReact(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; messageId: string; reaction: MessageReactionDto },
  ) {
    try {
      const reaction = await this.messagesService.addReaction(
        data.userId,
        data.messageId,
        data.reaction,
      );

      // Get message to find conversation ID
      const message = await this.messagesService.getMessageById(data.userId, data.messageId);

      // Broadcast reaction to conversation
      this.server
        .to(`conversation:${message.conversationId}`)
        .emit('message:reaction', {
          messageId: data.messageId,
          conversationId: message.conversationId,
          reaction,
        });

      return { success: true, data: reaction };
    } catch (error) {
      this.logger.error(`Error adding reaction: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Message read receipt (real-time)
   */
  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; messageId: string },
  ) {
    try {
      const readReceipt = await this.messagesService.markAsRead(
        data.userId,
        data.messageId,
      );

      // Only emit notification if a read receipt was created (not own message)
      if ('readAt' in readReceipt) {
        // Get message to find conversation ID and sender
        const message = await this.messagesService.getMessageById(data.userId, data.messageId);

        // Notify message sender
        this.server
          .to(`user:${message.senderId}`)
          .emit('message:read:receipt', {
            messageId: data.messageId,
            userId: data.userId,
            readAt: readReceipt.readAt,
          });
      }

      return { success: true, data: readReceipt };
    } catch (error) {
      this.logger.error(`Error marking message as read: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper: Emit event to specific users
   */
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Helper: Emit event to conversation participants
   */
  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }
}
