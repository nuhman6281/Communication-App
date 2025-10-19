import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PresenceStatus } from '../entities/presence.entity';

export class UpdatePresenceDto {
  @ApiProperty({
    description: 'User presence status',
    enum: PresenceStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(PresenceStatus)
  status?: PresenceStatus;

  @ApiProperty({
    description: 'Custom status message',
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  customStatus?: string;
}
