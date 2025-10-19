import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStoryDto {
  @ApiPropertyOptional({ description: 'Update caption' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  caption?: string;

  @ApiPropertyOptional({ description: 'Save story to highlights' })
  @IsBoolean()
  @IsOptional()
  isHighlight?: boolean;

  @ApiPropertyOptional({ description: 'Highlight collection name' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  highlightName?: string;
}
