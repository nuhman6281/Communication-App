import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class JoinCallDto {
  @ApiPropertyOptional({ description: 'Enable video on join', default: true })
  @IsOptional()
  @IsBoolean()
  videoEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable audio on join', default: true })
  @IsOptional()
  @IsBoolean()
  audioEnabled?: boolean;
}
