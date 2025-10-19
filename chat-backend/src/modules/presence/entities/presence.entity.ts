import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';

export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  DO_NOT_DISTURB = 'do_not_disturb',
  OFFLINE = 'offline',
}

@Entity('presence')
@Index(['userId', 'status'])
@Index(['lastSeenAt'])
export class Presence extends BaseEntity {
  @Column({ type: 'uuid', unique: true })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: PresenceStatus,
    default: PresenceStatus.OFFLINE,
  })
  status: PresenceStatus;

  @Column({ type: 'varchar', length: 200, nullable: true })
  customStatus: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  devices: {
    deviceId: string;
    type: 'web' | 'mobile' | 'desktop';
    lastActive: Date;
  }[] | null;

  @Column({ type: 'boolean', default: false })
  showAsAway: boolean;

  @Column({ type: 'timestamp', nullable: true })
  awayAt: Date | null;

  @Column({ type: 'integer', default: 300 })
  awayTimeoutSeconds: number;
}
