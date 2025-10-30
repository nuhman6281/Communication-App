import { Server } from 'socket.io';
import { logger } from '../utils/logger';

interface Room {
  id: string;
  participants: Set<string>;
  createdAt: Date;
  type: 'call' | 'conversation' | 'channel';
  metadata?: Record<string, any>;
}

export class RoomService {
  private rooms: Map<string, Room>;

  constructor(private io: Server) {
    this.rooms = new Map();
  }

  /**
   * Create a new room
   */
  async createRoom(roomId: string, participants: string[], type: 'call' | 'conversation' | 'channel' = 'call', metadata?: Record<string, any>): Promise<Room> {
    const room: Room = {
      id: roomId,
      participants: new Set(participants),
      createdAt: new Date(),
      type,
      metadata,
    };

    this.rooms.set(roomId, room);

    logger.info(`Room created: ${roomId} with ${participants.length} participants`);
    return room;
  }

  /**
   * Add participant to room
   */
  async addParticipant(roomId: string, userId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      logger.warn(`Attempted to add participant to non-existent room: ${roomId}`);
      return false;
    }

    room.participants.add(userId);
    logger.info(`Participant ${userId} added to room ${roomId}`);
    return true;
  }

  /**
   * Remove participant from room
   */
  async removeParticipant(roomId: string, userId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    room.participants.delete(userId);
    logger.info(`Participant ${userId} removed from room ${roomId}`);

    // Delete room if empty
    if (room.participants.size === 0) {
      await this.deleteRoom(roomId);
    }

    return true;
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomId: string): Promise<boolean> {
    const deleted = this.rooms.delete(roomId);
    if (deleted) {
      logger.info(`Room deleted: ${roomId}`);
    }
    return deleted;
  }

  /**
   * Get room by ID
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Get all rooms
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Get rooms for a user
   */
  getUserRooms(userId: string): Room[] {
    return Array.from(this.rooms.values()).filter(room =>
      room.participants.has(userId)
    );
  }

  /**
   * Check if user is in room
   */
  isUserInRoom(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.participants.has(userId) : false;
  }

  /**
   * Get room participants
   */
  getRoomParticipants(roomId: string): string[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.participants) : [];
  }

  /**
   * Update room metadata
   */
  updateRoomMetadata(roomId: string, metadata: Record<string, any>): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    room.metadata = { ...room.metadata, ...metadata };
    return true;
  }

  /**
   * Get room count
   */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Clean up old rooms (optional maintenance)
   */
  cleanupOldRooms(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = new Date();
    let cleaned = 0;

    this.rooms.forEach((room, roomId) => {
      const age = now.getTime() - room.createdAt.getTime();
      if (age > maxAgeMs && room.participants.size === 0) {
        this.rooms.delete(roomId);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} old rooms`);
    }

    return cleaned;
  }
}