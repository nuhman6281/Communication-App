import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsInt,
  IsObject,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoryType, StoryPrivacy } from '../entities/story.entity';

export class CreateStoryDto {
  @ApiProperty({ enum: StoryType, description: 'Type of story content' })
  @IsEnum(StoryType)
  type: StoryType;

  @ApiPropertyOptional({ description: 'Media URL (for image/video stories)' })
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL (for video stories)' })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Text content (for text stories)' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Caption for the story' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  caption?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds (for video stories)', minimum: 1, maximum: 60 })
  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  duration?: number;

  @ApiProperty({
    enum: StoryPrivacy,
    default: StoryPrivacy.PUBLIC,
    description: 'Privacy setting for the story',
  })
  @IsEnum(StoryPrivacy)
  @IsOptional()
  privacy?: StoryPrivacy;

  @ApiPropertyOptional({ description: 'User IDs who can view (for CUSTOM privacy)', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  customViewers?: string[];

  @ApiPropertyOptional({ description: 'User IDs who cannot view', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  blockedViewers?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata for the story' })
  @IsObject()
  @IsOptional()
  metadata?: {
    width?: number;
    height?: number;
    size?: number;
    format?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
    [key: string]: any;
  };
}
