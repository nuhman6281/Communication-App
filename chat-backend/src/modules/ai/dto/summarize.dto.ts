import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SummaryType {
  BRIEF = 'brief',
  DETAILED = 'detailed',
  BULLET_POINTS = 'bullet_points',
  ACTION_ITEMS = 'action_items',
}

export class SummarizeDto {
  @ApiProperty({ description: 'Text or conversation to summarize' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ description: 'Type of summary', enum: SummaryType })
  @IsOptional()
  @IsEnum(SummaryType)
  type?: SummaryType = SummaryType.BRIEF;

  @ApiPropertyOptional({ description: 'Additional context for summarization' })
  @IsOptional()
  @IsString()
  context?: string;
}
