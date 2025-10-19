import { IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StoryType } from '../entities/story.entity';

export class GetStoriesDto {
  @ApiPropertyOptional({ description: 'Filter by story type', enum: StoryType })
  @IsEnum(StoryType)
  @IsOptional()
  type?: StoryType;

  @ApiPropertyOptional({ description: 'Include only highlights', default: false })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  highlightsOnly?: boolean;

  @ApiPropertyOptional({ description: 'Include only active stories', default: true })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
