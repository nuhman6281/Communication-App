import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRecordingDto {
  @ApiProperty({ description: 'Recording URL', required: false })
  @IsOptional()
  @IsString()
  recordingUrl?: string;

  @ApiProperty({ description: 'Recording metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
