import { IsString, IsEnum, IsOptional, IsObject, IsUrl, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { NotificationType, NotificationPriority } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Recipient user ID' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Sender user ID' })
  @IsOptional()
  senderId?: string | null;

  @ApiProperty({ enum: NotificationType, description: 'Type of notification' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification body' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ description: 'Additional data' })
  @IsObject()
  @IsOptional()
  data?: {
    conversationId?: string;
    messageId?: string;
    groupId?: string;
    channelId?: string;
    callId?: string;
    storyId?: string;
    url?: string;
    [key: string]: any;
  };

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Action URL' })
  @IsUrl()
  @IsOptional()
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Expiration time' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresAt?: Date;
}
