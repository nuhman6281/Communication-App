import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoryReplyDto {
  @ApiProperty({ description: 'Reply message content' })
  @IsString()
  @MaxLength(1000)
  content: string;

  @ApiPropertyOptional({ description: 'Media URL for reply (optional)' })
  @IsString()
  @IsOptional()
  mediaUrl?: string;
}
