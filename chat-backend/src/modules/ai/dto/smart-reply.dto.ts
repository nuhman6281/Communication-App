import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SmartReplyDto {
  @ApiProperty({ description: 'Message to generate replies for' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Conversation context' })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ description: 'Number of replies to generate (1-5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  count?: number = 3;
}
