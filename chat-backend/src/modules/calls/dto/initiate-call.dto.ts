import { IsEnum, IsOptional, IsString, IsArray, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CallType } from '../entities/call.entity';

export class InitiateCallDto {
  @ApiPropertyOptional({ description: 'Conversation ID for group calls' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'Participant user IDs (for direct calls)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];

  @ApiProperty({ description: 'Call type', enum: CallType, default: CallType.VIDEO })
  @IsEnum(CallType)
  type: CallType;

  @ApiPropertyOptional({ description: 'Enable call recording', default: false })
  @IsOptional()
  @IsBoolean()
  isRecorded?: boolean;
}
