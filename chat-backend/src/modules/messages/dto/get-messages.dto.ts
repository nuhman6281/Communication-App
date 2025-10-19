import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsUUID } from 'class-validator';

export class GetMessagesDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Conversation ID',
  })
  @IsUUID()
  conversationId: string;

  @ApiProperty({
    example: 1,
    description: 'Page number',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 50,
    description: 'Number of messages per page',
    required: false,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Load messages before this message ID (for pagination)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  beforeMessageId?: string;
}
