import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsEnum,
  ArrayMinSize,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConversationType } from '@common/constants';

export class CreateConversationDto {
  @ApiProperty({
    enum: ConversationType,
    description: 'Type of conversation',
    example: ConversationType.DIRECT,
  })
  @IsEnum(ConversationType)
  type: ConversationType;

  @ApiProperty({
    description: 'Participant user IDs',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  participantIds: string[];

  @ApiProperty({
    description: 'Conversation name (required for groups/channels)',
    required: false,
    example: 'Project Team',
  })
  @IsOptional()
  @ValidateIf((o) => o.type !== ConversationType.DIRECT)
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Conversation description',
    required: false,
    example: 'Discussion about the new project',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Avatar URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
