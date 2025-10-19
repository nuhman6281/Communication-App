import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification, NotificationType, NotificationPriority } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Create a new notification
   */
  async createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      priority: createNotificationDto.priority || NotificationPriority.NORMAL,
    });

    const saved = await this.notificationRepository.save(notification);

    // Emit real-time notification via WebSocket gateway
    this.notificationsGateway.sendNotificationToUser(saved.userId, saved);

    return saved;
  }

  /**
   * Create multiple notifications at once
   */
  async createBulkNotifications(
    notifications: CreateNotificationDto[],
  ): Promise<Notification[]> {
    const notificationEntities = notifications.map((dto) =>
      this.notificationRepository.create({
        ...dto,
        priority: dto.priority || NotificationPriority.NORMAL,
      }),
    );

    const saved = await this.notificationRepository.save(notificationEntities);

    // Emit real-time notifications via WebSocket gateway
    for (const notification of saved) {
      this.notificationsGateway.sendNotificationToUser(notification.userId, notification);
    }

    return saved;
  }

  /**
   * Get user notifications with filters and pagination
   */
  async getUserNotifications(
    userId: string,
    filters: GetNotificationsDto,
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const { type, unreadOnly, page = 1, limit = 20 } = filters;

    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.sender', 'sender')
      .where('notification.userId = :userId', { userId })
      .andWhere('(notification.expiresAt IS NULL OR notification.expiresAt > :now)', {
        now: new Date(),
      });

    if (type) {
      query.andWhere('notification.type = :type', { type });
    }

    if (unreadOnly) {
      query.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    query
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [notifications, total] = await query.getManyAndCount();

    // Get unread count
    const unreadCount = await this.notificationRepository.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { notifications, total, unreadCount };
  }

  /**
   * Get a single notification by ID
   */
  async getNotification(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
      relations: ['sender'],
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Ensure user owns this notification
    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not have access to this notification');
    }

    return notification;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.getNotification(notificationId, userId);

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationRepository.save(notification);

      // Emit unread count update via WebSocket
      const unreadCount = await this.getUnreadCount(userId);
      this.notificationsGateway.sendUnreadCountUpdate(userId, unreadCount);
    }

    return notification;
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(
    notificationIds: string[],
    userId: string,
  ): Promise<void> {
    const notifications = await this.notificationRepository.find({
      where: {
        id: In(notificationIds),
        userId,
      },
    });

    if (notifications.length === 0) {
      return;
    }

    const now = new Date();
    notifications.forEach((notification) => {
      if (!notification.isRead) {
        notification.isRead = true;
        notification.readAt = now;
      }
    });

    await this.notificationRepository.save(notifications);

    // Emit unread count update via WebSocket
    const unreadCount = await this.getUnreadCount(userId);
    this.notificationsGateway.sendUnreadCountUpdate(userId, unreadCount);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    // Emit unread count update via WebSocket
    this.notificationsGateway.sendUnreadCountUpdate(userId, 0);
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await this.getNotification(notificationId, userId);
    await this.notificationRepository.remove(notification);
  }

  /**
   * Delete multiple notifications
   */
  async deleteMultipleNotifications(
    notificationIds: string[],
    userId: string,
  ): Promise<void> {
    const notifications = await this.notificationRepository.find({
      where: {
        id: In(notificationIds),
        userId,
      },
    });

    if (notifications.length > 0) {
      await this.notificationRepository.remove(notifications);
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<void> {
    await this.notificationRepository.delete({ userId });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Cron job to delete expired notifications
   * Runs daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteExpiredNotifications(): Promise<void> {
    const expiredNotifications = await this.notificationRepository.find({
      where: {
        expiresAt: In([new Date()]),
      },
    });

    if (expiredNotifications.length > 0) {
      await this.notificationRepository.remove(expiredNotifications);
      console.log(`Deleted ${expiredNotifications.length} expired notifications`);
    }
  }

  // ==================== Helper Methods for Integration ====================

  /**
   * Notify user about a new message
   */
  async notifyNewMessage(
    userId: string,
    senderId: string,
    conversationName: string,
    messagePreview: string,
    conversationId: string,
    messageId: string,
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      senderId,
      type: NotificationType.MESSAGE,
      priority: NotificationPriority.NORMAL,
      title: `New message from ${conversationName}`,
      body: messagePreview,
      data: {
        conversationId,
        messageId,
      },
    });
  }

  /**
   * Notify user about being mentioned in a message
   */
  async notifyMention(
    userId: string,
    senderId: string,
    senderName: string,
    conversationName: string,
    messagePreview: string,
    conversationId: string,
    messageId: string,
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      senderId,
      type: NotificationType.MENTION,
      priority: NotificationPriority.HIGH,
      title: `${senderName} mentioned you in ${conversationName}`,
      body: messagePreview,
      data: {
        conversationId,
        messageId,
      },
    });
  }

  /**
   * Notify user about a reaction to their message
   */
  async notifyReaction(
    userId: string,
    senderId: string,
    senderName: string,
    emoji: string,
    messageId: string,
    conversationId: string,
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      senderId,
      type: NotificationType.REACTION,
      priority: NotificationPriority.LOW,
      title: `${senderName} reacted to your message`,
      body: `${emoji}`,
      data: {
        conversationId,
        messageId,
        emoji,
      },
    });
  }

  /**
   * Notify user about a reply to their message
   */
  async notifyReply(
    userId: string,
    senderId: string,
    senderName: string,
    replyPreview: string,
    conversationId: string,
    messageId: string,
    parentMessageId: string,
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      senderId,
      type: NotificationType.REPLY,
      priority: NotificationPriority.NORMAL,
      title: `${senderName} replied to your message`,
      body: replyPreview,
      data: {
        conversationId,
        messageId,
        parentMessageId,
      },
    });
  }

  /**
   * Notify user about an incoming call
   */
  async notifyIncomingCall(
    userId: string,
    senderId: string,
    callerName: string,
    callType: 'audio' | 'video',
    callId: string,
    conversationId: string,
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      senderId,
      type: NotificationType.CALL_INCOMING,
      priority: NotificationPriority.URGENT,
      title: `Incoming ${callType} call from ${callerName}`,
      body: `${callerName} is calling you`,
      data: {
        callId,
        conversationId,
        callType,
      },
      expiresAt: new Date(Date.now() + 60000), // Expire in 1 minute
    });
  }

  /**
   * Notify user about a missed call
   */
  async notifyMissedCall(
    userId: string,
    senderId: string,
    callerName: string,
    callType: 'audio' | 'video',
    callId: string,
    conversationId: string,
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      senderId,
      type: NotificationType.CALL_MISSED,
      priority: NotificationPriority.HIGH,
      title: `Missed ${callType} call`,
      body: `You missed a ${callType} call from ${callerName}`,
      data: {
        callId,
        conversationId,
        callType,
      },
    });
  }

  /**
   * Notify user about a group invitation
   */
  async notifyGroupInvite(
    userId: string,
    senderId: string,
    inviterName: string,
    groupName: string,
    groupId: string,
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      senderId,
      type: NotificationType.GROUP_INVITE,
      priority: NotificationPriority.NORMAL,
      title: `Invitation to join ${groupName}`,
      body: `${inviterName} invited you to join ${groupName}`,
      data: {
        groupId,
      },
    });
  }

  /**
   * Notify group members about someone joining
   */
  async notifyGroupJoin(
    userIds: string[],
    joinedUserId: string,
    joinedUserName: string,
    groupName: string,
    groupId: string,
  ): Promise<Notification[]> {
    const notifications = userIds.map((userId) => ({
      userId,
      senderId: joinedUserId,
      type: NotificationType.GROUP_JOIN,
      priority: NotificationPriority.LOW,
      title: `${joinedUserName} joined ${groupName}`,
      body: `${joinedUserName} is now a member of ${groupName}`,
      data: {
        groupId,
      },
    }));

    return this.createBulkNotifications(notifications);
  }

  /**
   * Notify group members about someone leaving
   */
  async notifyGroupLeave(
    userIds: string[],
    leftUserId: string,
    leftUserName: string,
    groupName: string,
    groupId: string,
  ): Promise<Notification[]> {
    const notifications = userIds.map((userId) => ({
      userId,
      senderId: leftUserId,
      type: NotificationType.GROUP_LEAVE,
      priority: NotificationPriority.LOW,
      title: `${leftUserName} left ${groupName}`,
      body: `${leftUserName} is no longer a member of ${groupName}`,
      data: {
        groupId,
      },
    }));

    return this.createBulkNotifications(notifications);
  }

  /**
   * Notify channel owner about a new subscriber
   */
  async notifyChannelSubscribe(
    ownerId: string,
    subscriberId: string,
    subscriberName: string,
    channelName: string,
    channelId: string,
  ): Promise<Notification> {
    return this.createNotification({
      userId: ownerId,
      senderId: subscriberId,
      type: NotificationType.CHANNEL_SUBSCRIBE,
      priority: NotificationPriority.LOW,
      title: `New subscriber to ${channelName}`,
      body: `${subscriberName} subscribed to your channel`,
      data: {
        channelId,
      },
    });
  }

  /**
   * Notify channel subscribers about a new post
   */
  async notifyChannelPost(
    subscriberIds: string[],
    channelId: string,
    channelName: string,
    postPreview: string,
    messageId: string,
  ): Promise<Notification[]> {
    const notifications = subscriberIds.map((userId) => ({
      userId,
      senderId: null,
      type: NotificationType.CHANNEL_POST,
      priority: NotificationPriority.NORMAL,
      title: `New post in ${channelName}`,
      body: postPreview,
      data: {
        channelId,
        messageId,
      },
    }));

    return this.createBulkNotifications(notifications);
  }

  /**
   * Notify user about someone viewing their story
   */
  async notifyStoryView(
    userId: string,
    viewerId: string,
    viewerName: string,
    storyId: string,
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      senderId: viewerId,
      type: NotificationType.STORY_VIEW,
      priority: NotificationPriority.LOW,
      title: `${viewerName} viewed your story`,
      body: `${viewerName} viewed your story`,
      data: {
        storyId,
      },
      expiresAt: new Date(Date.now() + 86400000), // Expire in 24 hours
    });
  }

  /**
   * Notify user about a reply to their story
   */
  async notifyStoryReply(
    userId: string,
    senderId: string,
    senderName: string,
    replyPreview: string,
    storyId: string,
    messageId: string,
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      senderId,
      type: NotificationType.STORY_REPLY,
      priority: NotificationPriority.NORMAL,
      title: `${senderName} replied to your story`,
      body: replyPreview,
      data: {
        storyId,
        messageId,
      },
    });
  }

  /**
   * Notify user about a friend request
   */
  async notifyFriendRequest(
    userId: string,
    senderId: string,
    senderName: string,
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      senderId,
      type: NotificationType.FRIEND_REQUEST,
      priority: NotificationPriority.NORMAL,
      title: `Friend request from ${senderName}`,
      body: `${senderName} sent you a friend request`,
      data: {},
    });
  }

  /**
   * Send a system notification
   */
  async notifySystem(
    userId: string,
    title: string,
    body: string,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    data?: any,
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      senderId: null,
      type: NotificationType.SYSTEM,
      priority,
      title,
      body,
      data,
    });
  }
}
