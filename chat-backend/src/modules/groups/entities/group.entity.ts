import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';
import { Conversation } from '@modules/conversations/entities/conversation.entity';
import { GroupMember } from './group-member.entity';

export enum GroupType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  SECRET = 'secret',
}

export enum GroupPrivacy {
  OPEN = 'open', // Anyone can join
  APPROVAL_REQUIRED = 'approval_required', // Admin approval needed
  INVITE_ONLY = 'invite_only', // Only via invite
}

@Entity('groups')
@Index(['type', 'isActive'])
@Index(['createdById'])
export class Group extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImageUrl: string | null;

  @Column({
    type: 'enum',
    enum: GroupType,
    default: GroupType.PRIVATE,
  })
  type: GroupType;

  @Column({
    type: 'enum',
    enum: GroupPrivacy,
    default: GroupPrivacy.INVITE_ONLY,
  })
  privacy: GroupPrivacy;

  @Column({ type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @OneToMany(() => GroupMember, (member) => member.group)
  members: GroupMember[];

  @Column({ type: 'integer', default: 256 })
  maxMembers: number;

  @Column({ type: 'integer', default: 0 })
  memberCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    allowMemberInvites?: boolean;
    allowMemberPosts?: boolean;
    allowMemberMedia?: boolean;
    moderationEnabled?: boolean;
    linkPreviewEnabled?: boolean;
    disappearingMessages?: {
      enabled: boolean;
      duration: number;
    };
    [key: string]: any;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  rules: {
    title: string;
    description: string;
  }[] | null;

  @Column({ type: 'varchar', length: 200, array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string | null;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date | null;
}
