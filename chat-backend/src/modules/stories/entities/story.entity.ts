import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';
import { StoryView } from './story-view.entity';
import { StoryReply } from './story-reply.entity';

export enum StoryType {
  IMAGE = 'image',
  VIDEO = 'video',
  TEXT = 'text',
}

export enum StoryPrivacy {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  CUSTOM = 'custom',
}

@Entity('stories')
@Index(['userId', 'expiresAt'])
@Index(['expiresAt'])
@Index(['createdAt'])
export class Story extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: StoryType })
  type: StoryType;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  mediaUrl: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  thumbnailUrl: string | null;

  @Column({ type: 'text', nullable: true })
  content: string | null; // For text stories

  @Column({ type: 'varchar', length: 500, nullable: true })
  caption: string | null;

  @Column({ type: 'int', default: 0 })
  duration: number; // Duration in seconds (for videos)

  @Column({ type: 'enum', enum: StoryPrivacy, default: StoryPrivacy.PUBLIC })
  privacy: StoryPrivacy;

  @Column({ type: 'text', array: true, nullable: true, default: null })
  customViewers: string[] | null; // User IDs who can view (for CUSTOM privacy)

  @Column({ type: 'text', array: true, nullable: true, default: null })
  blockedViewers: string[] | null; // User IDs who cannot view

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    width?: number;
    height?: number;
    size?: number;
    format?: string;
    backgroundColor?: string; // For text stories
    textColor?: string; // For text stories
    fontFamily?: string; // For text stories
    [key: string]: any;
  } | null;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  replyCount: number;

  @Column({ type: 'boolean', default: false })
  isHighlight: boolean; // If saved to highlights (permanent)

  @Column({ type: 'varchar', length: 255, nullable: true })
  highlightName: string | null; // Name of the highlight collection

  @Column({ type: 'timestamp' })
  expiresAt: Date; // Stories expire after 24 hours

  @OneToMany(() => StoryView, (view) => view.story, { cascade: true })
  views: StoryView[];

  @OneToMany(() => StoryReply, (reply) => reply.story, { cascade: true })
  replies: StoryReply[];

  // Virtual property to check if story is expired
  get isExpired(): boolean {
    return !this.isHighlight && new Date() > this.expiresAt;
  }

  // Virtual property to check if story is active
  get isActive(): boolean {
    return this.isHighlight || new Date() <= this.expiresAt;
  }
}
