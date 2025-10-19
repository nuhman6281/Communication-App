import { Entity, Column, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from './user.entity';

@Entity('user_settings')
export class UserSettings extends BaseEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId: string;

  // Privacy Settings
  @Column({
    type: 'enum',
    enum: ['everyone', 'contacts', 'nobody'],
    name: 'profile_visibility',
    default: 'everyone',
  })
  profileVisibility: 'everyone' | 'contacts' | 'nobody';

  @Column({
    type: 'enum',
    enum: ['everyone', 'contacts', 'nobody'],
    name: 'last_seen_visibility',
    default: 'everyone',
  })
  lastSeenVisibility: 'everyone' | 'contacts' | 'nobody';

  @Column({
    type: 'enum',
    enum: ['everyone', 'contacts', 'nobody'],
    name: 'read_receipts_visibility',
    default: 'everyone',
  })
  readReceiptsVisibility: 'everyone' | 'contacts' | 'nobody';

  @Column({ type: 'boolean', name: 'show_online_status', default: true })
  showOnlineStatus: boolean;

  @Column({ type: 'boolean', name: 'allow_group_invites', default: true })
  allowGroupInvites: boolean;

  @Column({
    type: 'enum',
    enum: ['everyone', 'contacts', 'nobody'],
    name: 'who_can_message',
    default: 'everyone',
  })
  whoCanMessage: 'everyone' | 'contacts' | 'nobody';

  // Notification Settings
  @Column({ type: 'boolean', name: 'push_notifications_enabled', default: true })
  pushNotificationsEnabled: boolean;

  @Column({ type: 'boolean', name: 'email_notifications_enabled', default: true })
  emailNotificationsEnabled: boolean;

  @Column({ type: 'boolean', name: 'message_notifications', default: true })
  messageNotifications: boolean;

  @Column({ type: 'boolean', name: 'group_notifications', default: true })
  groupNotifications: boolean;

  @Column({ type: 'boolean', name: 'mention_notifications', default: true })
  mentionNotifications: boolean;

  @Column({ type: 'boolean', name: 'reaction_notifications', default: true })
  reactionNotifications: boolean;

  @Column({ type: 'boolean', name: 'call_notifications', default: true })
  callNotifications: boolean;

  @Column({ type: 'boolean', name: 'notification_sound', default: true })
  notificationSound: boolean;

  @Column({ type: 'varchar', length: 50, name: 'notification_tone', default: 'default' })
  notificationTone: string;

  // App Settings
  @Column({
    type: 'enum',
    enum: ['light', 'dark', 'auto'],
    default: 'auto',
  })
  theme: 'light' | 'dark' | 'auto';

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone: string;

  @Column({ type: 'boolean', name: 'auto_download_images', default: true })
  autoDownloadImages: boolean;

  @Column({ type: 'boolean', name: 'auto_download_videos', default: false })
  autoDownloadVideos: boolean;

  @Column({ type: 'boolean', name: 'auto_download_documents', default: false })
  autoDownloadDocuments: boolean;

  // Chat Settings
  @Column({ type: 'boolean', name: 'send_on_enter', default: true })
  sendOnEnter: boolean;

  @Column({ type: 'boolean', name: 'show_typing_indicator', default: true })
  showTypingIndicator: boolean;

  @Column({ type: 'boolean', name: 'archive_chats', default: false })
  archiveChats: boolean;

  @Column({ type: 'integer', name: 'message_text_size', default: 14 })
  messageTextSize: number;

  // Security Settings
  @Column({ type: 'boolean', name: 'two_step_verification', default: false })
  twoStepVerification: boolean;

  @Column({ type: 'boolean', name: 'blocked_contact_notifications', default: false })
  blockedContactNotifications: boolean;

  // AI Settings (for premium features)
  @Column({ type: 'boolean', name: 'ai_assistant_enabled', default: false })
  aiAssistantEnabled: boolean;

  @Column({ type: 'boolean', name: 'ai_message_suggestions', default: false })
  aiMessageSuggestions: boolean;

  @Column({ type: 'boolean', name: 'ai_translation_enabled', default: false })
  aiTranslationEnabled: boolean;

  @Column({ type: 'varchar', length: 10, name: 'ai_translation_target_lang', nullable: true })
  aiTranslationTargetLang?: string;
}
