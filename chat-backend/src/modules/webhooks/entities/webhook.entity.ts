import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum WebhookEvent {
  MESSAGE_SENT = 'message.sent',
  MESSAGE_UPDATED = 'message.updated',
  MESSAGE_DELETED = 'message.deleted',
  CONVERSATION_CREATED = 'conversation.created',
  USER_JOINED = 'user.joined',
  USER_LEFT = 'user.left',
  CALL_STARTED = 'call.started',
  CALL_ENDED = 'call.ended',
}

@Entity('webhooks')
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // Owner of the webhook

  @Column()
  url: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'simple-array' })
  events: WebhookEvent[];

  @Column({ nullable: true })
  secret: string; // For HMAC signature verification

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  failureCount: number;

  @Column({ nullable: true })
  lastTriggeredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
