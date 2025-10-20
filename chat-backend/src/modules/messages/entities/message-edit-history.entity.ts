import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Message } from './message.entity';

@Entity('message_edit_history')
@Index(['messageId', 'editedAt'])
export class MessageEditHistory extends BaseEntity {
  @Column({ type: 'uuid', name: 'message_id' })
  messageId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'timestamp', name: 'edited_at', default: () => 'CURRENT_TIMESTAMP' })
  editedAt: Date;

  // Relationships
  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;
}
