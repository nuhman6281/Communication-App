import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';

export enum NotificationType {
  MESSAGE = 'message', // New message received
  MENTION = 'mention', // User was mentioned
  REACTION = 'reaction', // Someone reacted to user's message
  REPLY = 'reply', // Someone replied to user's message
  CALL_INCOMING = 'call_incoming', // Incoming call
  CALL_MISSED = 'call_missed', // Missed call
  GROUP_INVITE = 'group_invite', // Invited to group
  GROUP_JOIN = 'group_join', // Someone joined group
  GROUP_LEAVE = 'group_leave', // Someone left group
  CHANNEL_SUBSCRIBE = 'channel_subscribe', // New channel subscriber
  CHANNEL_POST = 'channel_post', // New post in subscribed channel
  STORY_VIEW = 'story_view', // Someone viewed your story
  STORY_REPLY = 'story_reply', // Someone replied to your story
  FRIEND_REQUEST = 'friend_request', // Friend request received
  SYSTEM = 'system', // System notification
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('notifications')
@Index(['userId', 'isRead'])
@Index(['userId', 'createdAt'])
@Index(['type', 'userId'])
export class Notification extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string; // Recipient user

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  senderId: string | null; // User who triggered the notification (nullable for system notifications)

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'senderId' })
  sender: User | null;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  data: {
    conversationId?: string;
    messageId?: string;
    groupId?: string;
    channelId?: string;
    callId?: string;
    storyId?: string;
    url?: string;
    [key: string]: any;
  } | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  actionUrl: string | null; // URL to navigate to when clicked

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;

  @Column({ type: 'boolean', default: false })
  isSent: boolean; // Whether notification was successfully sent via push/email

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null; // Optional expiration time
}
