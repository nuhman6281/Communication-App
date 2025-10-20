import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
  RelationId,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';
import { ChannelSubscriber } from './channel-subscriber.entity';
import { Workspace } from '@modules/workspaces/entities/workspace.entity';
import { Conversation } from '@modules/conversations/entities/conversation.entity';

export enum ChannelType {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum ChannelCategory {
  NEWS = 'news',
  ENTERTAINMENT = 'entertainment',
  TECHNOLOGY = 'technology',
  SPORTS = 'sports',
  EDUCATION = 'education',
  BUSINESS = 'business',
  OTHER = 'other',
}

@Entity('channels')
@Index(['type', 'isActive'])
@Index(['category', 'isActive'])
@Index(['isVerified'])
@Index(['workspaceId'])
export class Channel extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  handle: string; // @channelhandle

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  bannerUrl: string | null;

  @Column({ type: 'enum', enum: ChannelType, default: ChannelType.PUBLIC })
  type: ChannelType;

  @Column({ type: 'enum', enum: ChannelCategory, default: ChannelCategory.OTHER })
  category: ChannelCategory;

  @Column({ type: 'uuid', nullable: false })
  ownerId: string;

  // Temporarily removed to fix insert issue - will add back after testing
  // @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  // @JoinColumn({ name: 'ownerId' })
  // owner: User;

  @Column({ type: 'uuid', nullable: true })
  conversationId: string | null;

  @OneToOne(() => Conversation, { nullable: true })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation | null;

  // Workspace Integration (optional - for workspace-owned channels)
  @Column({ type: 'uuid', nullable: true, name: 'workspace_id' })
  workspaceId: string | null;

  @ManyToOne(() => Workspace, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace | null;

  @Column({ type: 'boolean', default: false, name: 'is_workspace_owned' })
  isWorkspaceOwned: boolean;

  @Column({ type: 'integer', default: 0 })
  subscriberCount: number;

  @Column({ type: 'integer', default: 0 })
  postCount: number;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    allowComments?: boolean;
    allowReactions?: boolean;
    allowSharing?: boolean;
    notifySubscribers?: boolean;
    requireApproval?: boolean; // For private channels
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  statistics: {
    totalViews?: number;
    totalReactions?: number;
    totalShares?: number;
    averageEngagement?: number;
  } | null;

  @Column({ type: 'varchar', length: 200, array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'timestamp', nullable: true })
  lastPostAt: Date | null;

  @OneToMany(() => ChannelSubscriber, (subscriber) => subscriber.channel)
  subscribers: ChannelSubscriber[];
}
