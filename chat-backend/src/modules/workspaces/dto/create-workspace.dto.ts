import { IsString, IsOptional, IsObject, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceSettings } from '../entities/workspace.entity';

export class CreateWorkspaceDto {
  @ApiProperty({
    description: 'Workspace name',
    example: 'Acme Corporation',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Unique URL-friendly slug',
    example: 'acme-corp',
    pattern: '^[a-z0-9-]+$',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiPropertyOptional({
    description: 'Workspace description',
    example: 'A workspace for Acme Corporation team collaboration',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Logo URL',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Banner URL',
    example: 'https://example.com/banner.png',
  })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({
    description: 'Workspace settings',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  settings?: WorkspaceSettings;
}
