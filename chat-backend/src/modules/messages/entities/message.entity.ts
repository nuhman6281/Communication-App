import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { MessageType } from '@common/constants';
import { User } from '@modules/users/entities/user.entity';
import { MessageReaction } from './message-reaction.entity';

@Entity('messages')
@Index(['conversationId', 'createdAt'])
@Index(['senderId'])
export class Message extends BaseEntity {
  @Column({ type: 'uuid', name: 'conversation_id' })
  conversationId: string;

  @Column({ type: 'uuid', name: 'sender_id' })
  senderId: string;

  @Column({ type: 'uuid', name: 'reply_to_id', nullable: true })
  replyToId?: string;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    name: 'message_type',
    default: MessageType.TEXT,
  })
  messageType: MessageType;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'boolean', name: 'is_edited', default: false })
  isEdited: boolean;

  @Column({ type: 'boolean', name: 'is_deleted', default: false })
  isDeleted: boolean;

  // Relationships
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reply_to_id' })
  replyTo?: Message;

  // Additional relationships will be added as modules are implemented
  @OneToMany(() => MessageReaction, (reaction) => reaction.message)
  reactions: MessageReaction[];

  // @OneToMany(() => Media, (media) => media.message)
  // media: Media[];
}
