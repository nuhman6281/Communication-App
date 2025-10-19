import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '@modules/auth/guards/ws-jwt.guard';
import { Notification } from './entities/notification.entity';

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  /**
   * Handle client connection
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const userSocketIds = this.userSockets.get(userId);
      if (userSocketIds) {
        userSocketIds.delete(client.id);
        if (userSocketIds.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.logger.log(`Client disconnected: ${client.id}, User: ${userId}`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  /**
   * Client registers their user ID to receive notifications
   */
  @SubscribeMessage('register')
  @UseGuards(WsJwtGuard)
  handleRegister(
    @ConnectedSocket() client: Socket,
    payload: { userId: string },
  ) {
    const { userId } = payload;

    // Store user's socket ID
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    // Store userId in socket data for later use
    client.data.userId = userId;

    // Join user-specific room
    client.join(`user:${userId}`);

    this.logger.log(`User ${userId} registered with socket ${client.id}`);

    return { success: true, message: 'Registered for notifications' };
  }

  /**
   * Send a notification to a specific user
   */
  sendNotificationToUser(userId: string, notification: Notification) {
    this.server.to(`user:${userId}`).emit('notification', notification);
    this.logger.debug(`Sent notification to user ${userId}`);
  }

  /**
   * Send unread count update to a specific user
   */
  sendUnreadCountUpdate(userId: string, unreadCount: number) {
    this.server.to(`user:${userId}`).emit('unreadCount', { count: unreadCount });
    this.logger.debug(`Sent unread count ${unreadCount} to user ${userId}`);
  }

  /**
   * Broadcast a system-wide notification to all connected users
   */
  broadcastSystemNotification(notification: Notification) {
    this.server.emit('systemNotification', notification);
    this.logger.log('Broadcasted system notification to all users');
  }

  /**
   * Send notification to multiple users
   */
  sendNotificationToUsers(userIds: string[], notification: Notification) {
    userIds.forEach((userId) => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  /**
   * Check if a user is currently connected
   */
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * Get count of active connections for a user
   */
  getUserConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  /**
   * Get all connected user IDs
   */
  getConnectedUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
