import { IsOptional, IsEnum, IsBoolean, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
  // Privacy Settings
  @ApiProperty({ enum: ['everyone', 'contacts', 'nobody'], required: false })
  @IsOptional()
  @IsEnum(['everyone', 'contacts', 'nobody'])
  profileVisibility?: 'everyone' | 'contacts' | 'nobody';

  @ApiProperty({ enum: ['everyone', 'contacts', 'nobody'], required: false })
  @IsOptional()
  @IsEnum(['everyone', 'contacts', 'nobody'])
  lastSeenVisibility?: 'everyone' | 'contacts' | 'nobody';

  @ApiProperty({ enum: ['everyone', 'contacts', 'nobody'], required: false })
  @IsOptional()
  @IsEnum(['everyone', 'contacts', 'nobody'])
  readReceiptsVisibility?: 'everyone' | 'contacts' | 'nobody';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showOnlineStatus?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowGroupInvites?: boolean;

  @ApiProperty({ enum: ['everyone', 'contacts', 'nobody'], required: false })
  @IsOptional()
  @IsEnum(['everyone', 'contacts', 'nobody'])
  whoCanMessage?: 'everyone' | 'contacts' | 'nobody';

  // Notification Settings
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  pushNotificationsEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  emailNotificationsEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  messageNotifications?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  groupNotifications?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  mentionNotifications?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  reactionNotifications?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  callNotifications?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  notificationSound?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notificationTone?: string;

  // App Settings
  @ApiProperty({ enum: ['light', 'dark', 'auto'], required: false })
  @IsOptional()
  @IsEnum(['light', 'dark', 'auto'])
  theme?: 'light' | 'dark' | 'auto';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  autoDownloadImages?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  autoDownloadVideos?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  autoDownloadDocuments?: boolean;

  // Chat Settings
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  sendOnEnter?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showTypingIndicator?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  archiveChats?: boolean;

  @ApiProperty({ required: false, minimum: 10, maximum: 24 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(24)
  messageTextSize?: number;

  // Security Settings
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  twoStepVerification?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  blockedContactNotifications?: boolean;

  // AI Settings
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  aiAssistantEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  aiMessageSuggestions?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  aiTranslationEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  aiTranslationTargetLang?: string;
}
