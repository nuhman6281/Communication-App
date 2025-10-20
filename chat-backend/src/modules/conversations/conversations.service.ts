import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { User } from '@modules/users/entities/user.entity';
import { BlockedUser } from '@modules/users/entities/blocked-users.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { GetConversationsDto } from './dto/get-conversations.dto';
import { ConversationType, UserRole } from '@common/constants';
import { Message } from '@modules/messages/entities/message.entity';
import { MessageReaction } from '@modules/messages/entities/message-reaction.entity';
import { PinnedMessage } from '@modules/messages/entities/pinned-message.entity';
import { ChannelSubscriber, ChannelSubscriberStatus } from '@modules/channels/entities/channel-subscriber.entity';
import { Channel } from '@modules/channels/entities/channel.entity';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private readonly participantRepository: Repository<ConversationParticipant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(BlockedUser)
    private readonly blockedUserRepository: Repository<BlockedUser>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(MessageReaction)
    private readonly reactionRepository: Repository<MessageReaction>,
    @InjectRepository(PinnedMessage)
    private readonly pinnedMessageRepository: Repository<PinnedMessage>,
    @InjectRepository(ChannelSubscriber)
    private readonly channelSubscriberRepository: Repository<ChannelSubscriber>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {}

  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string,
    createConversationDto: CreateConversationDto,
  ) {
    const { type, participantIds, name, description, avatarUrl } = createConversationDto;

    // For channel type, skip participant validation (handled by ChannelsService)
    if (type !== ConversationType.CHANNEL) {
      // Validate participants exist
      const participants = await this.userRepository.find({
        where: { id: In([userId, ...participantIds]), deletedAt: IsNull() },
      });

      if (participants.length !== participantIds.length + 1) {
        throw new BadRequestException('One or more participants not found');
      }

      // Check for blocked users
      await this.validateNoBlockedUsers(userId, participantIds);
    }

    // For direct conversations, check if one already exists
    if (type === ConversationType.DIRECT) {
      if (participantIds.length !== 1) {
        throw new BadRequestException(
          'Direct conversations must have exactly one other participant',
        );
      }

      const existingConversation = await this.findDirectConversation(
        userId,
        participantIds[0],
      );

      if (existingConversation) {
        return existingConversation;
      }
    }

    // Validate name for groups/channels
    if (type !== ConversationType.DIRECT && !name) {
      throw new BadRequestException('Name is required for groups and channels');
    }

    // Create conversation
    const conversation = this.conversationRepository.create({
      type,
      name,
      description,
      avatarUrl,
      createdById: userId,
      isGroup: type === ConversationType.GROUP,
      isChannel: type === ConversationType.CHANNEL,
    });

    await this.conversationRepository.save(conversation);

    // For channels, participants are managed by ChannelsService using ChannelSubscriber
    if (type !== ConversationType.CHANNEL) {
      // Add creator as participant with owner/admin role
      const creatorParticipant = this.participantRepository.create({
        conversationId: conversation.id,
        userId,
        role: type === ConversationType.DIRECT ? UserRole.MEMBER : UserRole.OWNER,
      });

      await this.participantRepository.save(creatorParticipant);

      // Add other participants
      const otherParticipants = participantIds.map((participantId) =>
        this.participantRepository.create({
          conversationId: conversation.id,
          userId: participantId,
          role: UserRole.MEMBER,
          invitedById: userId,
        }),
      );

      await this.participantRepository.save(otherParticipants);
    }

    // For channels, return conversation directly (participants managed by ChannelsService)
    if (type === ConversationType.CHANNEL) {
      return conversation;
    }

    // Load full conversation with participants for non-channel conversations
    return this.getConversationById(userId, conversation.id);
  }

  /**
   * Get user conversations
   */
  async getUserConversations(userId: string, query: GetConversationsDto) {
    const { type, archived = false, pinned = false, page = 1, limit = 20 } = query;

    // Special handling for channels - query channel_subscribers instead of conversation_participants
    if (type === ConversationType.CHANNEL) {
      const queryBuilder = this.conversationRepository
        .createQueryBuilder('conversation')
        .innerJoin('conversation.channel', 'channel')
        .innerJoin('channel.subscribers', 'subscriber')
        .where('subscriber.userId = :userId', { userId })
        .andWhere('subscriber.status = :status', {
          status: ChannelSubscriberStatus.ACTIVE
        })
        .andWhere('conversation.type = :type', { type: ConversationType.CHANNEL });

      // Load channel details and user's subscription info
      queryBuilder
        .leftJoinAndSelect('conversation.channel', 'channelDetails')
        .leftJoin('channelDetails.subscribers', 'userSub', 'userSub.userId = :userId', { userId })
        .addSelect(['userSub.role', 'userSub.status', 'userSub.notificationsEnabled', 'userSub.subscribedAt']);

      // Sort by last message time
      queryBuilder.orderBy('conversation.lastMessageAt', 'ASC', 'NULLS FIRST');
      queryBuilder.addOrderBy('conversation.createdAt', 'ASC');

      // Pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      const [conversations, total] = await queryBuilder.getManyAndCount();

      return {
        items: conversations,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };
    }

    // Original logic for groups and direct conversations
    const queryBuilder = this.participantRepository
      .createQueryBuilder('participant')
      .leftJoinAndSelect('participant.conversation', 'conversation')
      .leftJoinAndSelect('conversation.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'user')
      .where('participant.userId = :userId', { userId })
      .andWhere('participant.leftAt IS NULL');

    // Apply filters
    if (type) {
      queryBuilder.andWhere('conversation.type = :type', { type });
    }

    if (archived !== undefined) {
      queryBuilder.andWhere('participant.isArchived = :archived', { archived });
    }

    if (pinned !== undefined) {
      queryBuilder.andWhere('participant.isPinned = :pinned', { pinned });
    }

    // Sort by pinned first, then oldest messages at top (most recent at bottom)
    queryBuilder.orderBy('participant.isPinned', 'DESC');
    queryBuilder.addOrderBy('conversation.lastMessageAt', 'ASC', 'NULLS FIRST');
    queryBuilder.addOrderBy('conversation.createdAt', 'ASC');

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [participants, total] = await queryBuilder.getManyAndCount();

    const conversations = participants.map((participant) => ({
      ...participant.conversation,
      userParticipant: {
        isMuted: participant.isMuted,
        isArchived: participant.isArchived,
        isPinned: participant.isPinned,
        unreadCount: participant.unreadCount,
        lastReadMessageId: participant.lastReadMessageId,
        lastReadAt: participant.lastReadAt,
      },
      participants: participant.conversation.participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        role: p.role,
        user: {
          id: p.user.id,
          username: p.user.username,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          avatarUrl: p.user.avatarUrl,
          isOnline: p.user.isOnline,
          presenceStatus: p.user.presenceStatus,
        },
      })),
    }));

    return {
      items: conversations,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(userId: string, conversationId: string) {
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId },
      relations: ['conversation', 'conversation.participants', 'conversation.participants.user'],
    });

    if (!participant) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    return {
      ...participant.conversation,
      userParticipant: {
        isMuted: participant.isMuted,
        isArchived: participant.isArchived,
        isPinned: participant.isPinned,
        unreadCount: participant.unreadCount,
        lastReadMessageId: participant.lastReadMessageId,
        lastReadAt: participant.lastReadAt,
        role: participant.role,
      },
      participants: participant.conversation.participants
        .filter((p) => !p.leftAt)
        .map((p) => ({
          id: p.id,
          userId: p.userId,
          role: p.role,
          joinedAt: p.joinedAt,
          user: {
            id: p.user.id,
            username: p.user.username,
            firstName: p.user.firstName,
            lastName: p.user.lastName,
            avatarUrl: p.user.avatarUrl,
            isOnline: p.user.isOnline,
            presenceStatus: p.user.presenceStatus,
          },
        })),
    };
  }

  /**
   * Update conversation
   */
  async updateConversation(
    userId: string,
    conversationId: string,
    updateConversationDto: UpdateConversationDto,
  ) {
    // Check if user is participant with admin/owner role
    await this.validateParticipantRole(conversationId, userId, [
      UserRole.OWNER,
      UserRole.ADMIN,
    ]);

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Cannot update direct conversations
    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException('Cannot update direct conversations');
    }

    Object.assign(conversation, updateConversationDto);
    await this.conversationRepository.save(conversation);

    return this.getConversationById(userId, conversationId);
  }

  /**
   * Add participants to conversation
   */
  async addParticipants(
    userId: string,
    conversationId: string,
    addParticipantDto: AddParticipantDto,
  ) {
    const { userIds, role = UserRole.MEMBER } = addParticipantDto;

    // Validate user is participant with permission
    const userParticipant = await this.validateParticipantRole(conversationId, userId, [
      UserRole.OWNER,
      UserRole.ADMIN,
    ]);

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Cannot add to direct conversations
    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException('Cannot add participants to direct conversations');
    }

    // Check for blocked users
    await this.validateNoBlockedUsers(userId, userIds);

    // Check if users are already participants
    const existingParticipants = await this.participantRepository.find({
      where: {
        conversationId,
        userId: In(userIds),
        leftAt: IsNull(),
      },
    });

    if (existingParticipants.length > 0) {
      const existingUserIds = existingParticipants.map((p) => p.userId);
      throw new ConflictException(
        `Some users are already participants: ${existingUserIds.join(', ')}`,
      );
    }

    // Add new participants
    const newParticipants = userIds.map((participantId) =>
      this.participantRepository.create({
        conversationId,
        userId: participantId,
        role,
        invitedById: userId,
      }),
    );

    await this.participantRepository.save(newParticipants);

    return { message: 'Participants added successfully' };
  }

  /**
   * Remove participant from conversation
   */
  async removeParticipant(
    userId: string,
    conversationId: string,
    participantUserId: string,
  ) {
    // Validate user is participant with permission
    await this.validateParticipantRole(conversationId, userId, [
      UserRole.OWNER,
      UserRole.ADMIN,
    ]);

    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId: participantUserId, leftAt: IsNull() },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    // Cannot remove owner
    if (participant.role === UserRole.OWNER) {
      throw new ForbiddenException('Cannot remove conversation owner');
    }

    // Mark as left
    participant.leftAt = new Date();
    await this.participantRepository.save(participant);

    return { message: 'Participant removed successfully' };
  }

  /**
   * Update participant settings (mute, archive, pin, notifications)
   */
  async updateParticipantSettings(
    userId: string,
    conversationId: string,
    updateParticipantDto: UpdateParticipantDto,
  ) {
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId, leftAt: IsNull() },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    // Update settings
    Object.assign(participant, updateParticipantDto);
    await this.participantRepository.save(participant);

    return { message: 'Settings updated successfully' };
  }

  /**
   * Leave conversation
   */
  async leaveConversation(userId: string, conversationId: string) {
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId, leftAt: IsNull() },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Cannot leave direct conversations
    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException('Cannot leave direct conversations');
    }

    // If owner, transfer ownership or delete conversation
    if (participant.role === UserRole.OWNER) {
      const otherParticipants = await this.participantRepository.find({
        where: { conversationId, leftAt: IsNull() },
        order: { role: 'ASC', joinedAt: 'ASC' },
      });

      const newOwner = otherParticipants.find((p) => p.userId !== userId);

      if (newOwner) {
        newOwner.role = UserRole.OWNER;
        await this.participantRepository.save(newOwner);
      } else {
        // No other participants, delete conversation
        await this.conversationRepository.softRemove(conversation);
        return { message: 'Conversation deleted' };
      }
    }

    // Mark as left
    participant.leftAt = new Date();
    await this.participantRepository.save(participant);

    return { message: 'Left conversation successfully' };
  }

  /**
   * Delete conversation (owner only)
   */
  async deleteConversation(userId: string, conversationId: string) {
    // Validate user is owner
    await this.validateParticipantRole(conversationId, userId, [UserRole.OWNER]);

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.conversationRepository.softRemove(conversation);

    return { message: 'Conversation deleted successfully' };
  }

  /**
   * Mark messages as read
   */
  async markAsRead(userId: string, conversationId: string, messageId: string) {
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId, leftAt: IsNull() },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    participant.lastReadMessageId = messageId;
    participant.lastReadAt = new Date();
    participant.unreadCount = 0;

    await this.participantRepository.save(participant);

    return { message: 'Marked as read' };
  }

  /**
   * Get messages in conversation
   */
  async getConversationMessages(
    userId: string,
    conversationId: string,
    query: { page: number; limit: number; beforeMessageId?: string },
  ) {
    // Verify user is participant
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId, leftAt: IsNull() },
    });

    if (!participant) {
      throw new ForbiddenException('Not a participant in this conversation');
    }

    const { page, limit, beforeMessageId } = query;

    // Build query
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.replyTo', 'replyTo')
      .leftJoinAndSelect('replyTo.sender', 'replyToSender')
      .where('message.conversationId = :conversationId', { conversationId })
      .andWhere('message.deletedAt IS NULL');

    // Pagination with beforeMessageId (for infinite scroll)
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

    // Order by most recent first
    queryBuilder.orderBy('message.createdAt', 'DESC');

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

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
      messages: messagesWithReactions.reverse(), // Reverse to show oldest first in UI
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== Helper Methods ====================

  /**
   * Find existing direct conversation between two users
   */
  private async findDirectConversation(userId1: string, userId2: string) {
    const participant = await this.participantRepository
      .createQueryBuilder('p1')
      .innerJoin(
        'conversation_participants',
        'p2',
        'p1.conversationId = p2.conversationId AND p2.userId = :userId2',
        { userId2 },
      )
      .leftJoinAndSelect('p1.conversation', 'conversation')
      .leftJoinAndSelect('conversation.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'user')
      .where('p1.userId = :userId1', { userId1 })
      .andWhere('conversation.type = :type', { type: ConversationType.DIRECT })
      .andWhere('p1.leftAt IS NULL')
      .andWhere('p2.leftAt IS NULL')
      .getOne();

    if (!participant) {
      return null;
    }

    return {
      ...participant.conversation,
      userParticipant: {
        isMuted: participant.isMuted,
        isArchived: participant.isArchived,
        isPinned: participant.isPinned,
        unreadCount: participant.unreadCount,
        lastReadMessageId: participant.lastReadMessageId,
        lastReadAt: participant.lastReadAt,
        role: participant.role,
      },
      participants: participant.conversation.participants
        .filter((p) => !p.leftAt)
        .map((p) => ({
          id: p.id,
          userId: p.userId,
          role: p.role,
          user: {
            id: p.user.id,
            username: p.user.username,
            firstName: p.user.firstName,
            lastName: p.user.lastName,
            avatarUrl: p.user.avatarUrl,
            isOnline: p.user.isOnline,
            presenceStatus: p.user.presenceStatus,
          },
        })),
    };
  }

  /**
   * Get or create self-conversation (for personal notes/bookmarks)
   */
  async getOrCreateSelfConversation(userId: string) {
    // Check if self-conversation already exists
    const participant = await this.participantRepository
      .createQueryBuilder('participant')
      .leftJoinAndSelect('participant.conversation', 'conversation')
      .leftJoinAndSelect('conversation.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'user')
      .where('participant.userId = :userId', { userId })
      .andWhere('conversation.type = :type', { type: ConversationType.DIRECT })
      .andWhere('participant.leftAt IS NULL')
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('COUNT(cp.id)')
          .from('conversation_participants', 'cp')
          .where('cp.conversationId = conversation.id')
          .andWhere('cp.leftAt IS NULL')
          .getQuery();
        return `(${subQuery}) = 1`;
      })
      .getOne();

    if (participant) {
      return {
        ...participant.conversation,
        userParticipant: {
          isMuted: participant.isMuted,
          isArchived: participant.isArchived,
          isPinned: participant.isPinned,
          unreadCount: participant.unreadCount,
          lastReadMessageId: participant.lastReadMessageId,
          lastReadAt: participant.lastReadAt,
          role: participant.role,
        },
        participants: participant.conversation.participants
          .filter((p) => !p.leftAt)
          .map((p) => ({
            id: p.id,
            userId: p.userId,
            role: p.role,
            joinedAt: p.joinedAt,
            user: {
              id: p.user.id,
              username: p.user.username,
              firstName: p.user.firstName,
              lastName: p.user.lastName,
              avatarUrl: p.user.avatarUrl,
              isOnline: p.user.isOnline,
              presenceStatus: p.user.presenceStatus,
            },
          })),
      };
    }

    // Create new self-conversation with special name
    const conversation = this.conversationRepository.create({
      type: ConversationType.DIRECT,
      name: 'Notes (You)',
      description: 'Personal notes and reminders',
      createdById: userId,
      isGroup: false,
      isChannel: false,
    });

    await this.conversationRepository.save(conversation);

    // Add user as the only participant
    const selfParticipant = this.participantRepository.create({
      conversationId: conversation.id,
      userId,
      role: UserRole.MEMBER,
      isPinned: true, // Auto-pin self-conversation
    });

    await this.participantRepository.save(selfParticipant);

    // Return the newly created self-conversation
    return this.getConversationById(userId, conversation.id);
  }

  /**
   * Validate no blocked users in participant list
   */
  private async validateNoBlockedUsers(userId: string, participantIds: string[]) {
    const blockedUsers = await this.blockedUserRepository.find({
      where: [
        { blockerId: userId, blockedId: In(participantIds) },
        { blockerId: In(participantIds), blockedId: userId },
      ],
    });

    if (blockedUsers.length > 0) {
      throw new BadRequestException('Cannot create conversation with blocked users');
    }
  }

  /**
   * Validate participant role
   */
  private async validateParticipantRole(
    conversationId: string,
    userId: string,
    allowedRoles: UserRole[],
  ) {
    const participant = await this.participantRepository.findOne({
      where: { conversationId, userId, leftAt: IsNull() },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (!allowedRoles.includes(participant.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return participant;
  }
}
