import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { UserRole } from '@common/constants';
import { User } from '@modules/users/entities/user.entity';
import { Conversation } from './conversation.entity';

@Entity('conversation_participants')
@Index(['conversationId', 'userId'], { unique: true })
@Index(['userId'])
@Index(['conversationId'])
export class ConversationParticipant extends BaseEntity {
  @ManyToOne(() => Conversation, (conversation) => conversation.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ type: 'uuid', name: 'conversation_id' })
  conversationId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  role: UserRole;

  @Column({ type: 'boolean', name: 'is_muted', default: false })
  isMuted: boolean;

  @Column({ type: 'boolean', name: 'is_archived', default: false })
  isArchived: boolean;

  @Column({ type: 'boolean', name: 'is_pinned', default: false })
  isPinned: boolean;

  @Column({ type: 'uuid', name: 'last_read_message_id', nullable: true })
  lastReadMessageId?: string;

  @Column({ type: 'timestamp', name: 'last_read_at', nullable: true })
  lastReadAt?: Date;

  @Column({ type: 'timestamp', name: 'joined_at', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @Column({ type: 'timestamp', name: 'left_at', nullable: true })
  leftAt?: Date;

  @Column({ type: 'integer', name: 'unread_count', default: 0 })
  unreadCount: number;

  @Column({ type: 'jsonb', name: 'notification_settings', nullable: true })
  notificationSettings?: {
    enabled: boolean;
    sound: boolean;
    preview: boolean;
  };

  // For group invites
  @Column({ type: 'uuid', name: 'invited_by_id', nullable: true })
  invitedById?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invited_by_id' })
  invitedBy?: User;
}
