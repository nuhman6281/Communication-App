import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { PresenceStatus } from '@common/constants';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name', nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name', nullable: true })
  lastName?: string;

  @Column({ type: 'text', name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  status?: string;

  @Column({ type: 'boolean', name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', name: 'is_online', default: false })
  isOnline: boolean;

  @Column({ type: 'timestamp', name: 'last_seen', nullable: true })
  lastSeen?: Date;

  @Column({
    type: 'enum',
    enum: PresenceStatus,
    name: 'presence_status',
    default: PresenceStatus.OFFLINE,
  })
  presenceStatus: PresenceStatus;

  @Column({ type: 'varchar', length: 255, name: 'mfa_secret', nullable: true })
  mfaSecret?: string;

  @Column({ type: 'boolean', name: 'mfa_enabled', default: false })
  mfaEnabled: boolean;

  // Relationships will be added as modules are implemented
  // @OneToMany(() => Message, (message) => message.sender)
  // messages: Message[];
}
