import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';
import { Message } from './message.entity';

@Entity('message_reactions')
@Index(['messageId', 'userId', 'emoji'], { unique: true })
@Index(['messageId'])
@Index(['userId'])
export class MessageReaction extends BaseEntity {
  @Column({ type: 'uuid', name: 'message_id' })
  messageId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  emoji: string; // Emoji unicode or shortcode (e.g., "👍", ":thumbsup:")

  // Relationships
  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
