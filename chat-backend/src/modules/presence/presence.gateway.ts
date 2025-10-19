import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '@modules/auth/guards/ws-jwt.guard';
import { PresenceService } from './presence.service';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { TypingIndicatorDto } from './dto/typing-indicator.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/presence',
})
@UseGuards(WsJwtGuard)
export class PresenceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly presenceService: PresenceService) {}

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    try {
      const userId = client.data.user?.id;
      const deviceId = client.id;

      if (!userId) {
        client.disconnect();
        return;
      }

      // Set user online
      const presence = await this.presenceService.setOnline(
        userId,
        deviceId,
        'web', // Default to web, can be passed from client
      );

      // Join user-specific room
      client.join(`user:${userId}`);

      // Broadcast presence update to all connected clients
      this.server.emit('presence:update', {
        userId,
        status: presence.status,
        customStatus: presence.customStatus,
        lastSeenAt: presence.lastSeenAt,
      });

      console.log(`User ${userId} connected with device ${deviceId}`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  async handleDisconnect(client: Socket) {
    try {
      const userId = client.data.user?.id;
      const deviceId = client.id;

      if (!userId) {
        return;
      }

      // Set user offline for this device
      const presence = await this.presenceService.setOffline(userId, deviceId);

      // Leave user-specific room
      client.leave(`user:${userId}`);

      // Broadcast presence update
      this.server.emit('presence:update', {
        userId,
        status: presence.status,
        customStatus: presence.customStatus,
        lastSeenAt: presence.lastSeenAt,
      });

      console.log(`User ${userId} disconnected device ${deviceId}`);
    } catch (error) {
      console.error('Disconnection error:', error);
    }
  }

  /**
   * Update presence status
   */
  @SubscribeMessage('presence:update')
  async handlePresenceUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() updateDto: UpdatePresenceDto,
  ) {
    try {
      const userId = client.data.user?.id;

      if (!userId) {
        return { error: 'Unauthorized' };
      }

      const presence = await this.presenceService.updatePresence(
        userId,
        updateDto,
      );

      // Broadcast to all clients
      this.server.emit('presence:update', {
        userId,
        status: presence.status,
        customStatus: presence.customStatus,
        lastSeenAt: presence.lastSeenAt,
      });

      return { success: true, data: presence };
    } catch (error) {
      console.error('Presence update error:', error);
      return { error: error.message };
    }
  }

  /**
   * Handle typing indicator
   */
  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() typingDto: TypingIndicatorDto,
  ) {
    try {
      const userId = client.data.user?.id;

      if (!userId) {
        return { error: 'Unauthorized' };
      }

      await this.presenceService.startTyping(userId, typingDto.conversationId);

      // Broadcast to conversation room
      this.server
        .to(`conversation:${typingDto.conversationId}`)
        .emit('typing:start', {
          userId,
          conversationId: typingDto.conversationId,
        });

      return { success: true };
    } catch (error) {
      console.error('Typing start error:', error);
      return { error: error.message };
    }
  }

  /**
   * Handle stop typing
   */
  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() typingDto: TypingIndicatorDto,
  ) {
    try {
      const userId = client.data.user?.id;

      if (!userId) {
        return { error: 'Unauthorized' };
      }

      await this.presenceService.stopTyping(userId, typingDto.conversationId);

      // Broadcast to conversation room
      this.server
        .to(`conversation:${typingDto.conversationId}`)
        .emit('typing:stop', {
          userId,
          conversationId: typingDto.conversationId,
        });

      return { success: true };
    } catch (error) {
      console.error('Typing stop error:', error);
      return { error: error.message };
    }
  }

  /**
   * Handle activity ping (to prevent auto-away)
   */
  @SubscribeMessage('activity:ping')
  async handleActivityPing(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.user?.id;
      const deviceId = client.id;

      if (!userId) {
        return { error: 'Unauthorized' };
      }

      await this.presenceService.updateActivity(userId, deviceId);

      return { success: true };
    } catch (error) {
      console.error('Activity ping error:', error);
      return { error: error.message };
    }
  }

  /**
   * Join conversation room for typing indicators
   */
  @SubscribeMessage('conversation:join')
  async handleConversationJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
    return { success: true };
  }

  /**
   * Leave conversation room
   */
  @SubscribeMessage('conversation:leave')
  async handleConversationLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    return { success: true };
  }
}
