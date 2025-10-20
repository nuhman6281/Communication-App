import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  MaxLength,
  Matches,
  IsObject,
  MinLength,
  IsUUID,
} from 'class-validator';
import { ChannelType, ChannelCategory } from '../entities/channel.entity';

export class CreateChannelDto {
  @ApiProperty({ description: 'Channel name' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Channel handle (unique identifier like @channelname)' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'Handle can only contain lowercase letters, numbers, and underscores',
  })
  handle: string;

  @ApiProperty({ description: 'Channel description', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: ChannelType, required: false })
  @IsOptional()
  @IsEnum(ChannelType)
  type?: ChannelType;

  @ApiProperty({ enum: ChannelCategory, required: false })
  @IsOptional()
  @IsEnum(ChannelCategory)
  category?: ChannelCategory;

  @ApiProperty({ description: 'Avatar URL', required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ description: 'Banner URL', required: false })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiProperty({ description: 'Channel tags', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Channel settings', required: false })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiProperty({
    description: 'Workspace ID (optional - for workspace-owned channels)',
    required: false
  })
  @IsOptional()
  @IsUUID('4')
  workspaceId?: string;
}
