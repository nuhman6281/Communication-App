import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

interface Message {
  id: string;
  tempId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  metadata?: Record<string, any>;
}

interface TypingStatus {
  userId: string;
  username: string;
  conversationId: string;
  isTyping: boolean;
  timestamp: Date;
}

export class ChatHandler {
  private typingUsers: Map<string, TypingStatus>;
  private typingTimeouts: Map<string, NodeJS.Timeout>;

  constructor(private io: Server) {
    this.typingUsers = new Map();
    this.typingTimeouts = new Map();
  }

  /**
   * Handle sending a message (real-time relay)
   */
  async handleMessage(
    socket: Socket,
    data: {
      conversationId: string;
      content: string;
      messageType: string;
      tempId: string;
      metadata?: Record<string, any>;
    }
  ) {
    try {
      const message: Message = {
        id: this.generateMessageId(),
        tempId: data.tempId,
        conversationId: data.conversationId,
        senderId: socket.data.userId,
        senderName: socket.data.username,
        content: data.content,
        messageType: data.messageType as Message['messageType'],
        timestamp: new Date(),
        status: 'sent',
        metadata: data.metadata,
      };

      // Emit to all users in the conversation (including sender for multi-device sync)
      this.io.to(`conversation:${data.conversationId}`).emit('message:new', message);

      // Send acknowledgment to sender
      socket.emit('message:sent', {
        tempId: data.tempId,
        messageId: message.id,
        timestamp: message.timestamp,
      });

      // Clear typing indicator for this user
      this.clearTyping(socket, data.conversationId);

      logger.info(`Message sent in conversation ${data.conversationId} by ${socket.data.username}`);
    } catch (error) {
      logger.error(`Failed to handle message: ${error}`);
      socket.emit('message:error', {
        tempId: data.tempId,
        error: 'Failed to send message',
      });
    }
  }

  /**
   * Handle typing indicators
   */
  handleTyping(
    socket: Socket,
    data: { conversationId: string; isTyping: boolean }
  ) {
    const { conversationId, isTyping } = data;
    const userId = socket.data.userId;
    const username = socket.data.username;
    const typingKey = `${userId}:${conversationId}`;

    if (isTyping) {
      // Add to typing users
      this.typingUsers.set(typingKey, {
        userId,
        username,
        conversationId,
        isTyping: true,
        timestamp: new Date(),
      });

      // Clear existing timeout
      const existingTimeout = this.typingTimeouts.get(typingKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout to auto-clear typing after 5 seconds
      const timeout = setTimeout(() => {
        this.clearTyping(socket, conversationId);
      }, 5000);

      this.typingTimeouts.set(typingKey, timeout);

      // Broadcast to other users in conversation
      socket.to(`conversation:${conversationId}`).emit('user:typing', {
        userId,
        username,
        conversationId,
        isTyping: true,
      });
    } else {
      this.clearTyping(socket, conversationId);
    }
  }

  /**
   * Handle read receipts
   */
  handleRead(
    socket: Socket,
    data: { conversationId: string; messageIds: string[] }
  ) {
    const { conversationId, messageIds } = data;

    // Broadcast read receipt to other users in conversation
    socket.to(`conversation:${conversationId}`).emit('messages:read', {
      userId: socket.data.userId,
      username: socket.data.username,
      conversationId,
      messageIds,
      timestamp: new Date(),
    });

    logger.debug(`Messages marked as read in conversation ${conversationId} by ${socket.data.username}`);
  }

  /**
   * Clear typing indicator for a user
   */
  private clearTyping(socket: Socket, conversationId: string) {
    const userId = socket.data.userId;
    const typingKey = `${userId}:${conversationId}`;

    // Clear from typing users
    this.typingUsers.delete(typingKey);

    // Clear timeout
    const timeout = this.typingTimeouts.get(typingKey);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(typingKey);
    }

    // Broadcast typing stopped
    socket.to(`conversation:${conversationId}`).emit('user:typing', {
      userId,
      username: socket.data.username,
      conversationId,
      isTyping: false,
    });
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get active typing users for a conversation
   */
  public getTypingUsers(conversationId: string): TypingStatus[] {
    const typingInConversation: TypingStatus[] = [];

    this.typingUsers.forEach((status) => {
      if (status.conversationId === conversationId && status.isTyping) {
        typingInConversation.push(status);
      }
    });

    return typingInConversation;
  }
}