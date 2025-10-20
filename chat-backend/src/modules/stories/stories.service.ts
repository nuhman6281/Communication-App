import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan, LessThan, Brackets } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Story } from './entities/story.entity';
import { StoryView } from './entities/story-view.entity';
import { StoryReply } from './entities/story-reply.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { GetStoriesDto } from './dto/get-stories.dto';
import { CreateStoryReplyDto } from './dto/create-story-reply.dto';
import { StoriesGateway } from './stories/stories.gateway';
import { NotificationsService } from '@modules/notifications/notifications.service';

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(StoryView)
    private readonly storyViewRepository: Repository<StoryView>,
    @InjectRepository(StoryReply)
    private readonly storyReplyRepository: Repository<StoryReply>,
    @Inject(forwardRef(() => StoriesGateway))
    private readonly storiesGateway: StoriesGateway,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a new story
   */
  async createStory(
    userId: string,
    createStoryDto: CreateStoryDto,
  ): Promise<Story> {
    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = this.storyRepository.create({
      userId,
      ...createStoryDto,
      expiresAt,
    });

    const saved = await this.storyRepository.save(story);

    // Load user relation for full story object
    const fullStory = await this.storyRepository.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });

    // Emit real-time event for new story
    this.storiesGateway.broadcastNewStory(fullStory!);

    return fullStory!;
  }

  /**
   * Get all active stories from users (feed view)
   */
  async getStories(
    currentUserId: string,
    filters: GetStoriesDto,
  ): Promise<{ stories: Story[]; total: number }> {
    const {
      type,
      highlightsOnly = false,
      activeOnly = true,
      page = 1,
      limit = 20,
    } = filters;

    const query = this.storyRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.user', 'user')
      .leftJoinAndSelect('story.views', 'views')
      .where('story.userId != :currentUserId', { currentUserId }); // Exclude own stories

    if (type) {
      query.andWhere('story.type = :type', { type });
    }

    if (highlightsOnly) {
      query.andWhere('story.isHighlight = :isHighlight', { isHighlight: true });
    } else if (activeOnly) {
      query.andWhere(
        '(story.isHighlight = :isHighlight OR story.expiresAt > :now)',
        {
          isHighlight: true,
          now: new Date(),
        },
      );
    }

    // Check privacy settings
    query.andWhere(
      new Brackets((qb) => {
        qb.where('story.privacy = :publicPrivacy', { publicPrivacy: 'public' })
          .orWhere(
            new Brackets((customQb) => {
              customQb
                .where('story.privacy = :customPrivacy', { customPrivacy: 'custom' })
                .andWhere(':currentUserId = ANY(story.customViewers)', { currentUserId });
            }),
          )
          .orWhere('story.privacy = :friendsPrivacy', { friendsPrivacy: 'friends' });
      }),
    );

    // Exclude blocked viewers - skip if blockedViewers is NULL, otherwise check if user is NOT in the array
    query.andWhere(
      new Brackets((qb) => {
        qb.where('story.blockedViewers IS NULL')
          .orWhere('NOT(:currentUserId = ANY(story.blockedViewers))', { currentUserId });
      }),
    );

    query
      .orderBy('story.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [stories, total] = await query.getManyAndCount();

    return { stories, total };
  }

  /**
   * Get user's own stories
   */
  async getMyStories(
    userId: string,
    filters: GetStoriesDto,
  ): Promise<{ stories: Story[]; total: number }> {
    const {
      type,
      highlightsOnly = false,
      activeOnly = true,
      page = 1,
      limit = 20,
    } = filters;

    const query = this.storyRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.user', 'user')
      .leftJoinAndSelect('story.views', 'views')
      .leftJoinAndSelect('views.viewer', 'viewer')
      .where('story.userId = :userId', { userId });

    if (type) {
      query.andWhere('story.type = :type', { type });
    }

    if (highlightsOnly) {
      query.andWhere('story.isHighlight = :isHighlight', { isHighlight: true });
    } else if (activeOnly) {
      query.andWhere(
        '(story.isHighlight = :isHighlight OR story.expiresAt > :now)',
        {
          isHighlight: true,
          now: new Date(),
        },
      );
    }

    query
      .orderBy('story.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [stories, total] = await query.getManyAndCount();

    return { stories, total };
  }

  /**
   * Get stories from a specific user
   */
  async getUserStories(
    userId: string,
    viewerId: string,
  ): Promise<Story[]> {
    const query = this.storyRepository
      .createQueryBuilder('story')
      .leftJoinAndSelect('story.user', 'user')
      .leftJoinAndSelect('story.views', 'views')
      .where('story.userId = :userId', { userId })
      .andWhere('(story.isHighlight = :isHighlight OR story.expiresAt > :now)', {
        isHighlight: true,
        now: new Date(),
      });

    // Check privacy settings if not viewing own stories
    if (userId !== viewerId) {
      query.andWhere(
        `(
          story.privacy = 'public' OR
          (story.privacy = 'custom' AND :viewerId = ANY(story.customViewers)) OR
          (story.privacy = 'friends')
        )`,
        { viewerId },
      );

      query.andWhere(
        '(story.blockedViewers IS NULL OR NOT(:viewerId = ANY(story.blockedViewers)))',
        { viewerId },
      );
    }

    query.orderBy('story.createdAt', 'DESC');

    return query.getMany();
  }

  /**
   * Get a single story by ID
   */
  async getStory(storyId: string, viewerId: string): Promise<Story> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['user', 'views', 'views.viewer'],
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    // Check if story is expired (and not a highlight)
    if (!story.isHighlight && story.expiresAt < new Date()) {
      throw new NotFoundException('Story has expired');
    }

    // Check privacy permissions
    if (story.userId !== viewerId) {
      // Check if viewer is blocked
      if (
        story.blockedViewers &&
        story.blockedViewers.includes(viewerId)
      ) {
        throw new ForbiddenException('You do not have access to this story');
      }

      // Check custom privacy
      if (story.privacy === 'custom') {
        if (
          !story.customViewers ||
          !story.customViewers.includes(viewerId)
        ) {
          throw new ForbiddenException('You do not have access to this story');
        }
      }

      // Friends privacy would require a friends relationship check
      // TODO: Implement friends check when Friends module is available
    }

    return story;
  }

  /**
   * Update a story
   */
  async updateStory(
    storyId: string,
    userId: string,
    updateStoryDto: UpdateStoryDto,
  ): Promise<Story> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    // Ensure user owns this story
    if (story.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this story');
    }

    // Update fields
    Object.assign(story, updateStoryDto);

    return this.storyRepository.save(story);
  }

  /**
   * Delete a story
   */
  async deleteStory(storyId: string, userId: string): Promise<void> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    // Ensure user owns this story
    if (story.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this story');
    }

    await this.storyRepository.remove(story);

    // Emit real-time event for deleted story
    this.storiesGateway.broadcastDeletedStory(storyId, userId);
  }

  /**
   * View a story (record view)
   */
  async viewStory(storyId: string, viewerId: string): Promise<StoryView> {
    // First, verify the story exists and user has access
    const story = await this.getStory(storyId, viewerId);

    // Don't record view if viewing own story
    if (story.userId === viewerId) {
      throw new BadRequestException('Cannot view your own story');
    }

    // Check if already viewed
    const existingView = await this.storyViewRepository.findOne({
      where: { storyId, viewerId },
    });

    if (existingView) {
      return existingView;
    }

    // Create new view
    const view = this.storyViewRepository.create({
      storyId,
      viewerId,
    });

    const savedView = await this.storyViewRepository.save(view);

    // Increment view count on story
    await this.storyRepository.increment({ id: storyId }, 'viewCount', 1);

    // Load viewer relation
    const fullView = await this.storyViewRepository.findOne({
      where: { id: savedView.id },
      relations: ['viewer'],
    });

    // Emit real-time event for new view
    this.storiesGateway.sendNewStoryView(story.userId, storyId, fullView!);

    // Send notification to story owner
    const viewer = fullView!.viewer;
    await this.notificationsService.notifyStoryView(
      story.userId,
      viewerId,
      `${viewer.firstName} ${viewer.lastName}`,
      storyId,
    );

    return fullView!;
  }

  /**
   * Get story views
   */
  async getStoryViews(storyId: string, userId: string): Promise<StoryView[]> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    // Ensure user owns this story
    if (story.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view story views');
    }

    return this.storyViewRepository.find({
      where: { storyId },
      relations: ['viewer'],
      order: { viewedAt: 'DESC' },
    });
  }

  /**
   * Reply to a story
   */
  async replyToStory(
    storyId: string,
    senderId: string,
    createStoryReplyDto: CreateStoryReplyDto,
  ): Promise<StoryReply> {
    // Verify the story exists and user has access
    const story = await this.getStory(storyId, senderId);

    const reply = this.storyReplyRepository.create({
      storyId,
      senderId,
      ...createStoryReplyDto,
    });

    const savedReply = await this.storyReplyRepository.save(reply);

    // Increment reply count on story
    await this.storyRepository.increment({ id: storyId }, 'replyCount', 1);

    // Load sender relation
    const fullReply = await this.storyReplyRepository.findOne({
      where: { id: savedReply.id },
      relations: ['sender'],
    });

    // Emit real-time event for new reply
    this.storiesGateway.sendNewStoryReply(story.userId, storyId, fullReply!);

    // Send notification to story owner
    const sender = fullReply!.sender;
    await this.notificationsService.notifyStoryReply(
      story.userId,
      senderId,
      `${sender.firstName} ${sender.lastName}`,
      createStoryReplyDto.content,
      storyId,
      savedReply.id,
    );

    return fullReply!;
  }

  /**
   * Get story replies
   */
  async getStoryReplies(storyId: string, userId: string): Promise<StoryReply[]> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    // Ensure user owns this story
    if (story.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view story replies');
    }

    return this.storyReplyRepository.find({
      where: { storyId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Mark story reply as read
   */
  async markReplyAsRead(replyId: string, userId: string): Promise<StoryReply> {
    const reply = await this.storyReplyRepository.findOne({
      where: { id: replyId },
      relations: ['story'],
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    // Ensure user owns the story this reply belongs to
    if (reply.story.userId !== userId) {
      throw new ForbiddenException('You do not have permission to mark this reply as read');
    }

    if (!reply.isRead) {
      reply.isRead = true;
      reply.readAt = new Date();
      await this.storyReplyRepository.save(reply);
    }

    return reply;
  }

  /**
   * Get user's highlights
   */
  async getHighlights(userId: string): Promise<Story[]> {
    return this.storyRepository.find({
      where: {
        userId,
        isHighlight: true,
      },
      relations: ['user', 'views'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Cron job to delete expired stories (non-highlights)
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async deleteExpiredStories(): Promise<void> {
    const expiredStories = await this.storyRepository.find({
      where: {
        isHighlight: false,
        expiresAt: LessThan(new Date()),
      },
    });

    if (expiredStories.length > 0) {
      await this.storyRepository.remove(expiredStories);
      console.log(`Deleted ${expiredStories.length} expired stories`);
    }
  }

  /**
   * Get stories statistics for a user
   */
  async getUserStoriesStats(userId: string): Promise<{
    totalStories: number;
    activeStories: number;
    totalViews: number;
    totalReplies: number;
    highlightsCount: number;
  }> {
    const totalStories = await this.storyRepository.count({
      where: { userId },
    });

    const activeStories = await this.storyRepository.count({
      where: [
        { userId, isHighlight: true },
        { userId, expiresAt: MoreThan(new Date()) },
      ],
    });

    const highlightsCount = await this.storyRepository.count({
      where: { userId, isHighlight: true },
    });

    const stats = await this.storyRepository
      .createQueryBuilder('story')
      .select('SUM(story.viewCount)', 'totalViews')
      .addSelect('SUM(story.replyCount)', 'totalReplies')
      .where('story.userId = :userId', { userId })
      .getRawOne();

    return {
      totalStories,
      activeStories,
      totalViews: parseInt(stats?.totalViews || '0'),
      totalReplies: parseInt(stats?.totalReplies || '0'),
      highlightsCount,
    };
  }
}
