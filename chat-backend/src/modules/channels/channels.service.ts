import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Channel, ChannelType, ChannelCategory } from './entities/channel.entity';
import {
  ChannelSubscriber,
  ChannelSubscriberRole,
  ChannelSubscriberStatus,
} from './entities/channel-subscriber.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { ConversationsService } from '@modules/conversations/conversations.service';
import { ConversationType } from '@common/constants';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(ChannelSubscriber)
    private readonly subscriberRepository: Repository<ChannelSubscriber>,
    private readonly conversationsService: ConversationsService,
  ) {}

  async createChannel(
    userId: string,
    createChannelDto: CreateChannelDto,
  ): Promise<Channel> {
    // Check if handle is already taken
    const existingChannel = await this.channelRepository.findOne({
      where: { handle: createChannelDto.handle },
    });

    if (existingChannel) {
      throw new ConflictException('Channel handle already exists');
    }

    // Create conversation for the channel
    const conversation = await this.conversationsService.createConversation(
      userId,
      {
        name: createChannelDto.name,
        type: ConversationType.CHANNEL,
        participantIds: [],
      },
    );

    // Use raw query to completely bypass TypeORM metadata
    const settings = createChannelDto.settings || {
      allowComments: true,
      allowReactions: true,
      allowSharing: true,
      notifySubscribers: true,
      requireApproval: createChannelDto.type === ChannelType.PRIVATE,
    };

    const result = await this.channelRepository.query(
      `INSERT INTO channels
        (name, handle, description, "avatarUrl", "bannerUrl", type, category, "ownerId", "conversationId", "subscriberCount", settings, tags)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        createChannelDto.name,
        createChannelDto.handle.toLowerCase(),
        createChannelDto.description || null,
        createChannelDto.avatarUrl || null,
        createChannelDto.bannerUrl || null,
        createChannelDto.type || ChannelType.PUBLIC,
        createChannelDto.category || ChannelCategory.OTHER,
        userId,
        conversation.id,
        1,
        JSON.stringify(settings),
        createChannelDto.tags || [],
      ],
    );

    const savedChannel = result[0] as Channel;

    // Add creator as owner
    await this.subscriberRepository.save({
      channelId: savedChannel.id,
      userId,
      role: ChannelSubscriberRole.OWNER,
      status: ChannelSubscriberStatus.ACTIVE,
      subscribedAt: new Date(),
      notificationsEnabled: true,
    });

    return savedChannel;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    type?: ChannelType,
    category?: string,
  ): Promise<{ channels: Channel[]; total: number }> {
    const query = this.channelRepository
      .createQueryBuilder('channel')
      .where('channel.isActive = :isActive', { isActive: true })
      .andWhere('channel.type = :channelType', {
        channelType: type || ChannelType.PUBLIC,
      });

    if (category) {
      query.andWhere('channel.category = :category', { category });
    }

    query
      .orderBy('channel.subscriberCount', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [channels, total] = await query.getManyAndCount();

    return { channels, total };
  }

  async findUserChannels(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ channels: Channel[]; total: number }> {
    const query = this.channelRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.subscribers', 'subscriber')
      .where('subscriber.userId = :userId', { userId })
      .andWhere('subscriber.status = :status', {
        status: ChannelSubscriberStatus.ACTIVE,
      })
      .andWhere('channel.isActive = :isActive', { isActive: true })
      .orderBy('channel.lastPostAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [channels, total] = await query.getManyAndCount();

    return { channels, total };
  }

  async findOne(channelId: string, userId?: string): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId, isActive: true },
      relations: ['owner'],
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check access for private channels
    if (channel.type === ChannelType.PRIVATE && userId) {
      const subscription = await this.subscriberRepository.findOne({
        where: {
          channelId,
          userId,
          status: ChannelSubscriberStatus.ACTIVE,
        },
      });

      if (!subscription) {
        throw new ForbiddenException('You do not have access to this channel');
      }
    }

    return channel;
  }

  async findByHandle(handle: string, userId?: string): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      where: { handle: handle.toLowerCase(), isActive: true },
      relations: ['owner'],
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check access for private channels
    if (channel.type === ChannelType.PRIVATE && userId) {
      const subscription = await this.subscriberRepository.findOne({
        where: {
          channelId: channel.id,
          userId,
          status: ChannelSubscriberStatus.ACTIVE,
        },
      });

      if (!subscription) {
        throw new ForbiddenException('You do not have access to this channel');
      }
    }

    return channel;
  }

  async update(
    channelId: string,
    userId: string,
    updateChannelDto: UpdateChannelDto,
  ): Promise<Channel> {
    const channel = await this.findOne(channelId, userId);

    // Check if user is owner or admin
    const subscription = await this.getSubscription(channelId, userId);
    if (
      subscription.role !== ChannelSubscriberRole.OWNER &&
      subscription.role !== ChannelSubscriberRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only channel owners and admins can update the channel',
      );
    }

    // Check handle uniqueness if changed
    if (updateChannelDto.handle && updateChannelDto.handle !== channel.handle) {
      const existingChannel = await this.channelRepository.findOne({
        where: { handle: updateChannelDto.handle.toLowerCase() },
      });

      if (existingChannel) {
        throw new ConflictException('Channel handle already exists');
      }

      updateChannelDto.handle = updateChannelDto.handle.toLowerCase();
    }

    Object.assign(channel, updateChannelDto);

    return this.channelRepository.save(channel);
  }

  async delete(channelId: string, userId: string): Promise<void> {
    const channel = await this.findOne(channelId, userId);

    // Only owner can delete
    if (channel.ownerId !== userId) {
      throw new ForbiddenException('Only the channel owner can delete the channel');
    }

    channel.isActive = false;
    await this.channelRepository.save(channel);
  }

  async subscribe(channelId: string, userId: string): Promise<ChannelSubscriber> {
    const channel = await this.findOne(channelId);

    // Check if already subscribed
    const existing = await this.subscriberRepository.findOne({
      where: { channelId, userId },
    });

    if (existing) {
      if (existing.status === ChannelSubscriberStatus.ACTIVE) {
        throw new BadRequestException('Already subscribed to this channel');
      } else if (existing.status === ChannelSubscriberStatus.BLOCKED) {
        throw new ForbiddenException('You are blocked from this channel');
      }

      // Reactivate subscription
      existing.status =
        channel.type === ChannelType.PRIVATE &&
        channel.settings?.requireApproval
          ? ChannelSubscriberStatus.PENDING
          : ChannelSubscriberStatus.ACTIVE;
      existing.subscribedAt = new Date();
      existing.mutedAt = null;

      const subscription = await this.subscriberRepository.save(existing);

      if (subscription.status === ChannelSubscriberStatus.ACTIVE) {
        await this.incrementSubscriberCount(channelId);
      }

      return subscription;
    }

    // Create new subscription
    const subscription = this.subscriberRepository.create({
      channelId,
      userId,
      role: ChannelSubscriberRole.SUBSCRIBER,
      status:
        channel.type === ChannelType.PRIVATE &&
        channel.settings?.requireApproval
          ? ChannelSubscriberStatus.PENDING
          : ChannelSubscriberStatus.ACTIVE,
      subscribedAt: new Date(),
      notificationsEnabled: true,
    });

    const saved = await this.subscriberRepository.save(subscription);

    if (saved.status === ChannelSubscriberStatus.ACTIVE) {
      await this.incrementSubscriberCount(channelId);
    }

    return saved;
  }

  async unsubscribe(channelId: string, userId: string): Promise<void> {
    const subscription = await this.subscriberRepository.findOne({
      where: { channelId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Not subscribed to this channel');
    }

    if (subscription.role === ChannelSubscriberRole.OWNER) {
      throw new BadRequestException('Channel owner cannot unsubscribe');
    }

    await this.subscriberRepository.remove(subscription);

    if (subscription.status === ChannelSubscriberStatus.ACTIVE) {
      await this.decrementSubscriberCount(channelId);
    }
  }

  async getSubscribers(
    channelId: string,
    userId: string,
    status?: ChannelSubscriberStatus,
  ): Promise<ChannelSubscriber[]> {
    await this.findOne(channelId, userId);

    const query: any = { channelId };
    if (status) {
      query.status = status;
    }

    return this.subscriberRepository.find({
      where: query,
      relations: ['user'],
      order: { subscribedAt: 'ASC' },
    });
  }

  async getSubscription(
    channelId: string,
    userId: string,
  ): Promise<ChannelSubscriber> {
    const subscription = await this.subscriberRepository.findOne({
      where: { channelId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async updateSubscriberRole(
    channelId: string,
    updaterId: string,
    subscriberId: string,
    newRole: ChannelSubscriberRole,
  ): Promise<ChannelSubscriber> {
    const channel = await this.findOne(channelId, updaterId);

    const updater = await this.getSubscription(channelId, updaterId);
    const subscriber = await this.getSubscription(channelId, subscriberId);

    // Only owner can change roles
    if (updater.role !== ChannelSubscriberRole.OWNER) {
      throw new ForbiddenException('Only the channel owner can change roles');
    }

    // Cannot change owner role
    if (subscriber.role === ChannelSubscriberRole.OWNER) {
      throw new ForbiddenException('Cannot change the owner role');
    }

    // Cannot set someone as owner
    if (newRole === ChannelSubscriberRole.OWNER) {
      throw new BadRequestException('Use transfer ownership endpoint instead');
    }

    subscriber.role = newRole;

    return this.subscriberRepository.save(subscriber);
  }

  async transferOwnership(
    channelId: string,
    currentOwnerId: string,
    newOwnerId: string,
  ): Promise<void> {
    const channel = await this.findOne(channelId, currentOwnerId);

    if (channel.ownerId !== currentOwnerId) {
      throw new ForbiddenException('Only the current owner can transfer ownership');
    }

    const currentOwner = await this.getSubscription(channelId, currentOwnerId);
    const newOwner = await this.getSubscription(channelId, newOwnerId);

    // Transfer ownership
    channel.ownerId = newOwnerId;
    currentOwner.role = ChannelSubscriberRole.ADMIN;
    newOwner.role = ChannelSubscriberRole.OWNER;

    await this.channelRepository.save(channel);
    await this.subscriberRepository.save([currentOwner, newOwner]);
  }

  async blockSubscriber(
    channelId: string,
    blockerId: string,
    subscriberId: string,
    reason?: string,
  ): Promise<ChannelSubscriber> {
    await this.findOne(channelId, blockerId);

    const blocker = await this.getSubscription(channelId, blockerId);
    const subscriber = await this.getSubscription(channelId, subscriberId);

    // Only owner and admin can block
    if (
      blocker.role !== ChannelSubscriberRole.OWNER &&
      blocker.role !== ChannelSubscriberRole.ADMIN
    ) {
      throw new ForbiddenException('Only owners and admins can block subscribers');
    }

    // Cannot block owner
    if (subscriber.role === ChannelSubscriberRole.OWNER) {
      throw new ForbiddenException('Cannot block the channel owner');
    }

    subscriber.status = ChannelSubscriberStatus.BLOCKED;
    subscriber.blockedAt = new Date();
    subscriber.blockedById = blockerId;
    subscriber.blockReason = reason || null;

    await this.decrementSubscriberCount(channelId);

    return this.subscriberRepository.save(subscriber);
  }

  async unblockSubscriber(
    channelId: string,
    unblockerId: string,
    subscriberId: string,
  ): Promise<ChannelSubscriber> {
    await this.findOne(channelId, unblockerId);

    const unblocker = await this.getSubscription(channelId, unblockerId);
    const subscriber = await this.getSubscription(channelId, subscriberId);

    // Only owner and admin can unblock
    if (
      unblocker.role !== ChannelSubscriberRole.OWNER &&
      unblocker.role !== ChannelSubscriberRole.ADMIN
    ) {
      throw new ForbiddenException('Only owners and admins can unblock subscribers');
    }

    if (subscriber.status !== ChannelSubscriberStatus.BLOCKED) {
      throw new BadRequestException('Subscriber is not blocked');
    }

    subscriber.status = ChannelSubscriberStatus.ACTIVE;
    subscriber.blockedAt = null;
    subscriber.blockedById = null;
    subscriber.blockReason = null;

    await this.incrementSubscriberCount(channelId);

    return this.subscriberRepository.save(subscriber);
  }

  async searchChannels(
    query: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ channels: Channel[]; total: number }> {
    const queryBuilder = this.channelRepository
      .createQueryBuilder('channel')
      .where('channel.isActive = :isActive', { isActive: true })
      .andWhere('channel.type = :type', { type: ChannelType.PUBLIC })
      .andWhere(
        '(channel.name ILIKE :query OR channel.description ILIKE :query OR channel.handle ILIKE :query OR :query = ANY(channel.tags))',
        { query: `%${query}%` },
      )
      .orderBy('channel.subscriberCount', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [channels, total] = await queryBuilder.getManyAndCount();

    return { channels, total };
  }

  private async incrementSubscriberCount(channelId: string): Promise<void> {
    await this.channelRepository.increment(
      { id: channelId },
      'subscriberCount',
      1,
    );
  }

  private async decrementSubscriberCount(channelId: string): Promise<void> {
    await this.channelRepository.decrement(
      { id: channelId },
      'subscriberCount',
      1,
    );
  }
}
