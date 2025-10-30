import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

interface UserPresence {
  userId: string;
  username: string;
  status: 'online' | 'away' | 'do_not_disturb' | 'offline';
  lastSeen: Date;
  socketIds: Set<string>;
}

export class ConnectionHandler {
  private userPresence: Map<string, UserPresence>;
  private socketToUser: Map<string, string>; // socketId -> userId

  constructor(private io: Server) {
    this.userPresence = new Map();
    this.socketToUser = new Map();
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket: Socket) {
    const userId = socket.data.userId;
    const username = socket.data.username;

    // Track socket-to-user mapping
    this.socketToUser.set(socket.id, userId);

    // Join user's personal room for direct messages
    socket.join(`user:${userId}`);

    // Update user presence
    if (!this.userPresence.has(userId)) {
      this.userPresence.set(userId, {
        userId,
        username,
        status: 'online',
        lastSeen: new Date(),
        socketIds: new Set([socket.id]),
      });
    } else {
      const presence = this.userPresence.get(userId)!;
      presence.socketIds.add(socket.id);
      presence.status = 'online';
      presence.lastSeen = new Date();
    }

    // Broadcast user came online
    socket.broadcast.emit('user:online', {
      userId,
      username,
      status: 'online',
    });

    // Send current online users to the newly connected user
    const onlineUsers = Array.from(this.userPresence.values())
      .filter(p => p.status !== 'offline')
      .map(p => ({
        userId: p.userId,
        username: p.username,
        status: p.status,
      }));

    socket.emit('users:online', onlineUsers);

    logger.info(`User connected: ${username} (${userId}) - Socket: ${socket.id}`);
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnect(socket: Socket) {
    const userId = this.socketToUser.get(socket.id);

    if (!userId) {
      logger.warn(`Unknown socket disconnected: ${socket.id}`);
      return;
    }

    const presence = this.userPresence.get(userId);
    if (presence) {
      presence.socketIds.delete(socket.id);

      // If user has no more active connections, mark as offline
      if (presence.socketIds.size === 0) {
        presence.status = 'offline';
        presence.lastSeen = new Date();

        // Broadcast user went offline
        socket.broadcast.emit('user:offline', {
          userId,
          username: presence.username,
          lastSeen: presence.lastSeen,
        });

        // Optionally remove from presence map after some time
        setTimeout(() => {
          if (presence.socketIds.size === 0) {
            this.userPresence.delete(userId);
          }
        }, 60000); // Remove after 1 minute if still offline
      }
    }

    // Clean up socket mapping
    this.socketToUser.delete(socket.id);

    logger.info(`User disconnected: ${socket.data.username} (${userId}) - Socket: ${socket.id}`);
  }

  /**
   * Handle joining a room (conversation, call, etc.)
   */
  handleJoinRoom(socket: Socket, data: { roomId: string; roomType: 'conversation' | 'call' | 'channel' }) {
    const { roomId, roomType } = data;
    const roomName = `${roomType}:${roomId}`;

    socket.join(roomName);

    // Notify others in the room
    socket.to(roomName).emit('user:joined-room', {
      userId: socket.data.userId,
      username: socket.data.username,
      roomId,
      roomType,
    });

    logger.info(`User ${socket.data.username} joined ${roomName}`);
  }

  /**
   * Handle leaving a room
   */
  handleLeaveRoom(socket: Socket, data: { roomId: string; roomType: 'conversation' | 'call' | 'channel' }) {
    const { roomId, roomType } = data;
    const roomName = `${roomType}:${roomId}`;

    socket.leave(roomName);

    // Notify others in the room
    socket.to(roomName).emit('user:left-room', {
      userId: socket.data.userId,
      username: socket.data.username,
      roomId,
      roomType,
    });

    logger.info(`User ${socket.data.username} left ${roomName}`);
  }

  /**
   * Handle presence updates (status changes)
   */
  handlePresenceUpdate(socket: Socket, data: { status: 'online' | 'away' | 'do_not_disturb' | 'offline' }) {
    const userId = socket.data.userId;
    const presence = this.userPresence.get(userId);

    if (presence) {
      presence.status = data.status;
      presence.lastSeen = new Date();

      // Broadcast presence update to all users
      this.io.emit('user:presence-updated', {
        userId,
        username: presence.username,
        status: data.status,
        lastSeen: presence.lastSeen,
      });

      logger.info(`User ${presence.username} updated status to ${data.status}`);
    }
  }

  /**
   * Get count of authenticated users
   */
  getAuthenticatedUsersCount(): number {
    return this.userPresence.size;
  }

  /**
   * Get count of rooms
   */
  getRoomsCount(): number {
    return this.io.sockets.adapter.rooms.size;
  }

  /**
   * Get online users
   */
  getOnlineUsers(): UserPresence[] {
    return Array.from(this.userPresence.values()).filter(p => p.status !== 'offline');
  }
}