import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';
import { Channel } from './channel.entity';

export enum ChannelSubscriberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUBSCRIBER = 'subscriber',
}

export enum ChannelSubscriberStatus {
  ACTIVE = 'active',
  MUTED = 'muted',
  BLOCKED = 'blocked', // Blocked by channel admin
  PENDING = 'pending', // Waiting for approval (private channels)
}

@Entity('channel_subscribers')
@Unique(['channelId', 'userId'])
@Index(['channelId', 'status'])
@Index(['userId'])
export class ChannelSubscriber extends BaseEntity {
  @Column({ type: 'uuid', nullable: false })
  channelId: string;

  @ManyToOne(() => Channel, (channel) => channel.subscribers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'channelId' })
  channel: Channel;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ChannelSubscriberRole,
    default: ChannelSubscriberRole.SUBSCRIBER,
  })
  role: ChannelSubscriberRole;

  @Column({
    type: 'enum',
    enum: ChannelSubscriberStatus,
    default: ChannelSubscriberStatus.ACTIVE,
  })
  status: ChannelSubscriberStatus;

  @Column({ type: 'timestamp' })
  subscribedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  mutedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  blockedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  blockedById: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'blockedById' })
  blockedBy: User | null;

  @Column({ type: 'text', nullable: true })
  blockReason: string | null;

  @Column({ type: 'boolean', default: true })
  notificationsEnabled: boolean;

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    notifyOnNewPost?: boolean;
    notifyOnMention?: boolean;
    emailDigest?: boolean;
  } | null;
}
