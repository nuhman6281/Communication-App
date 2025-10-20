import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { GroupType, GroupPrivacy } from '../entities/group.entity';

export class CreateGroupDto {
  @ApiProperty({ description: 'Group name' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Group description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: GroupType, required: false })
  @IsOptional()
  @IsEnum(GroupType)
  type?: GroupType;

  @ApiProperty({ enum: GroupPrivacy, required: false })
  @IsOptional()
  @IsEnum(GroupPrivacy)
  privacy?: GroupPrivacy;

  @ApiProperty({ description: 'Initial member IDs', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds?: string[];

  @ApiProperty({ description: 'Maximum members', required: false })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(10000)
  maxMembers?: number;

  @ApiProperty({ description: 'Group settings', required: false })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiProperty({ description: 'Group tags', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Group category', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: 'Workspace ID (optional - for workspace-owned groups)',
    required: false
  })
  @IsOptional()
  @IsUUID('4')
  workspaceId?: string;
}
