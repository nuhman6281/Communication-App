import { IsOptional, IsString, IsEnum, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BlockUserDto {
  @ApiProperty({ example: 'User is sending spam messages', description: 'Reason for blocking', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({ example: false, description: 'Submit a report along with blocking', required: false })
  @IsOptional()
  @IsBoolean()
  reportSubmitted?: boolean;

  @ApiProperty({ enum: ['spam', 'harassment', 'inappropriate', 'other'], description: 'Report category', required: false })
  @IsOptional()
  @IsEnum(['spam', 'harassment', 'inappropriate', 'other'])
  reportCategory?: 'spam' | 'harassment' | 'inappropriate' | 'other';
}
