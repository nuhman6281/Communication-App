import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsObject,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { MessageType } from '@common/constants';

export class CreateMessageDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Conversation ID',
  })
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({
    example: 'Hello, how are you?',
    description: 'Message content (text, caption, etc.)',
    required: false,
    maxLength: 10000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  content?: string;

  @ApiProperty({
    example: MessageType.TEXT,
    description: 'Type of message',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  @IsEnum(MessageType)
  @IsOptional()
  @Transform(({ obj }) => obj.messageType || obj.type || MessageType.TEXT)
  messageType?: MessageType;

  // Alias for messageType (for backwards compatibility)
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of message being replied to',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  replyToId?: string;

  @ApiProperty({
    example: { url: 'https://...', size: 1024, mimeType: 'image/png' },
    description: 'Additional metadata for media, location, poll, etc.',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
