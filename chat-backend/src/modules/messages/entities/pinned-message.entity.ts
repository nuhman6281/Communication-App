import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Message } from './message.entity';
import { User } from '@modules/users/entities/user.entity';

@Entity('pinned_messages')
@Index(['conversationId', 'pinnedAt'])
@Index(['messageId'])
export class PinnedMessage extends BaseEntity {
  @Column({ type: 'uuid', name: 'conversation_id' })
  conversationId: string;

  @Column({ type: 'uuid', name: 'message_id' })
  messageId: string;

  @Column({ type: 'uuid', name: 'pinned_by_id' })
  pinnedById: string;

  @Column({ type: 'timestamp', name: 'pinned_at', default: () => 'CURRENT_TIMESTAMP' })
  pinnedAt: Date;

  // Relationships
  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pinned_by_id' })
  pinnedBy: User;
}
