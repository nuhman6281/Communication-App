import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';
import { Message } from './message.entity';

@Entity('message_reads')
@Index(['messageId', 'userId'], { unique: true })
@Index(['messageId'])
@Index(['userId'])
@Index(['conversationId'])
export class MessageRead extends BaseEntity {
  @Column({ type: 'uuid', name: 'message_id' })
  messageId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'conversation_id' })
  conversationId: string;

  @Column({ type: 'timestamp', name: 'read_at', default: () => 'CURRENT_TIMESTAMP' })
  readAt: Date;

  // Relationships
  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
