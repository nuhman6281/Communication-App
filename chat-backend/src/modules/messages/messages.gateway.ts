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
import { Logger, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageReactionDto } from './dto/message-reaction.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this properly in production
    credentials: true,
  },
  namespace: '/messages',
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private userSockets = new Map<string, string[]>(); // userId -> [socketIds]

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Extract user ID from socket handshake (you should implement proper JWT auth)
    const userId = client.handshake.auth.userId || client.handshake.query.userId;

    if (userId) {
      if (!this.userSockets.has(userId as string)) {
        this.userSockets.set(userId as string, []);
      }
      this.userSockets.get(userId as string)?.push(client.id);

      // Join user's personal room
      client.join(`user:${userId}`);
      this.logger.log(`User ${userId} connected with socket ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove socket from user's sockets
    this.userSockets.forEach((sockets, userId) => {
      const index = sockets.indexOf(client.id);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
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
    @MessageBody() data: { conversationId: string; userId: string; username: string },
  ) {
    client
      .to(`conversation:${data.conversationId}`)
      .emit('typing:user', { userId: data.userId, username: data.username, isTyping: true });

    return { success: true };
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string; username: string },
  ) {
    client
      .to(`conversation:${data.conversationId}`)
      .emit('typing:user', { userId: data.userId, username: data.username, isTyping: false });

    return { success: true };
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
        .emit('message:reaction:new', {
          messageId: data.messageId,
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
