import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { PresenceStatus } from '@common/constants';

export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

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

  @Column({ type: 'varchar', length: 50, name: 'oauth_provider', nullable: true })
  oauthProvider?: string;

  @Column({ type: 'varchar', length: 255, name: 'oauth_provider_id', nullable: true })
  oauthProviderId?: string;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    name: 'subscription_tier',
    default: SubscriptionTier.FREE,
  })
  subscriptionTier: SubscriptionTier;

  @Column({ type: 'timestamp', name: 'subscription_expires_at', nullable: true })
  subscriptionExpiresAt?: Date;

  @Column({ type: 'varchar', length: 255, name: 'stripe_customer_id', nullable: true })
  stripeCustomerId?: string;

  @Column({ type: 'varchar', length: 255, name: 'stripe_subscription_id', nullable: true })
  stripeSubscriptionId?: string;

  // Relationships will be added as modules are implemented
  // @OneToMany(() => Message, (message) => message.sender)
  // messages: Message[];
}
