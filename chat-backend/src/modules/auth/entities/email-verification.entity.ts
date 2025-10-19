import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';

@Entity('email_verifications')
@Index(['token'], { unique: true })
@Index(['userId'])
export class EmailVerification extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'boolean', name: 'is_used', default: false })
  isUsed: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
