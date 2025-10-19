import { IsOptional, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EndCallDto {
  @ApiPropertyOptional({ description: 'Call duration in seconds' })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;
}
