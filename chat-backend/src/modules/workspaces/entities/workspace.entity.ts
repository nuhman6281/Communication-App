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
import { WorkspaceMember } from './workspace-member.entity';

export interface WorkspaceSettings {
  allowPersonalDms?: boolean;
  allowExternalGroups?: boolean;
  requireEmailDomain?: string[];
  ssoEnabled?: boolean;
  samlConfig?: Record<string, any>;
  defaultMemberPermissions?: string[];
  allowGuestInvites?: boolean;
  maxMembers?: number;
  customBranding?: {
    primaryColor?: string;
    logo?: string;
    theme?: 'light' | 'dark' | 'auto';
  };
}

@Entity('workspaces')
@Index(['slug'])
@Index(['ownerId'])
@Index(['isActive'])
export class Workspace extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'logo_url' })
  logoUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'banner_url' })
  bannerUrl: string | null;

  // Owner
  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  // Settings
  @Column({ type: 'jsonb', default: {} })
  settings: WorkspaceSettings;

  // Statistics
  @Column({ type: 'integer', default: 0, name: 'member_count' })
  memberCount: number;

  @Column({ type: 'integer', default: 0, name: 'channel_count' })
  channelCount: number;

  @Column({ type: 'integer', default: 0, name: 'group_count' })
  groupCount: number;

  // Status
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  // Relationships
  @OneToMany(() => WorkspaceMember, (member) => member.workspace, {
    cascade: true,
  })
  members: WorkspaceMember[];

  // Virtual fields
  currentUserMembership?: WorkspaceMember;
  currentUserRole?: string;
}
