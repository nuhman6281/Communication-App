import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceSettings } from '../entities/workspace.entity';

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ description: 'Workspace name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Workspace description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Logo URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Banner URL' })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({ description: 'Workspace settings' })
  @IsOptional()
  @IsObject()
  settings?: WorkspaceSettings;

  @ApiPropertyOptional({ description: 'Is workspace active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
