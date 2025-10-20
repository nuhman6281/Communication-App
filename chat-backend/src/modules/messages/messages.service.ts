import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull, In } from 'typeorm';
import { Message } from './entities/message.entity';
import { MessageReaction } from './entities/message-reaction.entity';
import { MessageRead } from './entities/message-read.entity';
import { MessageEditHistory } from './entities/message-edit-history.entity';
import { PinnedMessage } from './entities/pinned-message.entity';
import { Conversation } from '@modules/conversations/entities/conversation.entity';
import { ConversationParticipant } from '@modules/conversations/entities/conversation-participant.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessageReactionDto } from './dto/message-reaction.dto';
import { ForwardMessageDto } from './dto/forward-message.dto';
import { MessagesGateway } from './messages.gateway';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(MessageReaction)
    private readonly reactionRepository: Repository<MessageReaction>,
    @InjectRepository(MessageRead)
    private readonly readRepository: Repository<MessageRead>,
    @InjectRepository(MessageEditHistory)
    private readonly editHistoryRepository: Repository<MessageEditHistory>,
    @InjectRepository(PinnedMessage)
    private readonly pinnedMessageRepository: Repository<PinnedMessage>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private readonly participantRepository: Repository<ConversationParticipant>,
    @Inject(forwardRef(() => MessagesGateway))
    private readonly messagesGateway: MessagesGateway,
  ) {}

  /**
   * Send a message
   */
  async sendMessage(userId: string, createMessageDto: CreateMessageDto) {
    const { conversationId, content, messageType, replyToId, metadata } =
      createMessageDto;

    // Verify user is participant in conversation
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId, leftAt: IsNull() },
    });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Verify replyTo message exists if provided
    if (replyToId) {
      const replyToMessage = await this.messageRepository.findOne({
        where: { id: replyToId, conversationId },
      });

      if (!replyToMessage) {
        throw new NotFoundException('Reply-to message not found');
      }
    }

    // Create message
    const message = this.messageRepository.create({
      conversationId,
      senderId: userId,
      content,
      messageType,
      replyToId,
      metadata,
    });

    await this.messageRepository.save(message);

    // Update conversation last message
    await this.conversationRepository.update(conversationId, {
      lastMessageId: message.id,
      lastMessageAt: message.createdAt,
    });

    // Load message with sender info
    const savedMessage = await this.messageRepository.findOne({
      where: { id: message.id },
      relations: ['sender', 'replyTo'],
    });

    // Emit WebSocket event to notify other users in real-time
    this.messagesGateway.emitToConversation(
      conversationId,
      'message:new',
      savedMessage,
    );

    return savedMessage;
  }

  /**
   * Get messages in a conversation (paginated)
   */
  async getMessages(userId: string, getMessagesDto: GetMessagesDto) {
    const { conversationId, page = 1, limit = 50, beforeMessageId } =
      getMessagesDto;

    // Verify user is participant
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId },
    });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.replyTo', 'replyTo')
      .leftJoinAndSelect('replyTo.sender', 'replyToSender')
      .where('message.conversationId = :conversationId', { conversationId })
      .andWhere('message.isDeleted = :isDeleted', { isDeleted: false });

    // Pagination: load messages before a specific message
    if (beforeMessageId) {
      const beforeMessage = await this.messageRepository.findOne({
        where: { id: beforeMessageId },
      });

      if (beforeMessage) {
        queryBuilder.andWhere('message.createdAt < :beforeTime', {
          beforeTime: beforeMessage.createdAt,
        });
      }
    }

    queryBuilder
      .orderBy('message.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [messages, total] = await queryBuilder.getManyAndCount();

    // Load reactions for each message
    const messageIds = messages.map((m) => m.id);
    let reactions: MessageReaction[] = [];

    if (messageIds.length > 0) {
      reactions = await this.reactionRepository.find({
        where: { messageId: In(messageIds) },
        relations: ['user'],
      });
    }

    // Load pinned messages for this conversation
    const pinnedMessages = await this.pinnedMessageRepository.find({
      where: { conversationId },
      select: ['messageId'],
    });
    const pinnedMessageIds = new Set(pinnedMessages.map((pm) => pm.messageId));

    // Attach reactions and isPinned to messages
    const messagesWithReactions = messages.map((message) => {
      const messageReactions = reactions.filter((r) => r.messageId === message.id);
      // Manually assign reactions and isPinned to the entity
      (message as any).reactions = messageReactions;
      (message as any).isPinned = pinnedMessageIds.has(message.id);
      return message;
    });

    return {
      messages: messagesWithReactions.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single message by ID
   */
  async getMessageById(userId: string, messageId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'replyTo'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify user is participant
    const participant = await this.participantRepository.findOne({
      where: { conversationId: message.conversationId, userId },
    });

    if (!participant) {
      throw new ForbiddenException('Access denied');
    }

    return message;
  }

  /**
   * Edit message (sender only)
   */
  async editMessage(
    userId: string,
    messageId: string,
    updateMessageDto: UpdateMessageDto,
  ) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Only the sender can edit this message');
    }

    if (message.isDeleted) {
      throw new BadRequestException('Cannot edit a deleted message');
    }

    // Save current content to edit history before updating
    const editHistory = this.editHistoryRepository.create({
      messageId: message.id,
      content: message.content,
      metadata: message.metadata,
      editedAt: new Date(),
    });

    await this.editHistoryRepository.save(editHistory);

    // Update message
    message.content = updateMessageDto.content;
    message.isEdited = true;

    await this.messageRepository.save(message);

    const updatedMessage = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'replyTo'],
    });

    // Emit WebSocket event to notify other users in real-time
    this.messagesGateway.emitToConversation(
      message.conversationId,
      'message:updated',
      updatedMessage,
    );

    return updatedMessage;
  }

  /**
   * Delete message (sender only)
   */
  async deleteMessage(userId: string, messageId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Only the sender can delete this message');
    }

    // Soft delete
    message.isDeleted = true;
    message.content = undefined; // Remove content for privacy

    await this.messageRepository.save(message);

    // Emit WebSocket event to notify other users in real-time
    this.messagesGateway.emitToConversation(
      message.conversationId,
      'message:deleted',
      { messageId, conversationId: message.conversationId },
    );

    return { message: 'Message deleted successfully' };
  }

  /**
   * Add reaction to message
   */
  async addReaction(
    userId: string,
    messageId: string,
    reactionDto: MessageReactionDto,
  ) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify user is participant
    const participant = await this.participantRepository.findOne({
      where: { conversationId: message.conversationId, userId },
    });

    if (!participant) {
      throw new ForbiddenException('Access denied');
    }

    // Check if reaction already exists
    const existingReaction = await this.reactionRepository.findOne({
      where: {
        messageId,
        userId,
        emoji: reactionDto.emoji,
      },
    });

    if (existingReaction) {
      return existingReaction; // Already reacted with this emoji
    }

    // Create reaction
    const reaction = this.reactionRepository.create({
      messageId,
      userId,
      emoji: reactionDto.emoji,
    });

    await this.reactionRepository.save(reaction);

    return this.reactionRepository.findOne({
      where: { id: reaction.id },
      relations: ['user'],
    });
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(userId: string, messageId: string, emoji: string) {
    const reaction = await this.reactionRepository.findOne({
      where: { messageId, userId, emoji },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.reactionRepository.remove(reaction);

    return { message: 'Reaction removed successfully' };
  }

  /**
   * Mark message as read
   */
  async markAsRead(userId: string, messageId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Don't mark own messages as read
    if (message.senderId === userId) {
      return { message: 'Own message, no read receipt created' };
    }

    // Check if already marked as read
    const existingRead = await this.readRepository.findOne({
      where: { messageId, userId },
    });

    if (existingRead) {
      return existingRead;
    }

    // Create read receipt
    const read = this.readRepository.create({
      messageId,
      userId,
      conversationId: message.conversationId,
      readAt: new Date(),
    });

    await this.readRepository.save(read);

    return read;
  }

  /**
   * Get read receipts for a message
   */
  async getReadReceipts(userId: string, messageId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify user is participant
    const participant = await this.participantRepository.findOne({
      where: { conversationId: message.conversationId, userId },
    });

    if (!participant) {
      throw new ForbiddenException('Access denied');
    }

    const reads = await this.readRepository.find({
      where: { messageId },
      relations: ['user'],
      order: { readAt: 'DESC' },
    });

    return {
      messageId,
      readCount: reads.length,
      reads,
    };
  }

  /**
   * Forward message to multiple conversations
   */
  async forwardMessage(
    userId: string,
    messageId: string,
    forwardMessageDto: ForwardMessageDto,
  ) {
    // Get original message
    const originalMessage = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!originalMessage) {
      throw new NotFoundException('Message not found');
    }

    // Verify user has access to the original message
    const originalParticipant = await this.participantRepository.findOne({
      where: {
        conversationId: originalMessage.conversationId,
        userId,
        leftAt: IsNull(),
      },
    });

    if (!originalParticipant) {
      throw new ForbiddenException('Access denied to original message');
    }

    // Cannot forward deleted messages
    if (originalMessage.isDeleted) {
      throw new BadRequestException('Cannot forward a deleted message');
    }

    const forwardedMessages = [];

    // Forward to each conversation
    for (const targetConversationId of forwardMessageDto.conversationIds) {
      // Verify user is participant in target conversation
      const targetParticipant = await this.participantRepository.findOne({
        where: {
          conversationId: targetConversationId,
          userId,
          leftAt: IsNull(),
        },
      });

      if (!targetParticipant) {
        throw new ForbiddenException(
          `You are not a participant in conversation ${targetConversationId}`,
        );
      }

      // Create forwarded message
      const forwardedMessage = this.messageRepository.create({
        conversationId: targetConversationId,
        senderId: userId,
        content: originalMessage.content,
        messageType: originalMessage.messageType,
        metadata: {
          ...originalMessage.metadata,
          forwarded: true,
          originalMessageId: originalMessage.id,
          originalSenderId: originalMessage.senderId,
          originalSenderName: originalMessage.sender?.username,
        },
      });

      await this.messageRepository.save(forwardedMessage);

      // Update conversation last message
      await this.conversationRepository.update(targetConversationId, {
        lastMessageId: forwardedMessage.id,
        lastMessageAt: forwardedMessage.createdAt,
      });

      // Load complete message with relations
      const completeMessage = await this.messageRepository.findOne({
        where: { id: forwardedMessage.id },
        relations: ['sender'],
      });

      // Emit WebSocket event for the forwarded message
      this.messagesGateway.emitToConversation(
        targetConversationId,
        'message:new',
        completeMessage,
      );

      forwardedMessages.push(completeMessage);
    }

    return {
      message: 'Message forwarded successfully',
      forwardedMessages,
    };
  }

  /**
   * Get edit history for a message
   */
  async getEditHistory(userId: string, messageId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify user is participant
    const participant = await this.participantRepository.findOne({
      where: { conversationId: message.conversationId, userId },
    });

    if (!participant) {
      throw new ForbiddenException('Access denied');
    }

    const history = await this.editHistoryRepository.find({
      where: { messageId },
      order: { editedAt: 'DESC' },
    });

    return {
      messageId,
      currentContent: message.content,
      editCount: history.length,
      history,
    };
  }

  /**
   * Pin a message (simplified - auto-detects conversation)
   */
  async pinMessageSimple(userId: string, messageId: string) {
    // Get message to find conversation
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Call the full pinMessage method with conversationId
    return this.pinMessage(userId, message.conversationId, messageId);
  }

  /**
   * Unpin a message (simplified - auto-detects conversation)
   */
  async unpinMessageSimple(userId: string, messageId: string) {
    // Get message to find conversation
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Call the full unpinMessage method with conversationId
    return this.unpinMessage(userId, message.conversationId, messageId);
  }

  /**
   * Pin a message in a conversation
   */
  async pinMessage(userId: string, conversationId: string, messageId: string) {
    // Verify message exists and belongs to conversation
    const message = await this.messageRepository.findOne({
      where: { id: messageId, conversationId },
    });

    if (!message) {
      throw new NotFoundException('Message not found in this conversation');
    }

    // Verify user is participant
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId, leftAt: IsNull() },
    });

    if (!participant) {
      throw new ForbiddenException('Access denied');
    }

    // Check if already pinned
    const existingPin = await this.pinnedMessageRepository.findOne({
      where: { conversationId, messageId },
    });

    if (existingPin) {
      return existingPin;
    }

    // Create pin
    const pinnedMessage = this.pinnedMessageRepository.create({
      conversationId,
      messageId,
      pinnedById: userId,
      pinnedAt: new Date(),
    });

    await this.pinnedMessageRepository.save(pinnedMessage);

    return this.pinnedMessageRepository.findOne({
      where: { id: pinnedMessage.id },
      relations: ['message', 'pinnedBy'],
    });
  }

  /**
   * Unpin a message from a conversation
   */
  async unpinMessage(
    userId: string,
    conversationId: string,
    messageId: string,
  ) {
    const pinnedMessage = await this.pinnedMessageRepository.findOne({
      where: { conversationId, messageId },
    });

    if (!pinnedMessage) {
      throw new NotFoundException('Pinned message not found');
    }

    // Verify user is participant
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId, leftAt: IsNull() },
    });

    if (!participant) {
      throw new ForbiddenException('Access denied');
    }

    await this.pinnedMessageRepository.remove(pinnedMessage);

    return { message: 'Message unpinned successfully' };
  }

  /**
   * Get all pinned messages in a conversation
   */
  async getPinnedMessages(userId: string, conversationId: string) {
    // Verify user is participant
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId },
    });

    if (!participant) {
      throw new ForbiddenException('Access denied');
    }

    const pinnedMessages = await this.pinnedMessageRepository.find({
      where: { conversationId },
      relations: ['message', 'message.sender', 'pinnedBy'],
      order: { pinnedAt: 'DESC' },
    });

    return {
      conversationId,
      count: pinnedMessages.length,
      pinnedMessages,
    };
  }
}
