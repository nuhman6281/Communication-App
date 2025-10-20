import {
  Entity,
  Column,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { ConversationType } from '@common/constants';
import { User } from '@modules/users/entities/user.entity';
import { ConversationParticipant } from './conversation-participant.entity';

@Entity('conversations')
@Index(['type'])
@Index(['createdById'])
export class Conversation extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DIRECT,
  })
  type: ConversationType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: User;

  @Column({ type: 'uuid', name: 'created_by_id', nullable: true })
  createdById?: string;

  @Column({ type: 'uuid', name: 'last_message_id', nullable: true })
  lastMessageId?: string;

  @Column({ type: 'timestamp', name: 'last_message_at', nullable: true })
  lastMessageAt?: Date;

  @Column({ type: 'boolean', name: 'is_group', default: false })
  isGroup: boolean;

  @Column({ type: 'boolean', name: 'is_channel', default: false })
  isChannel: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Relationships
  @OneToMany(
    () => ConversationParticipant,
    (participant) => participant.conversation,
    { cascade: true },
  )
  participants: ConversationParticipant[];

  // Channel relationship (for channel-type conversations)
  @OneToOne('Channel', 'conversation', { nullable: true })
  channel?: any; // Using any to avoid circular dependency

  // Virtual field for participant count (will be loaded separately)
  participantCount?: number;
}
