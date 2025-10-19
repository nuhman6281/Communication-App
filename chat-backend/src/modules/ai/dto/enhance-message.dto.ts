import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageTone } from './chat-completion.dto';

export class EnhanceMessageDto {
  @ApiProperty({ description: 'Message to enhance' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Desired tone', enum: MessageTone })
  @IsEnum(MessageTone)
  tone: MessageTone;

  @ApiPropertyOptional({ description: 'Additional context' })
  @IsOptional()
  @IsString()
  context?: string;
}
