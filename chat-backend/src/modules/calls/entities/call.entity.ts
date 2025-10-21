import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '@modules/users/entities/user.entity';
import { Conversation } from '@modules/conversations/entities/conversation.entity';

export enum CallType {
  AUDIO = 'audio',
  VIDEO = 'video',
}

export enum CallStatus {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  ONGOING = 'ongoing',
  ENDED = 'ended',
  MISSED = 'missed',
  DECLINED = 'declined',
  FAILED = 'failed',
}

@Entity('calls')
export class Call {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  initiatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'initiatorId' })
  initiator: User;

  @Column({ nullable: true })
  conversationId: string;

  @ManyToOne(() => Conversation, { nullable: true })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column({ type: 'enum', enum: CallType })
  type: CallType;

  @Column({ type: 'enum', enum: CallStatus, default: CallStatus.INITIATED })
  status: CallStatus;

  @Column({ nullable: true })
  jitsiRoomId: string;

  @Column({ nullable: true })
  jitsiRoomUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  participants: string[]; // Array of user IDs

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  endedAt: Date;

  @Column({ type: 'int', default: 0 })
  duration: number; // in seconds

  @Column({ default: false })
  isRecorded: boolean;

  @Column({ nullable: true })
  recordingUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
