import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '@modules/messages/entities/message.entity';
import { User } from '@modules/users/entities/user.entity';
import { Conversation } from '@modules/conversations/entities/conversation.entity';
import { Channel } from '@modules/channels/entities/channel.entity';
import { Group } from '@modules/groups/entities/group.entity';
import { Media } from '@modules/media/entities/media.entity';
import { SearchQueryDto, SearchType } from './dto/search-query.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  async globalSearch(userId: string, searchQuery: SearchQueryDto) {
    const { q, type, page = 1, limit = 20, conversationId, dateFrom, dateTo } =
      searchQuery;

    const results: any = {
      query: q,
      type,
    };

    // Search based on type
    if (type === SearchType.ALL || type === SearchType.MESSAGES) {
      results.messages = await this.searchMessages(
        userId,
        q,
        page,
        limit,
        conversationId,
        dateFrom,
        dateTo,
      );
    }

    if (type === SearchType.ALL || type === SearchType.USERS) {
      results.users = await this.searchUsers(q, page, limit);
    }

    if (type === SearchType.ALL || type === SearchType.CONVERSATIONS) {
      results.conversations = await this.searchConversations(
        userId,
        q,
        page,
        limit,
      );
    }

    if (type === SearchType.ALL || type === SearchType.CHANNELS) {
      results.channels = await this.searchChannels(q, page, limit);
    }

    if (type === SearchType.ALL || type === SearchType.GROUPS) {
      results.groups = await this.searchGroups(userId, q, page, limit);
    }

    if (type === SearchType.ALL || type === SearchType.MEDIA) {
      results.media = await this.searchMedia(userId, q, page, limit);
    }

    return results;
  }

  private async searchMessages(
    userId: string,
    query: string,
    page: number,
    limit: number,
    conversationId?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const qb = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.content ILIKE :query', { query: `%${query}%` })
      .andWhere('message.deletedAt IS NULL');

    if (conversationId) {
      qb.andWhere('message.conversationId = :conversationId', {
        conversationId,
      });
    }

    if (dateFrom) {
      qb.andWhere('message.createdAt >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    }

    if (dateTo) {
      qb.andWhere('message.createdAt <= :dateTo', {
        dateTo: new Date(dateTo),
      });
    }

    qb.orderBy('message.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [messages, total] = await qb.getManyAndCount();

    return {
      items: messages,
      total,
      page,
      limit,
    };
  }

  private async searchUsers(query: string, page: number, limit: number) {
    const [users, total] = await this.userRepository
      .createQueryBuilder('user')
      .where('user.username ILIKE :query', { query: `%${query}%` })
      .orWhere('user.firstName ILIKE :query', { query: `%${query}%` })
      .orWhere('user.lastName ILIKE :query', { query: `%${query}%` })
      .orWhere('user.email ILIKE :query', { query: `%${query}%` })
      .andWhere('user.deletedAt IS NULL')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: users,
      total,
      page,
      limit,
    };
  }

  private async searchConversations(
    userId: string,
    query: string,
    page: number,
    limit: number,
  ) {
    const [conversations, total] = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participants')
      .where('conversation.name ILIKE :query', { query: `%${query}%` })
      .andWhere('participants.id = :userId', { userId })
      .andWhere('conversation.deletedAt IS NULL')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: conversations,
      total,
      page,
      limit,
    };
  }

  private async searchChannels(query: string, page: number, limit: number) {
    const [channels, total] = await this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.owner', 'owner')
      .where('channel.name ILIKE :query', { query: `%${query}%` })
      .orWhere('channel.description ILIKE :query', { query: `%${query}%` })
      .orWhere('channel.handle ILIKE :query', { query: `%${query}%` })
      .andWhere('channel.type = :type', { type: 'public' })
      .andWhere('channel.deletedAt IS NULL')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: channels,
      total,
      page,
      limit,
    };
  }

  private async searchGroups(
    userId: string,
    query: string,
    page: number,
    limit: number,
  ) {
    const [groups, total] = await this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.owner', 'owner')
      .leftJoinAndSelect('group.members', 'members')
      .where('group.name ILIKE :query', { query: `%${query}%` })
      .orWhere('group.description ILIKE :query', { query: `%${query}%` })
      .andWhere('members.userId = :userId', { userId })
      .andWhere('group.deletedAt IS NULL')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: groups,
      total,
      page,
      limit,
    };
  }

  private async searchMedia(
    userId: string,
    query: string,
    page: number,
    limit: number,
  ) {
    const [media, total] = await this.mediaRepository
      .createQueryBuilder('media')
      .where('media.fileName ILIKE :query', { query: `%${query}%` })
      .andWhere('media.userId = :userId', { userId })
      .andWhere('media.deletedAt IS NULL')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: media,
      total,
      page,
      limit,
    };
  }
}
