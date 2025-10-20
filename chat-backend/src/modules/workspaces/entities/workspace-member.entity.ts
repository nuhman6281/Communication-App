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
import { Workspace } from './workspace.entity';

export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
  GUEST = 'guest',
}

export enum MemberStatus {
  ACTIVE = 'active',
  INVITED = 'invited',
  SUSPENDED = 'suspended',
  LEFT = 'left',
}

@Entity('workspace_members')
@Unique(['workspaceId', 'userId'])
@Index(['workspaceId'])
@Index(['userId'])
@Index(['role'])
@Index(['status'])
export class WorkspaceMember extends BaseEntity {
  // Relations
  @Column({ type: 'uuid', name: 'workspace_id' })
  workspaceId: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Role & Permissions
  @Column({
    type: 'enum',
    enum: WorkspaceRole,
    default: WorkspaceRole.MEMBER,
  })
  role: WorkspaceRole;

  @Column({ type: 'jsonb', default: [], name: 'custom_permissions' })
  customPermissions: string[];
  // Example: ['manage_channels', 'invite_members', 'manage_settings']

  // Status
  @Column({
    type: 'enum',
    enum: MemberStatus,
    default: MemberStatus.INVITED,
  })
  status: MemberStatus;

  // Invitation
  @Column({ type: 'uuid', nullable: true, name: 'invited_by_id' })
  invitedById: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'invited_by_id' })
  invitedBy: User | null;

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true, name: 'invite_code' })
  inviteCode: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'invited_at' })
  invitedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'joined_at' })
  joinedAt: Date | null;

  // Activity
  @Column({ type: 'timestamp', nullable: true, name: 'last_seen_at' })
  lastSeenAt: Date | null;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
