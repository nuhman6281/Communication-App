import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Story } from '../entities/story.entity';
import { StoryView } from '../entities/story-view.entity';
import { StoryReply } from '../entities/story-reply.entity';

@WebSocketGateway({
  namespace: 'stories',
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class StoriesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(StoriesGateway.name);
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  /**
   * Handle client connection
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected to stories namespace: ${client.id}`);
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
      this.logger.log(`Client disconnected from stories namespace: ${client.id}, User: ${userId}`);
    } else {
      this.logger.log(`Client disconnected from stories namespace: ${client.id}`);
    }
  }

  /**
   * Broadcast new story to all connected users
   */
  broadcastNewStory(story: Story) {
    this.server.emit('newStory', story);
    this.logger.debug(`Broadcasted new story from user ${story.userId}`);
  }

  /**
   * Broadcast deleted story to all connected users
   */
  broadcastDeletedStory(storyId: string, userId: string) {
    this.server.emit('deletedStory', { storyId, userId });
    this.logger.debug(`Broadcasted deleted story ${storyId}`);
  }

  /**
   * Send new story view notification to story owner
   */
  sendNewStoryView(ownerId: string, storyId: string, view: StoryView) {
    this.server.to(`user:${ownerId}`).emit('newStoryView', {
      storyId,
      view,
    });
    this.logger.debug(`Sent new story view notification to user ${ownerId}`);
  }

  /**
   * Send new story reply notification to story owner
   */
  sendNewStoryReply(ownerId: string, storyId: string, reply: StoryReply) {
    this.server.to(`user:${ownerId}`).emit('newStoryReply', {
      storyId,
      reply,
    });
    this.logger.debug(`Sent new story reply notification to user ${ownerId}`);
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
