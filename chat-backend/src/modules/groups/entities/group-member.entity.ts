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
import { Group } from './group.entity';

export enum GroupMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
}

export enum GroupMemberStatus {
  ACTIVE = 'active',
  BANNED = 'banned',
  LEFT = 'left',
  PENDING = 'pending', // Waiting for approval
}

@Entity('group_members')
@Unique(['groupId', 'userId'])
@Index(['groupId', 'status'])
@Index(['userId'])
export class GroupMember extends BaseEntity {
  @Column({ type: 'uuid' })
  groupId: string;

  @ManyToOne(() => Group, (group) => group.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: GroupMemberRole,
    default: GroupMemberRole.MEMBER,
  })
  role: GroupMemberRole;

  @Column({
    type: 'enum',
    enum: GroupMemberStatus,
    default: GroupMemberStatus.ACTIVE,
  })
  status: GroupMemberStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  customTitle: string | null;

  @Column({ type: 'timestamp' })
  joinedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  invitedById: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'invitedById' })
  invitedBy: User | null;

  @Column({ type: 'timestamp', nullable: true })
  leftAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  bannedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  bannedById: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'bannedById' })
  bannedBy: User | null;

  @Column({ type: 'text', nullable: true })
  banReason: string | null;

  @Column({ type: 'jsonb', nullable: true })
  permissions: {
    canPostMessages?: boolean;
    canPostMedia?: boolean;
    canInviteMembers?: boolean;
    canRemoveMembers?: boolean;
    canEditGroup?: boolean;
    canPinMessages?: boolean;
    [key: string]: any;
  } | null;

  @Column({ type: 'boolean', default: true })
  notificationsEnabled: boolean;
}
