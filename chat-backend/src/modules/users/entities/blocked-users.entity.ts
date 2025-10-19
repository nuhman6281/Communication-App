import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from './user.entity';

@Entity('blocked_users')
@Index(['blockerId', 'blockedId'], { unique: true })
export class BlockedUser extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocker_id' })
  blocker: User;

  @Column({ type: 'uuid', name: 'blocker_id' })
  blockerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocked_id' })
  blocked: User;

  @Column({ type: 'uuid', name: 'blocked_id' })
  blockedId: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'boolean', name: 'report_submitted', default: false })
  reportSubmitted: boolean;

  @Column({
    type: 'enum',
    enum: ['spam', 'harassment', 'inappropriate', 'other'],
    name: 'report_category',
    nullable: true,
  })
  reportCategory?: 'spam' | 'harassment' | 'inappropriate' | 'other';
}
